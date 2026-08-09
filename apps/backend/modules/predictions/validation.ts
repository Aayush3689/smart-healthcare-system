import { Disease, RiskLevel } from "@prisma/client";
import { z } from "zod";

const uuid = z.string().uuid();
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);
const date = z.coerce.date().optional();

export const predictionReasonValidation = z
  .object({
    feature: z.string().trim().min(1).max(100),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    message: z.string().trim().min(1).max(500),
  })
  .strict();

export const createPredictionValidation = z
  .object({
    id: uuid,
    assessmentId: uuid,
    disease: z.nativeEnum(Disease),
    prediction: z.boolean(),
    probability: z.number().min(0).max(1),
    riskLevel: z.nativeEnum(RiskLevel),
    triage: z.string().trim().min(1).max(500),
    reasons: z.array(predictionReasonValidation).max(50).default([]),
    modelVersion: z.string().trim().min(1).max(100),
    predictionGeneratedAt: z.coerce.date().max(new Date(Date.now() + 5 * 60_000)),
    deviceId: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const bulkPredictionValidation = z
  .object({ predictions: z.array(createPredictionValidation).min(1).max(100) })
  .strict()
  .superRefine((value, context) => {
    const ids = new Set<string>();
    const pairs = new Set<string>();
    value.predictions.forEach((prediction, index) => {
      const pair = `${prediction.assessmentId}:${prediction.disease}`;
      if (ids.has(prediction.id)) {
        context.addIssue({
          code: "custom",
          path: ["predictions", index, "id"],
          message: "Prediction IDs must be unique within the batch.",
        });
      }
      if (pairs.has(pair)) {
        context.addIssue({
          code: "custom",
          path: ["predictions", index, "disease"],
          message: "An assessment can contain only one prediction per disease.",
        });
      }
      ids.add(prediction.id);
      pairs.add(pair);
    });
  });

const dateRange = {
  disease: z.nativeEnum(Disease).optional(),
  from: date,
  to: date,
};
const validRange = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
    .strict()
    .refine(
      (value) =>
        !("from" in value) ||
        !("to" in value) ||
        !value.from ||
        !value.to ||
        (value.from as Date) <= (value.to as Date),
      { message: "from must be before to", path: ["from"] },
    );

export const predictionIdParamValidation = z.object({ predictionId: uuid }).strict();
export const predictionAssessmentParamValidation = z.object({ assessmentId: uuid }).strict();
export const predictionPatientParamValidation = z.object({ patientId: uuid }).strict();
export const patientPredictionQueryValidation = validRange({
  ...dateRange,
  riskLevel: z.nativeEnum(RiskLevel).optional(),
  page,
  limit,
});
export const highRiskPredictionQueryValidation = validRange({
  ...dateRange,
  villageId: uuid.optional(),
  page,
  limit,
});
export const predictionStatisticsQueryValidation = validRange({
  ...dateRange,
  villageId: uuid.optional(),
});

export type CreatePredictionInput = z.infer<typeof createPredictionValidation>;
export type PatientPredictionQuery = z.infer<typeof patientPredictionQueryValidation>;
export type HighRiskPredictionQuery = z.infer<typeof highRiskPredictionQueryValidation>;
export type PredictionStatisticsQuery = z.infer<typeof predictionStatisticsQueryValidation>;
