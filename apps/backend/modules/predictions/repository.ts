import { Disease, Prisma, RiskLevel, type PrismaClient } from "@prisma/client";
import type { CreatePredictionInput } from "./validation.js";

export const predictionInclude = {
  reasons: true,
  modelVersion: true,
  assessment: {
    include: {
      patient: { include: { village: true } },
      conductedBy: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.PredictionInclude;

export type PredictionDetail = Prisma.PredictionGetPayload<{
  include: typeof predictionInclude;
}>;

export class PredictionRepository {
  public constructor(private readonly db: PrismaClient) {}

  public assessment(id: string) {
    return this.db.assessment.findUnique({
      where: { id },
      include: { patient: { include: { village: true } } },
    });
  }

  public assessmentInScope(id: string, where: Prisma.AssessmentWhereInput) {
    return this.db.assessment.findFirst({ where: { id, ...where }, select: { id: true } });
  }

  public patientInScope(id: string, where: Prisma.PatientWhereInput) {
    return this.db.patient.findFirst({ where: { id, ...where }, select: { id: true } });
  }

  public findById(id: string, scope?: Prisma.PredictionWhereInput) {
    return this.db.prediction.findFirst({ where: { id, ...scope }, include: predictionInclude });
  }

  public findByAssessmentDisease(assessmentId: string, disease: Disease) {
    return this.db.prediction.findUnique({
      where: { assessmentId_disease: { assessmentId, disease } },
      include: predictionInclude,
    });
  }

  public create(input: CreatePredictionInput, userId: string) {
    return this.db.$transaction(async (tx) => {
      const model = await tx.modelVersion.upsert({
        where: { disease_version: { disease: input.disease, version: input.modelVersion } },
        create: {
          disease: input.disease,
          version: input.modelVersion,
          modelName: input.disease,
        },
        update: {},
      });
      const prediction = await tx.prediction.create({
        data: {
          id: input.id,
          assessmentId: input.assessmentId,
          modelVersionId: model.id,
          disease: input.disease,
          prediction: input.prediction,
          probability: input.probability,
          riskLevel: input.riskLevel,
          triage: input.triage,
          generatedAt: input.predictionGeneratedAt,
          deviceId: input.deviceId,
          reasons: {
            create: input.reasons.map((reason) => ({
              reason: reason.message,
              feature: reason.feature,
              value: reason.value === null ? Prisma.JsonNull : reason.value,
              message: reason.message,
            })),
          },
        },
        include: predictionInclude,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "PREDICTION_CREATED",
          entityType: "PREDICTION",
          entityId: prediction.id,
        },
      });
      return prediction;
    });
  }

  public async list(where: Prisma.PredictionWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.prediction.findMany({
        where,
        include: predictionInclude,
        orderBy: { generatedAt: "desc" },
        skip,
        take,
      }),
      this.db.prediction.count({ where }),
    ]);
  }

  public assessmentPredictions(assessmentId: string, scope: Prisma.PredictionWhereInput) {
    return this.db.prediction.findMany({
      where: { assessmentId, ...scope },
      include: predictionInclude,
      orderBy: { disease: "asc" },
    });
  }

  public assessmentDiseases(assessmentId: string) {
    return this.db.prediction.findMany({ where: { assessmentId }, select: { disease: true } });
  }

  public async statistics(where: Prisma.PredictionWhereInput) {
    const [total, riskGroups, diseaseGroups] = await Promise.all([
      this.db.prediction.count({ where }),
      this.db.prediction.groupBy({ by: ["riskLevel"], where, _count: true }),
      this.db.prediction.groupBy({ by: ["disease", "riskLevel"], where, _count: true }),
    ]);
    const risk = (level: RiskLevel) =>
      riskGroups.find((group) => group.riskLevel === level)?._count ?? 0;
    return { total, risk, diseaseGroups };
  }
}
