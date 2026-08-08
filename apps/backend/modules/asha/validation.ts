import {
  Disease,
  ReferralPriority,
  ReferralStatus,
  RiskLevel,
  FollowUpStatus,
} from "@prisma/client";
import { z } from "zod";
import { createAssessmentValidation } from "../assessments/validation.js";
const optionalDate = z.coerce.date().optional();
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);
export const updateAshaProfileValidation = z
  .object({ fullName: z.string().trim().min(2).max(150) })
  .strict();
export const dateRangeValidation = z
  .object({ from: optionalDate, to: optionalDate })
  .strict()
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "from must be before to",
    path: ["from"],
  });
export const patientListValidation = z
  .object({
    page,
    limit,
    search: z.string().trim().max(150).optional(),
    villageId: z.string().uuid().optional(),
    riskLevel: z.nativeEnum(RiskLevel).optional(),
  })
  .strict();
export const assessmentListValidation = z
  .object({
    page,
    limit,
    patientId: z.string().uuid().optional(),
    riskLevel: z.nativeEnum(RiskLevel).optional(),
    disease: z.nativeEnum(Disease).optional(),
    from: optionalDate,
    to: optionalDate,
  })
  .strict();
export const referralListValidation = z
  .object({
    status: z.nativeEnum(ReferralStatus).optional(),
    priority: z.nativeEnum(ReferralPriority).optional(),
    patientId: z.string().uuid().optional(),
    from: optionalDate,
    to: optionalDate,
  })
  .strict();
export const followUpListValidation = z
  .object({ status: z.nativeEnum(FollowUpStatus).optional() })
  .strict();
export const appointmentListValidation = z.object({ date: z.coerce.date().optional() }).strict();
export const completeFollowUpValidation = z
  .object({ notes: z.string().trim().min(2).max(2000) })
  .strict();
export const correctExtractionValidation = z
  .object({ extractedData: z.record(z.unknown()) })
  .strict();
export const ashaCreateAssessmentValidation = createAssessmentValidation.extend({
  age: z.number().int().min(0).max(120).optional(),
});
export type UpdateAshaProfileInput = z.infer<typeof updateAshaProfileValidation>;
export type PatientListInput = z.infer<typeof patientListValidation>;
export type AssessmentListInput = z.infer<typeof assessmentListValidation>;
export type ReferralListInput = z.infer<typeof referralListValidation>;
