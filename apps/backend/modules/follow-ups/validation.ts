import { FollowUpStatus, ReferralPriority } from "@prisma/client";
import { z } from "zod";

const uuid = z.string().uuid();
const reason = z.string().trim().min(2).max(2000);
const future = z.coerce
  .date()
  .refine((value) => value.getTime() > Date.now(), "Date must be in the future.");

export const createFollowUpValidation = z
  .object({
    patientId: uuid,
    clinicalNoteId: uuid,
    appointmentId: uuid,
    scheduledFor: future,
    reason,
    priority: z.nativeEnum(ReferralPriority).default(ReferralPriority.MEDIUM),
  })
  .strict();
export const rescheduleFollowUpValidation = z.object({ scheduledFor: future, reason }).strict();
export const completeFollowUpValidation = z
  .object({ visited: z.literal(true), notes: reason, assessmentId: uuid })
  .strict();
export const missFollowUpValidation = z.object({ reason }).strict();
export const followUpIdParamValidation = z.object({ followUpId: uuid }).strict();
export const followUpPatientParamValidation = z.object({ patientId: uuid }).strict();
export const followUpListQueryValidation = z
  .object({
    status: z.nativeEnum(FollowUpStatus).optional(),
    priority: z.nativeEnum(ReferralPriority).optional(),
    date: z.coerce.date().optional(),
    patientId: uuid.optional(),
    villageId: uuid.optional(),
    ashaWorkerId: uuid.optional(),
    doctorId: uuid.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "from must be before to",
    path: ["from"],
  });
export const emptyFollowUpActionValidation = z.object({}).strict();

export type CreateFollowUpInput = z.infer<typeof createFollowUpValidation>;
export type RescheduleFollowUpInput = z.infer<typeof rescheduleFollowUpValidation>;
export type CompleteFollowUpInput = z.infer<typeof completeFollowUpValidation>;
export type FollowUpListQuery = z.infer<typeof followUpListQueryValidation>;
