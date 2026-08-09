import { AppointmentStatus, ReferralPriority } from "@prisma/client";
import { z } from "zod";

const uuid = z.string().uuid();
const future = z.coerce
  .date()
  .refine((value) => value.getTime() > Date.now(), "Appointment must be in the future.");
const reason = z.string().trim().min(3).max(1000);
const date = z.coerce.date().optional();

export const createAppointmentValidation = z
  .object({
    patientId: uuid,
    referralId: uuid,
    doctorId: uuid,
    scheduledAt: future,
    durationMinutes: z.number().int().min(5).max(480).default(30),
    reason,
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const appointmentIdParamValidation = z.object({ appointmentId: uuid }).strict();
export const appointmentPatientParamValidation = z.object({ patientId: uuid }).strict();
export const appointmentDoctorParamValidation = z.object({ doctorId: uuid }).strict();
export const appointmentListQueryValidation = z
  .object({
    date,
    status: z.nativeEnum(AppointmentStatus).optional(),
    patientId: uuid.optional(),
    doctorId: uuid.optional(),
    priority: z.nativeEnum(ReferralPriority).optional(),
    villageId: uuid.optional(),
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

export const cancelAppointmentValidation = z.object({ reason }).strict();
export const rescheduleAppointmentValidation = z.object({ scheduledAt: future, reason }).strict();
export const emptyAppointmentActionValidation = z.object({}).strict();

export type CreateAppointmentInput = z.infer<typeof createAppointmentValidation>;
export type AppointmentListQuery = z.infer<typeof appointmentListQueryValidation>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentValidation>;
