import {
  ReferralPriority,
  ReferralStatus,
  RiskLevel,
  Role,
  UserStatus,
  type Prisma,
} from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { ReferralDetail, ReferralRepository } from "./repository.js";
import type { AssignDoctorInput, CreateReferralInput, ReferralListQuery } from "./validation.js";

export class ReferralService {
  public constructor(
    private readonly repository: ReferralRepository,
    private readonly access: AccessPolicy,
  ) {}

  public async create(userId: string, input: CreateReferralInput) {
    const asha = await this.access.requireAsha(userId);
    const [patient, assessment, prediction, phc, duplicate] = await this.repository.context(
      input.patientId,
      input.assessmentId,
      input.predictionId,
      input.phcId,
    );
    if (!patient || patient.registeredById !== asha.id) {
      throw new AppError("Patient not found.", 404, "RESOURCE_NOT_FOUND");
    }
    if (!assessment || assessment.patientId !== patient.id) {
      throw new AppError("Assessment not found.", 404, "RESOURCE_NOT_FOUND");
    }
    if (!prediction || prediction.assessmentId !== assessment.id) {
      throw new AppError("Prediction not found.", 404, "RESOURCE_NOT_FOUND");
    }
    if (!phc || !patient.village.phcId || patient.village.phcId !== phc.id) {
      throw new AppError(
        "The selected PHC does not serve the patient's village.",
        422,
        "INVALID_REFERRAL_PHC",
      );
    }
    if (!prediction.prediction && !/REFER|URGENT|EMERGENCY|IMMEDIATE/i.test(prediction.triage)) {
      throw new AppError(
        "The selected prediction does not recommend referral.",
        422,
        "PREDICTION_NOT_REFERABLE",
      );
    }
    if (duplicate) {
      throw new AppError(
        "A referral already exists for this prediction.",
        409,
        "REFERRAL_ALREADY_EXISTS",
      );
    }
    const priority = this.priority(prediction.riskLevel, prediction.triage);
    if (input.priority && input.priority !== priority) {
      throw new AppError(
        "Referral priority must match the prediction risk and triage.",
        422,
        "PRIORITY_MISMATCH",
      );
    }
    return this.map(await this.repository.create(input, priority, userId));
  }

  public async get(userId: string, role: Role, id: string) {
    const referral = await this.repository.find(id, await this.scope(userId, role));
    if (!referral) throw new AppError("Referral not found.", 404, "RESOURCE_NOT_FOUND");
    return this.map(referral);
  }

  public async list(userId: string, role: Role, query: ReferralListQuery) {
    const scope = await this.scope(userId, role);
    if (role !== Role.PHC_ADMIN && (query.villageId || query.ashaWorkerId || query.doctorId)) {
      throw this.access.forbidden();
    }
    const where: Prisma.ReferralWhereInput = {
      AND: [
        scope,
        {
          status: query.status,
          priority: query.priority,
          patientId: query.patientId,
          prediction: query.disease ? { disease: query.disease } : undefined,
          patient: query.villageId ? { villageId: query.villageId } : undefined,
          assessment: query.ashaWorkerId ? { conductedById: query.ashaWorkerId } : undefined,
          doctorAssignments: query.doctorId ? { some: { doctorId: query.doctorId } } : undefined,
          createdAt: query.from || query.to ? { gte: query.from, lte: query.to } : undefined,
        },
      ],
    };
    const [items, total] = await this.repository.list(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      referrals: items.map((item) => this.map(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  public async patientReferrals(
    userId: string,
    role: Role,
    patientId: string,
    query: ReferralListQuery,
  ) {
    return this.list(userId, role, { ...query, patientId });
  }

  public async history(userId: string, role: Role, id: string) {
    await this.get(userId, role, id);
    return this.repository.history(id);
  }

  public async accept(userId: string, id: string) {
    const referral = await this.requireAdminReferral(userId, id);
    this.assertStatus(referral.status, [ReferralStatus.PENDING, ReferralStatus.RECEIVED], "accept");
    return this.map(await this.repository.transition(id, ReferralStatus.ACCEPTED, userId));
  }

  public async reject(userId: string, id: string, reason: string) {
    const referral = await this.requireAdminReferral(userId, id);
    this.assertStatus(referral.status, [ReferralStatus.PENDING, ReferralStatus.RECEIVED], "reject");
    return this.map(await this.repository.transition(id, ReferralStatus.REJECTED, userId, reason));
  }

  public async assignDoctor(userId: string, id: string, input: AssignDoctorInput) {
    const referral = await this.requireAdminReferral(userId, id);
    this.assertStatus(referral.status, [ReferralStatus.ACCEPTED], "assign a doctor to");
    const doctor = await this.repository.doctor(input.doctorId);
    if (
      !doctor ||
      doctor.user.status !== UserStatus.ACTIVE ||
      doctor.phcId !== referral.recommendedPhcId
    ) {
      throw new AppError(
        "Doctor is unavailable or does not belong to this PHC.",
        422,
        "INVALID_DOCTOR_ASSIGNMENT",
      );
    }
    return this.map(await this.repository.assignDoctor(id, input.doctorId, userId, input.notes));
  }

  public async start(userId: string, id: string) {
    const referral = await this.requireDoctorReferral(userId, id);
    this.assertStatus(referral.status, [ReferralStatus.ASSIGNED], "start");
    return this.map(await this.repository.transition(id, ReferralStatus.IN_PROGRESS, userId));
  }

  public async complete(userId: string, id: string, notes: string) {
    const referral = await this.requireDoctorReferral(userId, id);
    this.assertStatus(referral.status, [ReferralStatus.IN_PROGRESS], "complete");
    return this.map(await this.repository.transition(id, ReferralStatus.COMPLETED, userId, notes));
  }

  public async cancel(userId: string, role: Role, id: string, reason: string) {
    const referral = await this.repository.find(id, await this.scope(userId, role));
    if (!referral) throw new AppError("Referral not found.", 404, "RESOURCE_NOT_FOUND");
    const allowed =
      role === Role.ASHA_WORKER
        ? [ReferralStatus.PENDING, ReferralStatus.RECEIVED]
        : [
            ReferralStatus.PENDING,
            ReferralStatus.RECEIVED,
            ReferralStatus.ACCEPTED,
            ReferralStatus.ASSIGNED,
          ];
    if (role === Role.DOCTOR) throw this.access.forbidden();
    this.assertStatus(referral.status, allowed, "cancel");
    return this.map(await this.repository.transition(id, ReferralStatus.CANCELLED, userId, reason));
  }

  private async requireAdminReferral(userId: string, id: string) {
    const admin = await this.access.requireAdminPhc(userId);
    const referral = await this.repository.find(id, {
      OR: [{ recommendedPhcId: admin.phcId }, { assignedPhcId: admin.phcId }],
    });
    if (!referral) throw new AppError("Referral not found.", 404, "RESOURCE_NOT_FOUND");
    return referral;
  }

  private async requireDoctorReferral(userId: string, id: string) {
    const doctor = await this.access.requireDoctor(userId);
    const referral = await this.repository.find(id, {
      doctorAssignments: { some: { doctorId: doctor.id } },
    });
    if (!referral) throw new AppError("Referral not found.", 404, "RESOURCE_NOT_FOUND");
    return referral;
  }

  private async scope(userId: string, role: Role): Promise<Prisma.ReferralWhereInput> {
    if (role === Role.ASHA_WORKER) {
      await this.access.requireAsha(userId);
      return { createdById: userId };
    }
    if (role === Role.PHC_ADMIN) {
      const admin = await this.access.requireAdminPhc(userId);
      return { OR: [{ recommendedPhcId: admin.phcId }, { assignedPhcId: admin.phcId }] };
    }
    if (role === Role.DOCTOR) {
      const doctor = await this.access.requireDoctor(userId);
      return { doctorAssignments: { some: { doctorId: doctor.id } } };
    }
    throw this.access.forbidden();
  }

  private assertStatus(current: ReferralStatus, allowed: ReferralStatus[], action: string): void {
    if (!allowed.includes(current)) {
      throw new AppError(
        `A ${current} referral cannot be ${action}ed.`,
        409,
        "INVALID_REFERRAL_TRANSITION",
      );
    }
  }

  private priority(risk: RiskLevel, triage: string): ReferralPriority {
    if (/URGENT|EMERGENCY|IMMEDIATE/i.test(triage)) return ReferralPriority.URGENT;
    if (risk === RiskLevel.HIGH) return ReferralPriority.HIGH;
    if (risk === RiskLevel.MEDIUM) return ReferralPriority.MEDIUM;
    return ReferralPriority.LOW;
  }

  private map(referral: ReferralDetail) {
    const dateOfBirth = referral.patient.dateOfBirth;
    const now = new Date();
    let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
    if (
      now.getUTCMonth() < dateOfBirth.getUTCMonth() ||
      (now.getUTCMonth() === dateOfBirth.getUTCMonth() &&
        now.getUTCDate() < dateOfBirth.getUTCDate())
    ) {
      age--;
    }
    return {
      id: referral.id,
      patient: { id: referral.patient.id, fullName: referral.patient.fullName, age },
      patientId: referral.patientId,
      assessmentId: referral.assessmentId,
      prediction: referral.prediction
        ? {
            id: referral.prediction.id,
            disease: referral.prediction.disease,
            probability: referral.prediction.probability,
            riskLevel: referral.prediction.riskLevel,
            triage: referral.prediction.triage,
            reasons: referral.prediction.reasons,
          }
        : null,
      phc: {
        id: referral.recommendedPhc.id,
        name: referral.recommendedPhc.name,
      },
      priority: referral.priority,
      status: referral.status,
      reason: referral.reason,
      notes: referral.notes,
      recommendedSpecialization: referral.recommendedSpecialization,
      doctor: referral.doctorAssignments[0]?.doctor ?? null,
      createdAt: referral.createdAt,
      updatedAt: referral.updatedAt,
      acceptedAt: referral.acceptedAt,
      completedAt: referral.completedAt,
    };
  }
}
