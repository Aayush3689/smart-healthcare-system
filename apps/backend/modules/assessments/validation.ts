import {
  AssessmentInputSource,
  BP_History,
  Disease,
  Exercise_Level,
  Medication,
  RiskLevel,
  Smoking_Status,
} from "@prisma/client";
import { z } from "zod";

const uuid = z.string().uuid();
const optionalDate = z.coerce.date().optional();

const clinicalFields = {
  age: z.number().int().min(0).max(120),
  weightKg: z.number().positive().max(500).optional(),
  heightCm: z.number().min(30).max(250).optional(),
  bmi: z.number().min(5).max(100).optional(),
  pregnancies: z.number().int().min(0).max(30).optional(),
  glucose: z.number().min(0).max(1000).optional(),
  diabetesBloodPressure: z.number().int().min(0).max(300).optional(),
  skinThickness: z.number().min(0).max(150).optional(),
  insulin: z.number().min(0).max(2000).optional(),
  diabetesPedigreeFunction: z.number().min(0).max(5).optional(),
  heartSex: z.number().int().min(0).max(1).optional(),
  chestPainType: z.number().int().min(0).max(3).optional(),
  restingBloodPressure: z.number().int().min(40).max(300).optional(),
  cholesterol: z.number().int().min(0).max(1000).optional(),
  fastingBloodSugar: z.boolean().optional(),
  restingEcg: z.number().int().min(0).max(2).optional(),
  maxHeartRate: z.number().int().min(20).max(300).optional(),
  exerciseInducedAngina: z.boolean().optional(),
  oldpeak: z.number().min(0).max(20).optional(),
  stSlope: z.number().int().min(0).max(2).optional(),
  majorVessels: z.number().int().min(0).max(4).optional(),
  thal: z.number().int().min(0).max(3).optional(),
  systolicBp: z.number().int().min(40).max(300).optional(),
  diastolicBp: z.number().int().min(20).max(200).optional(),
  heartRate: z.number().int().min(20).max(300).optional(),
  bpHistory: z.nativeEnum(BP_History).optional(),
  medication: z.nativeEnum(Medication).optional(),
  familyHistoryHypertension: z.boolean().optional(),
  exerciseLevel: z.nativeEnum(Exercise_Level).optional(),
  smokingStatus: z.nativeEnum(Smoking_Status).optional(),
  temperatureC: z.number().min(25).max(50).optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(),
  hemoglobin: z.number().min(0).max(30).optional(),
  symptoms: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  notes: z.string().trim().max(2000).optional(),
  inputSource: z.nativeEnum(AssessmentInputSource).default(AssessmentInputSource.MANUAL),
};

export const createAssessmentValidation = z
  .object({
    id: uuid.optional(),
    patientId: uuid,
    followUpId: uuid.optional(),
    ...clinicalFields,
    deviceId: z.string().trim().min(1).max(200).optional(),
    clientCreatedAt: z.coerce.date().max(new Date(Date.now() + 5 * 60_000)),
  })
  .strict();

export const updateAssessmentValidation = z
  .object(clinicalFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const assessmentIdParamValidation = z.object({ assessmentId: uuid }).strict();
export const patientIdParamValidation = z.object({ patientId: uuid }).strict();
export const completeAssessmentValidation = z.object({}).strict();
export const assessmentListQueryValidation = z
  .object({
    patientId: uuid.optional(),
    ashaId: uuid.optional(),
    villageId: uuid.optional(),
    riskLevel: z.nativeEnum(RiskLevel).optional(),
    disease: z.nativeEnum(Disease).optional(),
    from: optionalDate,
    to: optionalDate,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "from must be before to",
    path: ["from"],
  });

export type CreateAssessmentInput = z.infer<typeof createAssessmentValidation>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentValidation>;
export type AssessmentListQuery = z.infer<typeof assessmentListQueryValidation>;
