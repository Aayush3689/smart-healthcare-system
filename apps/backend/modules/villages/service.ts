import { RiskLevel, Role, type Prisma } from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { VillageRepository } from "./repository.js";
import type {
  VillageDiseaseStatisticsQuery,
  VillageFollowUpQuery,
  VillageHighRiskQuery,
  VillageListQuery,
  VillagePatientQuery,
  VillageReferralQuery,
} from "./validation.js";

export class VillageService {
  public constructor(
    private readonly repository: VillageRepository,
    private readonly access: AccessPolicy,
  ) {}

  public async get(userId: string, role: Role, villageId: string) {
    return this.authorize(userId, role, villageId);
  }

  public async myAshaVillage(userId: string) {
    const asha = await this.access.requireAsha(userId);
    const village = await this.repository.find(asha.villageId);
    if (!village) throw new AppError("Village not found.", 404, "RESOURCE_NOT_FOUND");
    return village;
  }

  public async phcVillages(userId: string, query: VillageListQuery) {
    const admin = await this.access.requireAdminPhc(userId);
    const where: Prisma.VillageWhereInput = {
      phcId: admin.phcId,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: "insensitive" } },
            { district: { contains: query.search, mode: "insensitive" } },
          ]
        : undefined,
    };
    const [items, total] = await this.repository.list(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return { items, pagination: { page: query.page, limit: query.limit, total } };
  }

  public async phcVillage(userId: string, villageId: string) {
    return this.authorize(userId, Role.PHC_ADMIN, villageId);
  }

  public async ashaWorkers(userId: string, role: Role, villageId: string) {
    await this.authorize(userId, role, villageId);
    const items = await this.repository.ashaWorkers(villageId);
    return {
      items: items.map((worker) => ({
        id: worker.id,
        fullName: worker.fullName,
        employeeCode: worker.employeeCode,
        status: worker.user.status,
      })),
    };
  }

  public async patients(userId: string, role: Role, villageId: string, query: VillagePatientQuery) {
    await this.authorize(userId, role, villageId);
    const where: Prisma.PatientWhereInput = {
      villageId,
      fullName: query.search ? { contains: query.search, mode: "insensitive" } : undefined,
      registeredById: query.ashaWorkerId,
      assessments: query.riskLevel
        ? { some: { predictions: { some: { riskLevel: query.riskLevel } } } }
        : undefined,
    };
    const [items, total] = await this.repository.patients(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items: items.map((patient) => ({
        id: patient.id,
        fullName: patient.fullName,
        age: this.age(patient.dateOfBirth),
        gender: patient.gender,
        registeredBy: { id: patient.registeredBy.id, fullName: patient.registeredBy.fullName },
        latestPrediction: patient.assessments[0]?.predictions[0] ?? null,
      })),
      pagination: { page: query.page, limit: query.limit, total },
    };
  }

  public async statistics(userId: string, role: Role, villageId: string) {
    const village = await this.authorize(userId, role, villageId);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return {
      village: { id: village.id, name: village.name },
      ...(await this.repository.statistics(villageId, new Date(today.getTime() + 86_400_000))),
    };
  }

  public async diseaseStatistics(
    userId: string,
    role: Role,
    villageId: string,
    query: VillageDiseaseStatisticsQuery,
  ) {
    await this.authorize(userId, role, villageId);
    return this.repository.diseaseStatistics(villageId, query.from, query.to);
  }

  public async highRisk(
    userId: string,
    role: Role,
    villageId: string,
    query: VillageHighRiskQuery,
  ) {
    await this.authorize(userId, role, villageId);
    const where: Prisma.PredictionWhereInput = {
      riskLevel: RiskLevel.HIGH,
      disease: query.disease,
      assessment: { patient: { villageId } },
    };
    const [items, total] = await this.repository.highRisk(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items: items.map((prediction) => ({
        patientId: prediction.assessment.patient.id,
        patientName: prediction.assessment.patient.fullName,
        disease: prediction.disease,
        riskLevel: prediction.riskLevel,
        probability: prediction.probability,
        assessmentId: prediction.assessmentId,
      })),
      pagination: { page: query.page, limit: query.limit, total },
    };
  }

  public async referrals(
    userId: string,
    role: Role,
    villageId: string,
    query: VillageReferralQuery,
  ) {
    await this.authorize(userId, role, villageId);
    const [items, total] = await this.repository.referrals(
      { patient: { villageId }, status: query.status, priority: query.priority },
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items: items.map((item) => ({
        id: item.id,
        patientId: item.patientId,
        patientName: item.patient.fullName,
        priority: item.priority,
        status: item.status,
        createdAt: item.createdAt,
      })),
      pagination: { page: query.page, limit: query.limit, total },
    };
  }

  public async followUps(
    userId: string,
    role: Role,
    villageId: string,
    query: VillageFollowUpQuery,
  ) {
    await this.authorize(userId, role, villageId);
    const [items, total] = await this.repository.followUps(
      { patient: { villageId }, status: query.status, priority: query.priority },
      (query.page - 1) * query.limit,
      query.limit,
    );
    return { items, pagination: { page: query.page, limit: query.limit, total } };
  }

  private async authorize(userId: string, role: Role, villageId: string) {
    const village = await this.repository.find(villageId);
    if (!village) throw new AppError("Village not found.", 404, "RESOURCE_NOT_FOUND");
    let allowed = false;
    if (role === Role.ASHA_WORKER)
      allowed = (await this.access.requireAsha(userId)).villageId === villageId;
    if (role === Role.DOCTOR)
      allowed = (await this.access.requireDoctor(userId)).phcId === village.phcId;
    if (role === Role.PHC_ADMIN)
      allowed = (await this.access.requireAdminPhc(userId)).phcId === village.phcId;
    if (!allowed) throw this.access.forbidden();
    return village;
  }

  private age(dateOfBirth: Date): number {
    const now = new Date();
    let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
    if (
      now.getUTCMonth() < dateOfBirth.getUTCMonth() ||
      (now.getUTCMonth() === dateOfBirth.getUTCMonth() &&
        now.getUTCDate() < dateOfBirth.getUTCDate())
    )
      age--;
    return age;
  }
}
