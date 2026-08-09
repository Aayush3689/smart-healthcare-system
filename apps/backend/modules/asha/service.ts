import { FollowUpStatus, OcrStatus, type Prisma } from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { AssessmentService } from "../assessments/service.js";
import type { CreateAssessmentInput } from "../assessments/validation.js";
import type { PatientService } from "../patients/service.js";
import type { CreatePatientInput, UpdatePatientInput } from "../patients/validation.js";
import type { ReferralService } from "../referrals/service.js";
import type { CreateReferralInput } from "../referrals/validation.js";
import type { AshaRepository } from "./repository.js";
import type {
  AssessmentListInput,
  PatientListInput,
  ReferralListInput,
  UpdateAshaProfileInput,
} from "./validation.js";

export class AshaService {
  public constructor(
    private readonly repository: AshaRepository,
    private readonly access: AccessPolicy,
    private readonly patients: PatientService,
    private readonly assessments: AssessmentService,
    private readonly referrals: ReferralService,
  ) {}
  public async profile(userId: string) {
    return this.map(await this.access.requireAsha(userId));
  }
  public async updateProfile(userId: string, input: UpdateAshaProfileInput) {
    const p = await this.access.requireAsha(userId);
    return this.map(await this.repository.updateProfile(p.id, userId, input.fullName));
  }
  public async dashboard(userId: string) {
    const p = await this.access.requireAsha(userId);
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const d = await this.repository.dashboard(p.id, userId, today, month);
    const n = (a: Array<{ status?: string; riskLevel?: string; _count: number }>, v: string) =>
      a.find((x) => x.status === v || x.riskLevel === v)?._count ?? 0;
    return {
      patients: { total: d.total, registeredThisMonth: d.registeredThisMonth },
      assessments: { today: d.todayAssessments, thisMonth: d.monthAssessments },
      risk: {
        highRisk: n(d.risks, "HIGH"),
        mediumRisk: n(d.risks, "MEDIUM"),
        lowRisk: n(d.risks, "LOW"),
      },
      referrals: {
        pending: n(d.referrals, "PENDING"),
        accepted: n(d.referrals, "ACCEPTED"),
        completed: n(d.referrals, "COMPLETED"),
      },
      followUps: { pending: d.pendingFollowUps, today: d.todayFollowUps },
      sync: { pending: n(d.sync, "PENDING"), failed: n(d.sync, "FAILED") },
    };
  }
  public async statistics(userId: string, from?: Date, to?: Date) {
    const p = await this.access.requireAsha(userId);
    const [
      totalPatients,
      totalAssessments,
      high,
      totalReferrals,
      completedReferrals,
      pendingFollowUps,
      completedFollowUps,
    ] = await this.repository.statistics(p.id, userId, { gte: from, lte: to });
    return {
      totalPatients,
      totalAssessments,
      highRiskPatients: high.length,
      totalReferrals,
      completedReferrals,
      pendingFollowUps,
      completedFollowUps,
    };
  }
  public async listPatients(userId: string, q: PatientListInput) {
    const p = await this.access.requireAsha(userId);
    if (q.villageId && q.villageId !== p.villageId) throw this.access.forbidden();
    const where: Prisma.PatientWhereInput = {
      villageId: q.villageId,
      fullName: q.search ? { contains: q.search, mode: "insensitive" } : undefined,
      assessments: q.riskLevel
        ? { some: { predictions: { some: { riskLevel: q.riskLevel } } } }
        : undefined,
    };
    const [items, total] = await this.repository.patients(
      p.id,
      where,
      (q.page - 1) * q.limit,
      q.limit,
    );
    return {
      patients: items.map((x) => ({
        id: x.id,
        fullName: x.fullName,
        age: this.age(x.dateOfBirth),
        gender: x.gender,
        phone: x.phone,
        village: { id: x.village.id, name: x.village.name },
        latestRisk: x.assessments[0]?.predictions[0]?.riskLevel ?? null,
        lastAssessmentAt: x.assessments[0]?.createdAt ?? null,
      })),
      pagination: { page: q.page, limit: q.limit, total },
    };
  }
  public async patient(userId: string, id: string) {
    const p = await this.access.requireAsha(userId);
    const item = await this.repository.patient(p.id, id);
    if (!item) throw new AppError("Patient not found.", 404, "PATIENT_NOT_FOUND");
    return item;
  }
  public createPatient(userId: string, input: CreatePatientInput) {
    return this.patients.create(userId, input);
  }
  public updatePatient(userId: string, id: string, input: UpdatePatientInput) {
    return this.patients.update(userId, "ASHA_WORKER", id, input);
  }
  public async patientAssessments(userId: string, id: string) {
    await this.patient(userId, id);
    return this.assessments.history(userId, "ASHA_WORKER", id);
  }
  public async patientPredictions(userId: string, id: string) {
    await this.patient(userId, id);
    return this.patients.history(userId, "ASHA_WORKER", id, "predictions");
  }
  public async createAssessment(
    userId: string,
    input: Omit<CreateAssessmentInput, "age"> & { age?: number },
  ) {
    const patient = await this.patient(userId, input.patientId);
    return this.assessments.createDraft(userId, {
      ...input,
      age: input.age ?? this.age(patient.dateOfBirth),
    });
  }
  public assessment(userId: string, id: string) {
    return this.assessments.get(userId, "ASHA_WORKER", id);
  }
  public async listAssessments(userId: string, q: AssessmentListInput) {
    return this.assessments.list(userId, "ASHA_WORKER", q);
  }
  public createReferral(userId: string, input: CreateReferralInput) {
    return this.referrals.create(userId, input);
  }
  public async listReferrals(userId: string, q: ReferralListInput) {
    await this.access.requireAsha(userId);
    return this.repository.referrals(userId, {
      status: q.status,
      priority: q.priority,
      patientId: q.patientId,
      createdAt: q.from || q.to ? { gte: q.from, lte: q.to } : undefined,
    });
  }
  public async referral(userId: string, id: string) {
    await this.access.requireAsha(userId);
    const item = await this.repository.referral(userId, id);
    if (!item) throw new AppError("Referral not found.", 404, "REFERRAL_NOT_FOUND");
    return item;
  }
  public async followUps(userId: string, status?: FollowUpStatus) {
    const p = await this.access.requireAsha(userId);
    return this.repository.followUps(p.id, status);
  }
  public async followUp(userId: string, id: string) {
    const p = await this.access.requireAsha(userId);
    const item = await this.repository.followUp(p.id, id);
    if (!item) throw new AppError("Follow-up not found.", 404, "FOLLOW_UP_NOT_FOUND");
    return item;
  }
  public async completeFollowUp(userId: string, id: string, notes: string) {
    const item = await this.followUp(userId, id);
    if (item.status !== FollowUpStatus.PENDING)
      throw new AppError(
        "Only pending follow-ups can be completed.",
        409,
        "INVALID_FOLLOW_UP_STATE",
      );
    return this.repository.completeFollowUp(id, userId, item.doctor.userId, notes);
  }
  public async appointments(userId: string, date?: Date) {
    const p = await this.access.requireAsha(userId);
    let range: Prisma.DateTimeFilter | undefined;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      range = { gte: start, lt: new Date(start.getTime() + 86400000) };
    }
    return this.repository.appointments(p.id, range);
  }
  public async notifications(userId: string) {
    await this.access.requireAsha(userId);
    return this.repository.notifications(userId);
  }
  public async markNotification(userId: string, id: string) {
    await this.access.requireAsha(userId);
    if (!(await this.repository.markNotification(userId, id)).count)
      throw new AppError("Notification not found.", 404, "NOTIFICATION_NOT_FOUND");
    return null;
  }
  public async markAllNotifications(userId: string) {
    await this.access.requireAsha(userId);
    await this.repository.markAllNotifications(userId);
    return null;
  }
  public async documents(userId: string, patientId: string) {
    await this.patient(userId, patientId);
    return this.repository.documents(patientId);
  }
  public async uploadDocument(
    userId: string,
    patientId: string,
    file: Express.Multer.File,
    assessmentId?: string,
  ) {
    await this.patient(userId, patientId);
    if (assessmentId && (await this.assessment(userId, assessmentId)).patientId !== patientId)
      throw new AppError("Assessment does not belong to patient.", 400, "INVALID_ASSESSMENT");
    return this.repository.createDocument({
      patientId,
      assessmentId,
      uploadedById: userId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      storageKey: file.path,
      ocrStatus: OcrStatus.PENDING,
    });
  }
  private async document(userId: string, id: string) {
    const p = await this.access.requireAsha(userId);
    const d = await this.repository.document(id);
    if (!d || d.patient.registeredById !== p.id)
      throw new AppError("Document not found.", 404, "DOCUMENT_NOT_FOUND");
    return d;
  }
  public async startOcr(userId: string, id: string) {
    await this.document(userId, id);
    return this.repository.setOcr(id, OcrStatus.PROCESSING);
  }
  public ocr(userId: string, id: string) {
    return this.document(userId, id);
  }
  public async extraction(userId: string, id: string) {
    await this.document(userId, id);
    return this.repository.extraction(id);
  }
  public async correctExtraction(userId: string, id: string, data: Prisma.InputJsonValue) {
    await this.document(userId, id);
    return this.repository.correctExtraction(id, data);
  }
  private map(p: Awaited<ReturnType<AccessPolicy["requireAsha"]>>) {
    return {
      id: p.id,
      userId: p.userId,
      fullName: p.fullName,
      employeeCode: p.employeeCode,
      status: p.user.status,
      village: {
        id: p.village.id,
        name: p.village.name,
        district: p.village.district,
        state: p.village.state,
      },
      phc: p.village.phc ? { id: p.village.phc.id, name: p.village.phc.name } : null,
    };
  }
  private age(d: Date) {
    const n = new Date();
    let a = n.getFullYear() - d.getFullYear();
    if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
    return a;
  }
}
