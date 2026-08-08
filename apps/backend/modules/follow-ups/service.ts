import { ClinicalNoteStatus, FollowUpStatus, Role, type Prisma } from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { FollowUpDetail, FollowUpRepository } from "./repository.js";
import type {
  CompleteFollowUpInput,
  CreateFollowUpInput,
  FollowUpListQuery,
  RescheduleFollowUpInput,
} from "./validation.js";

export class FollowUpService {
  public constructor(
    private readonly repository: FollowUpRepository,
    private readonly access: AccessPolicy,
  ) {}

  public async create(userId: string, role: Role, input: CreateFollowUpInput) {
    const note = await this.repository.clinicalContext(input.clinicalNoteId);
    if (
      !note ||
      note.patientId !== input.patientId ||
      note.appointmentId !== input.appointmentId ||
      note.status !== ClinicalNoteStatus.FINAL
    ) {
      throw new AppError("Final clinical note not found.", 404, "RESOURCE_NOT_FOUND");
    }
    if (!note.patient.registeredBy) {
      throw new AppError("Patient has no assigned ASHA worker.", 422, "ASHA_NOT_ASSIGNED");
    }
    if (role === Role.DOCTOR) {
      const doctor = await this.access.requireDoctor(userId);
      if (note.doctorId !== doctor.id) throw this.access.forbidden();
      if (!note.followUpRequired) {
        throw new AppError(
          "The clinical note does not recommend a follow-up.",
          409,
          "FOLLOW_UP_NOT_RECOMMENDED",
        );
      }
    } else if (role === Role.PHC_ADMIN) {
      const admin = await this.access.requireAdminPhc(userId);
      if (note.patient.village.phcId !== admin.phcId) throw this.access.forbidden();
    } else {
      throw this.access.forbidden();
    }
    return this.map(
      await this.repository.create(input, note.doctorId, note.patient.registeredBy.id, userId),
    );
  }

  public async get(userId: string, role: Role, id: string) {
    const item = await this.repository.find(id, await this.scope(userId, role));
    if (!item) throw new AppError("Follow-up not found.", 404, "RESOURCE_NOT_FOUND");
    return this.map(item);
  }

  public async history(userId: string, role: Role, id: string) {
    await this.get(userId, role, id);
    return this.repository.history(id);
  }

  public async reschedule(userId: string, role: Role, id: string, input: RescheduleFollowUpInput) {
    if (role !== Role.DOCTOR && role !== Role.PHC_ADMIN) throw this.access.forbidden();
    const item = await this.requireItem(userId, role, id);
    this.assertStatus(
      item.status,
      [FollowUpStatus.PENDING, FollowUpStatus.SCHEDULED, FollowUpStatus.MISSED],
      "reschedule",
    );
    return this.map(await this.repository.reschedule(id, input.scheduledFor, input.reason, userId));
  }

  public async ashaList(userId: string, query: FollowUpListQuery, patientId?: string) {
    const asha = await this.access.requireAsha(userId);
    return this.list(
      { assignedToId: asha.id, patientId: patientId ?? query.patientId },
      query,
      false,
    );
  }

  public async doctorList(userId: string, query: FollowUpListQuery) {
    const doctor = await this.access.requireDoctor(userId);
    return this.list({ doctorId: doctor.id, patientId: query.patientId }, query, false);
  }

  public async phcList(userId: string, query: FollowUpListQuery) {
    const admin = await this.access.requireAdminPhc(userId);
    return this.list({ patient: { village: { phcId: admin.phcId } } }, query, true);
  }

  public async start(userId: string, id: string) {
    const asha = await this.access.requireAsha(userId);
    const item = await this.repository.find(id, { assignedToId: asha.id });
    if (!item) throw new AppError("Follow-up not found.", 404, "RESOURCE_NOT_FOUND");
    this.assertStatus(item.status, [FollowUpStatus.SCHEDULED], "start");
    return this.map(await this.repository.transition(id, FollowUpStatus.IN_PROGRESS, userId));
  }

  public async complete(userId: string, id: string, input: CompleteFollowUpInput) {
    const asha = await this.access.requireAsha(userId);
    const item = await this.repository.find(id, { assignedToId: asha.id });
    if (!item) throw new AppError("Follow-up not found.", 404, "RESOURCE_NOT_FOUND");
    this.assertStatus(item.status, [FollowUpStatus.IN_PROGRESS], "complete");
    const assessment = await this.repository.assessment(
      input.assessmentId,
      item.patientId,
      asha.id,
    );
    if (
      !assessment ||
      !assessment.completedAt ||
      (assessment.followUpId && assessment.followUpId !== id)
    ) {
      throw new AppError(
        "A completed assessment for this follow-up is required.",
        422,
        "FOLLOW_UP_ASSESSMENT_REQUIRED",
      );
    }
    return this.map(
      await this.repository.transition(id, FollowUpStatus.COMPLETED, userId, {
        visited: input.visited,
        reason: input.notes,
        assessmentId: input.assessmentId,
      }),
    );
  }

  public async missed(userId: string, id: string, reason: string) {
    const asha = await this.access.requireAsha(userId);
    const item = await this.repository.find(id, { assignedToId: asha.id });
    if (!item) throw new AppError("Follow-up not found.", 404, "RESOURCE_NOT_FOUND");
    this.assertStatus(
      item.status,
      [FollowUpStatus.SCHEDULED, FollowUpStatus.IN_PROGRESS],
      "mark as missed",
    );
    return this.map(
      await this.repository.transition(id, FollowUpStatus.MISSED, userId, {
        visited: false,
        reason,
      }),
    );
  }

  private async list(
    scope: Prisma.FollowUpWhereInput,
    query: FollowUpListQuery,
    adminFilters: boolean,
  ) {
    const date = query.date
      ? this.day(query.date)
      : query.from || query.to
        ? { gte: query.from, lte: query.to }
        : undefined;
    const where: Prisma.FollowUpWhereInput = {
      AND: [
        scope,
        {
          status: query.status,
          priority: query.priority,
          scheduledDate: date,
          doctorId: adminFilters ? query.doctorId : undefined,
          assignedToId: adminFilters ? query.ashaWorkerId : undefined,
          patient: adminFilters && query.villageId ? { villageId: query.villageId } : undefined,
        },
      ],
    };
    const [items, total] = await this.repository.list(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items: items.map((item) => this.map(item)),
      pagination: { page: query.page, limit: query.limit, total },
    };
  }

  private async requireItem(userId: string, role: Role, id: string) {
    const item = await this.repository.find(id, await this.scope(userId, role));
    if (!item) throw new AppError("Follow-up not found.", 404, "RESOURCE_NOT_FOUND");
    return item;
  }

  private async scope(userId: string, role: Role): Promise<Prisma.FollowUpWhereInput> {
    if (role === Role.ASHA_WORKER)
      return { assignedToId: (await this.access.requireAsha(userId)).id };
    if (role === Role.DOCTOR) return { doctorId: (await this.access.requireDoctor(userId)).id };
    if (role === Role.PHC_ADMIN) {
      const admin = await this.access.requireAdminPhc(userId);
      return { patient: { village: { phcId: admin.phcId } } };
    }
    throw this.access.forbidden();
  }

  private assertStatus(current: FollowUpStatus, allowed: FollowUpStatus[], action: string): void {
    if (!allowed.includes(current)) {
      throw new AppError(
        `Cannot ${action} a follow-up with status ${current}.`,
        409,
        "INVALID_FOLLOW_UP_TRANSITION",
      );
    }
  }

  private day(date: Date): Prisma.DateTimeFilter {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    return { gte: start, lt: new Date(start.getTime() + 86_400_000) };
  }

  private map(item: FollowUpDetail) {
    const latest = item.assessments[0] ?? null;
    return {
      id: item.id,
      patientId: item.patientId,
      patient: { id: item.patient.id, fullName: item.patient.fullName },
      doctorId: item.doctorId,
      doctor: { id: item.doctor.id, fullName: item.doctor.fullName },
      ashaWorker: { id: item.assignedTo.id, fullName: item.assignedTo.fullName },
      clinicalNoteId: item.clinicalNoteId,
      appointmentId: item.appointmentId,
      originalDiagnosis: item.clinicalNote?.diagnosis ?? null,
      scheduledFor: item.scheduledDate,
      completedAt: item.completedDate,
      reason: item.reason,
      notes: item.notes,
      priority: item.priority,
      status: item.status,
      visited: item.visited,
      latestAssessment: latest,
      latestPredictions: latest?.predictions ?? [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
