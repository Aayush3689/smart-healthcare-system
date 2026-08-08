import { Disease, ReferralPriority, ReferralStatus } from "@prisma/client";
import { z } from "zod";

const uuid = z.string().uuid();
const reason = z.string().trim().min(3).max(2000);
const date = z.coerce.date().optional();

export const createReferralValidation = z
  .object({
    patientId: uuid,
    assessmentId: uuid,
    predictionId: uuid,
    phcId: uuid,
    priority: z.nativeEnum(ReferralPriority).optional(),
    reason: z.string().trim().min(5).max(2000),
    notes: z.string().trim().max(2000).optional(),
    recommendedSpecialization: z.string().trim().min(2).max(150).optional(),
  })
  .strict();

export const referralIdParamValidation = z.object({ referralId: uuid }).strict();
export const referralPatientParamValidation = z.object({ patientId: uuid }).strict();
export const referralListQueryValidation = z
  .object({
    status: z.nativeEnum(ReferralStatus).optional(),
    priority: z.nativeEnum(ReferralPriority).optional(),
    patientId: uuid.optional(),
    disease: z.nativeEnum(Disease).optional(),
    villageId: uuid.optional(),
    ashaWorkerId: uuid.optional(),
    doctorId: uuid.optional(),
    from: date,
    to: date,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "from must be before to",
    path: ["from"],
  });

export const rejectReferralValidation = z.object({ reason }).strict();
export const cancelReferralValidation = z.object({ reason }).strict();
export const completeReferralValidation = z
  .object({ notes: z.string().trim().min(3).max(2000) })
  .strict();
export const assignDoctorValidation = z
  .object({ doctorId: uuid, notes: z.string().trim().max(1000).optional() })
  .strict();
export const emptyReferralActionValidation = z.object({}).strict();

export type CreateReferralInput = z.infer<typeof createReferralValidation>;
export type ReferralListQuery = z.infer<typeof referralListQueryValidation>;
export type AssignDoctorInput = z.infer<typeof assignDoctorValidation>;
