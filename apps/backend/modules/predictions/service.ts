import { Disease, RiskLevel, Role, type Prisma } from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { PredictionDetail, PredictionRepository } from "./repository.js";
import type {
  CreatePredictionInput,
  HighRiskPredictionQuery,
  PatientPredictionQuery,
  PredictionStatisticsQuery,
} from "./validation.js";

export class PredictionService {
  public constructor(
    private readonly repository: PredictionRepository,
    private readonly access: AccessPolicy,
  ) {}

  public async create(userId: string, input: CreatePredictionInput) {
    const asha = await this.access.requireAsha(userId);
    const assessment = await this.repository.assessment(input.assessmentId);
    if (!assessment || assessment.conductedById !== asha.id) {
      throw new AppError("Assessment not found.", 404, "RESOURCE_NOT_FOUND");
    }

    const existingId = await this.repository.findById(input.id);
    if (existingId) {
      if (existingId.assessmentId === input.assessmentId && existingId.disease === input.disease) {
        return { prediction: this.map(existingId), alreadyExists: true };
      }
      throw new AppError("Prediction ID already exists.", 409, "RESOURCE_CONFLICT");
    }

    const existingDisease = await this.repository.findByAssessmentDisease(
      input.assessmentId,
      input.disease,
    );
    if (existingDisease) {
      throw new AppError(
        "A prediction for this assessment and disease already exists.",
        409,
        "PREDICTION_ALREADY_EXISTS",
      );
    }

    if (assessment.completedAt) {
      throw new AppError(
        "Completed assessments cannot accept new predictions.",
        409,
        "ASSESSMENT_NOT_EDITABLE",
      );
    }

    return {
      prediction: this.map(await this.repository.create(input, userId)),
      alreadyExists: false,
    };
  }

  public async createBulk(userId: string, inputs: CreatePredictionInput[]) {
    const results: Array<{
      id: string;
      status: "CREATED" | "ALREADY_EXISTS" | "FAILED";
      error?: { code: string; message: string };
    }> = [];
    for (const input of inputs) {
      try {
        const result = await this.create(userId, input);
        results.push({
          id: input.id,
          status: result.alreadyExists ? "ALREADY_EXISTS" : "CREATED",
        });
      } catch (error) {
        const appError = error instanceof AppError ? error : undefined;
        results.push({
          id: input.id,
          status: "FAILED",
          error: {
            code: appError?.code ?? "PREDICTION_SYNC_FAILED",
            message: error instanceof Error ? error.message : "Prediction synchronization failed.",
          },
        });
      }
    }
    return {
      created: results.filter((result) => result.status === "CREATED").length,
      alreadyExists: results.filter((result) => result.status === "ALREADY_EXISTS").length,
      failed: results.filter((result) => result.status === "FAILED").length,
      results,
    };
  }

  public async get(userId: string, role: Role, id: string) {
    const prediction = await this.repository.findById(id, await this.scope(userId, role));
    if (!prediction) throw new AppError("Prediction not found.", 404, "RESOURCE_NOT_FOUND");
    return this.map(prediction);
  }

  public async byAssessment(userId: string, role: Role, assessmentId: string) {
    const scope = await this.scope(userId, role);
    const assessment = await this.repository.assessment(assessmentId);
    if (!assessment || !(await this.assessmentAccessible(userId, role, assessmentId))) {
      throw new AppError("Assessment not found.", 404, "RESOURCE_NOT_FOUND");
    }
    const predictions = await this.repository.assessmentPredictions(assessmentId, scope);
    return { assessmentId, predictions: predictions.map((prediction) => this.map(prediction)) };
  }

  public async byPatient(
    userId: string,
    role: Role,
    patientId: string,
    query: PatientPredictionQuery,
  ) {
    const scope = await this.scope(userId, role);
    const where: Prisma.PredictionWhereInput = {
      AND: [
        scope,
        {
          assessment: { patientId },
          disease: query.disease,
          riskLevel: query.riskLevel,
          generatedAt: query.from || query.to ? { gte: query.from, lte: query.to } : undefined,
        },
      ],
    };
    const [items, total] = await this.repository.list(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    if (total === 0 && !(await this.patientAccessible(userId, role, patientId))) {
      throw new AppError("Patient not found.", 404, "RESOURCE_NOT_FOUND");
    }
    return {
      predictions: items.map((item) => this.map(item)),
      pagination: this.pagination(query.page, query.limit, total),
    };
  }

  public async highRisk(userId: string, role: Role, query: HighRiskPredictionQuery) {
    const where: Prisma.PredictionWhereInput = {
      AND: [
        await this.scope(userId, role),
        {
          riskLevel: RiskLevel.HIGH,
          disease: query.disease,
          assessment: query.villageId ? { patient: { villageId: query.villageId } } : undefined,
          generatedAt: query.from || query.to ? { gte: query.from, lte: query.to } : undefined,
        },
      ],
    };
    const [items, total] = await this.repository.list(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      items: items.map((item) => this.mapHighRisk(item)),
      pagination: this.pagination(query.page, query.limit, total),
    };
  }

  public async statistics(userId: string, role: Role, query: PredictionStatisticsQuery) {
    const where: Prisma.PredictionWhereInput = {
      AND: [
        await this.scope(userId, role),
        {
          disease: query.disease,
          assessment: query.villageId ? { patient: { villageId: query.villageId } } : undefined,
          generatedAt: query.from || query.to ? { gte: query.from, lte: query.to } : undefined,
        },
      ],
    };
    const data = await this.repository.statistics(where);
    const diseases = Object.fromEntries(
      Object.values(Disease).map((disease) => {
        const groups = data.diseaseGroups.filter((group) => group.disease === disease);
        return [
          disease,
          {
            total: groups.reduce((sum, group) => sum + group._count, 0),
            highRisk: groups.find((group) => group.riskLevel === RiskLevel.HIGH)?._count ?? 0,
          },
        ];
      }),
    );
    return {
      totalPredictions: data.total,
      highRisk: data.risk(RiskLevel.HIGH),
      mediumRisk: data.risk(RiskLevel.MEDIUM),
      lowRisk: data.risk(RiskLevel.LOW),
      diseases,
    };
  }

  public async requireComplete(assessmentId: string): Promise<void> {
    const predictions = await this.repository.assessmentDiseases(assessmentId);
    const diseases = new Set(predictions.map((prediction) => prediction.disease));
    const missing = Object.values(Disease).filter((disease) => !diseases.has(disease));
    if (missing.length > 0) {
      throw new AppError(
        "All disease predictions must be uploaded before completing the assessment.",
        422,
        "INCOMPLETE_PREDICTIONS",
        missing.map((disease) => ({
          field: disease,
          message: `${disease} prediction is missing.`,
        })),
      );
    }
  }

  private async scope(userId: string, role: Role): Promise<Prisma.PredictionWhereInput> {
    if (role === Role.ASHA_WORKER) {
      const asha = await this.access.requireAsha(userId);
      return { assessment: { conductedById: asha.id } };
    }
    if (role === Role.PHC_ADMIN) {
      const admin = await this.access.requireAdminPhc(userId);
      return { assessment: { patient: { village: { phcId: admin.phcId } } } };
    }
    if (role === Role.DOCTOR) {
      const doctor = await this.access.requireDoctor(userId);
      return {
        assessment: {
          patient: {
            OR: [
              { appointments: { some: { doctorId: doctor.id } } },
              { referrals: { some: { doctorAssignments: { some: { doctorId: doctor.id } } } } },
            ],
          },
        },
      };
    }
    throw this.access.forbidden();
  }

  private async patientAccessible(userId: string, role: Role, patientId: string): Promise<boolean> {
    return Boolean(
      await this.repository.patientInScope(patientId, await this.patientScope(userId, role)),
    );
  }

  private async assessmentAccessible(
    userId: string,
    role: Role,
    assessmentId: string,
  ): Promise<boolean> {
    return Boolean(
      await this.repository.assessmentInScope(assessmentId, {
        patient: await this.patientScope(userId, role),
      }),
    );
  }

  private async patientScope(userId: string, role: Role): Promise<Prisma.PatientWhereInput> {
    if (role === Role.ASHA_WORKER) {
      const asha = await this.access.requireAsha(userId);
      return { registeredById: asha.id };
    }
    if (role === Role.PHC_ADMIN) {
      const admin = await this.access.requireAdminPhc(userId);
      return { village: { phcId: admin.phcId } };
    }
    if (role === Role.DOCTOR) {
      const doctor = await this.access.requireDoctor(userId);
      return {
        OR: [
          { appointments: { some: { doctorId: doctor.id } } },
          { referrals: { some: { doctorAssignments: { some: { doctorId: doctor.id } } } } },
        ],
      };
    }
    throw this.access.forbidden();
  }

  private map(item: PredictionDetail) {
    return {
      id: item.id,
      assessmentId: item.assessmentId,
      patientId: item.assessment.patientId,
      disease: item.disease,
      prediction: item.prediction,
      probability: item.probability,
      riskLevel: item.riskLevel,
      triage: item.triage,
      reasons: item.reasons.map((reason) => ({
        feature: reason.feature,
        value: reason.value,
        message: reason.message ?? reason.reason,
      })),
      modelVersion: item.modelVersion.version,
      predictionGeneratedAt: item.generatedAt,
      deviceId: item.deviceId,
      createdAt: item.createdAt,
    };
  }

  private mapHighRisk(item: PredictionDetail) {
    const birth = item.assessment.patient.dateOfBirth as Date;
    const now = new Date();
    let age = now.getUTCFullYear() - birth.getUTCFullYear();
    if (
      now.getUTCMonth() < birth.getUTCMonth() ||
      (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())
    ) {
      age--;
    }
    return {
      predictionId: item.id,
      patient: { id: item.assessment.patient.id, fullName: item.assessment.patient.fullName, age },
      disease: item.disease,
      probability: item.probability,
      riskLevel: item.riskLevel,
      triage: item.triage,
    };
  }

  private pagination(page: number, limit: number, total: number) {
    return { page, limit, total, totalPages: Math.ceil(total / limit) };
  }
}
