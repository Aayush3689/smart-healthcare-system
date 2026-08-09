import { ReferralStatus, RiskLevel, UserStatus } from "@prisma/client";
import { z } from "zod";

const uuid = z.string().uuid();
const name = z.string().trim().min(2).max(150);
const specialization = z.string().trim().min(2).max(150);
const email = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((value) => value.toLowerCase());
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);

export const createDoctorValidation = z.object({ email, fullName: name, specialization }).strict();
export const updateDoctorValidation = z
  .object({ fullName: name.optional(), specialization: specialization.optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required.");
export const doctorIdParamValidation = z.object({ doctorId: uuid }).strict();
export const doctorPatientParamValidation = z.object({ patientId: uuid }).strict();
export const doctorListQueryValidation = z
  .object({
    status: z.nativeEnum(UserStatus).optional(),
    specialization: specialization.optional(),
    search: z.string().trim().min(1).max(150).optional(),
    page,
    limit,
  })
  .strict();
export const doctorPatientListQueryValidation = z
  .object({
    search: z.string().trim().min(1).max(150).optional(),
    riskLevel: z.nativeEnum(RiskLevel).optional(),
    referralStatus: z.nativeEnum(ReferralStatus).optional(),
    page,
    limit,
  })
  .strict();

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm in 24-hour format.");
const availabilityDay = z
  .object({
    available: z.boolean(),
    start: time.optional(),
    end: time.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.available && (!value.start || !value.end)) {
      context.addIssue({ code: "custom", message: "start and end are required when available." });
    }
    if (value.available && value.start && value.end && value.start >= value.end) {
      context.addIssue({ code: "custom", path: ["end"], message: "end must be after start." });
    }
    if (!value.available && (value.start || value.end)) {
      context.addIssue({
        code: "custom",
        message: "Unavailable days cannot contain start or end times.",
      });
    }
  });
const weekday = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export const updateAvailabilityValidation = z
  .object({ schedule: z.record(weekday, availabilityDay) })
  .strict()
  .refine((value) => Object.keys(value.schedule).length > 0, "At least one day is required.");
export const emptyDoctorActionValidation = z.object({}).strict();

export type CreateDoctorInput = z.infer<typeof createDoctorValidation>;
export type UpdateDoctorInput = z.infer<typeof updateDoctorValidation>;
export type DoctorListQuery = z.infer<typeof doctorListQueryValidation>;
export type DoctorPatientListQuery = z.infer<typeof doctorPatientListQueryValidation>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilityValidation>;
