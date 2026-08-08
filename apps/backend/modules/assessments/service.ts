import {
  Role,
  type Assessment,
  type ModelVersion,
  type Prediction,
  type PredictionReason,
  type Prisma,
} from "@prisma/client";
import type { AccessPolicy } from "../../common/policies/access.policy.js";
import { AppError } from "../../utils/app-error.js";
import type { PredictionService } from "../predictions/service.js";
import type { AssessmentRepository } from "./repository.js";
import type {
  AssessmentListQuery,
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from "./validation.js";

const requiredFeatures = {
  DIABETES: [
    "age",
    "pregnancies",
    "glucose",
    "diabetesBloodPressure",
    "skinThickness",
    "insulin",
    "bmi",
    "diabetesPedigreeFunction",
  ],
  HEART_DISEASE: [
    "age",
    "heartSex",
    "chestPainType",
    "restingBloodPressure",
    "cholesterol",
    "fastingBloodSugar",
    "restingEcg",
    "maxHeartRate",
    "exerciseInducedAngina",
    "oldpeak",
    "stSlope",
    "majorVessels",
    "thal",
  ],
  HYPERTENSION: [
    "age",
    "bmi",
    "systolicBp",
    "diastolicBp",
    "heartRate",
    "bpHistory",
    "medication",
    "familyHistoryHypertension",
    "exerciseLevel",
    "smokingStatus",
  ],
} as const;

type AssessmentResponseSource = Assessment & {
  predictions?: Array<Prediction & { reasons?: PredictionReason[]; modelVersion?: ModelVersion }>;
};

export class AssessmentService {
  public constructor(
    private readonly repository: AssessmentRepository,
    private readonly access: AccessPolicy,
    private readonly predictions: PredictionService,
  ) {}

  public async create(userId: string, input: CreateAssessmentInput) {
    const asha = await this.access.requireAsha(userId);
    const patient = await this.repository.patient(input.patientId);
    if (!patient || patient.registeredById !== asha.id) {
      throw new AppError("Patient not found.", 404, "RESOURCE_NOT_FOUND", [
        { field: "patientId", message: "Patient does not exist or is not accessible." },
      ]);
    }

    if (input.followUpId) {
      const followUp = await this.repository.followUp(input.followUpId);
      if (
        !followUp ||
        followUp.patientId !== input.patientId ||
        followUp.assignedToId !== asha.id ||
        followUp.status !== "IN_PROGRESS"
      ) {
        throw new AppError(
          "Follow-up is not in progress or is not assigned to this ASHA worker.",
          422,
          "INVALID_FOLLOW_UP_ASSESSMENT",
        );
      }
    }

    if (input.id) {
      const existing = await this.repository.find(input.id);
      if (existing) {
        if (existing.patientId === input.patientId && existing.conductedById === asha.id) {
          return existing;
        }
        throw new AppError("Assessment ID already exists.", 409, "RESOURCE_CONFLICT");
      }
    }

    return this.repository.create({ ...input, conductedById: asha.id }, userId);
  }

  public async createDraft(userId: string, input: CreateAssessmentInput) {
    return this.response(await this.create(userId, input));
  }

  public async get(userId: string, role: Role, id: string) {
    const scope = await this.scope(userId, role);
    const assessment = await this.repository.find(id, scope);
    if (!assessment) throw new AppError("Assessment not found.", 404, "RESOURCE_NOT_FOUND");
    return this.response(assessment);
  }

  public async list(userId: string, role: Role, query: AssessmentListQuery) {
    const accessScope = await this.scope(userId, role);
    if (role === Role.ASHA_WORKER && (query.ashaId || query.villageId)) {
      throw this.access.forbidden();
    }
    const where: Prisma.AssessmentWhereInput = {
      AND: [
        accessScope,
        {
          patientId: query.patientId,
          conductedById: query.ashaId,
          patient: query.villageId ? { villageId: query.villageId } : undefined,
          createdAt: query.from || query.to ? { gte: query.from, lte: query.to } : undefined,
          predictions:
            query.riskLevel || query.disease
              ? { some: { riskLevel: query.riskLevel, disease: query.disease } }
              : undefined,
        },
      ],
    };
    const [items, total] = await this.repository.list(
      where,
      (query.page - 1) * query.limit,
      query.limit,
    );
    return {
      assessments: items.map((item) => this.response(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  public async history(userId: string, role: Role, patientId: string) {
    const query: AssessmentListQuery = { patientId, page: 1, limit: 100 };
    const result = await this.list(userId, role, query);
    return result.assessments;
  }

  public async update(userId: string, id: string, input: UpdateAssessmentInput) {
    const asha = await this.access.requireAsha(userId);
    const assessment = await this.repository.find(id, { conductedById: asha.id });
    if (!assessment) throw new AppError("Assessment not found.", 404, "RESOURCE_NOT_FOUND");
    if (assessment.completedAt) {
      throw new AppError(
        "Completed assessments cannot be modified.",
        409,
        "ASSESSMENT_NOT_EDITABLE",
      );
    }
    return this.response(await this.repository.update(id, input, userId));
  }

  public async complete(userId: string, id: string) {
    const asha = await this.access.requireAsha(userId);
    const assessment = await this.repository.find(id, { conductedById: asha.id });
    if (!assessment) throw new AppError("Assessment not found.", 404, "RESOURCE_NOT_FOUND");
    if (assessment.completedAt) return this.response(assessment);

    this.assertCompleteFeatures(assessment);
    await this.predictions.requireComplete(id);
    return this.response(await this.repository.markCompleted(id, userId));
  }

  public async predictionList(userId: string, role: Role, id: string) {
    const assessment = await this.get(userId, role, id);
    return { predictions: assessment.predictions };
  }

  public async documentList(userId: string, role: Role, id: string) {
    const scope = await this.scope(userId, role);
    if (!(await this.repository.find(id, scope))) {
      throw new AppError("Assessment not found.", 404, "RESOURCE_NOT_FOUND");
    }
    return { documents: await this.repository.documents(id, scope) };
  }

  private async scope(userId: string, role: Role): Promise<Prisma.AssessmentWhereInput> {
    if (role === Role.ASHA_WORKER) {
      const asha = await this.access.requireAsha(userId);
      return { conductedById: asha.id };
    }
    if (role === Role.PHC_ADMIN) {
      const admin = await this.access.requireAdminPhc(userId);
      return { patient: { village: { phcId: admin.phcId } } };
    }
    if (role === Role.DOCTOR) {
      const doctor = await this.access.requireDoctor(userId);
      return {
        patient: {
          OR: [
            { appointments: { some: { doctorId: doctor.id } } },
            { referrals: { some: { doctorAssignments: { some: { doctorId: doctor.id } } } } },
          ],
        },
      };
    }
    throw this.access.forbidden();
  }

  private assertCompleteFeatures(value: object): void {
    const record = value as Record<string, unknown>;
    const missing = Object.entries(requiredFeatures).flatMap(([model, fields]) =>
      fields
        .filter((field) => record[field] === null || record[field] === undefined)
        .map((field) => ({ field, message: `${field} is required for the ${model} model.` })),
    );
    if (missing.length > 0) {
      throw new AppError(
        "Assessment does not contain all required AI features.",
        422,
        "INCOMPLETE_ASSESSMENT",
        missing,
      );
    }
  }

  private response(assessment: AssessmentResponseSource) {
    return {
      ...assessment,
      status: assessment.completedAt ? "COMPLETED" : "DRAFT",
      predictions: (assessment.predictions ?? []).map((prediction) => ({
        id: prediction.id,
        disease: prediction.disease,
        prediction: prediction.prediction,
        probability: prediction.probability,
        riskLevel: prediction.riskLevel,
        triage: prediction.triage,
        reasons: (prediction.reasons ?? []).map((reason) => reason.reason),
        modelVersion: prediction.modelVersion?.version,
        generatedAt: prediction.generatedAt,
      })),
    };
  }
}
