import { Gender } from "@prisma/client";
import { z } from "zod";

const uuid = z.string().uuid();
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 -]{7,20}$/);
const optionalDate = z.coerce.date().optional();

export const createPatientValidation = z
  .object({
    id: uuid.optional(),
    fullName: z.string().trim().min(2).max(150),
    dateOfBirth: z.coerce.date().max(new Date()).optional(),
    age: z.number().int().min(0).max(120).optional(),
    gender: z.nativeEnum(Gender),
    phone: phone.optional(),
    address: z.string().trim().max(500).optional(),
    villageId: uuid,
    emergencyContactName: z.string().trim().max(150).optional(),
    emergencyContactPhone: phone.optional(),
    emergencyContactRelation: z.string().trim().max(100).optional(),
    deviceId: z.string().trim().max(200).optional(),
    clientCreatedAt: z.coerce.date().max(new Date(Date.now() + 5 * 60_000)),
  })
  .strict()
  .refine((value) => value.dateOfBirth !== undefined || value.age !== undefined, {
    message: "Either dateOfBirth or age is required.",
    path: ["dateOfBirth"],
  })
  .refine((value) => value.dateOfBirth === undefined || value.age === undefined, {
    message: "Provide either dateOfBirth or age, not both.",
    path: ["age"],
  })
  .transform(({ age, ...value }) => ({
    ...value,
    dateOfBirth:
      value.dateOfBirth ?? new Date(Date.UTC(new Date().getUTCFullYear() - (age ?? 0), 0, 1)),
  }));

export const updatePatientValidation = z
  .object({
    fullName: z.string().trim().min(2).max(150).optional(),
    dateOfBirth: z.coerce.date().max(new Date()).optional(),
    gender: z.nativeEnum(Gender).optional(),
    phone: phone.nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    emergencyContactName: z.string().trim().max(150).nullable().optional(),
    emergencyContactPhone: phone.nullable().optional(),
    emergencyContactRelation: z.string().trim().max(100).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required.");

export const patientIdParamValidation = z.object({ patientId: uuid }).strict();

export const patientListQueryValidation = z
  .object({
    search: z.string().trim().min(1).max(150).optional(),
    villageId: uuid.optional(),
    ashaWorkerId: uuid.optional(),
    gender: z.nativeEnum(Gender).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const patientTimelineQueryValidation = z
  .object({
    type: z
      .enum([
        "PATIENT_REGISTERED",
        "ASSESSMENT",
        "PREDICTION",
        "REFERRAL",
        "APPOINTMENT",
        "CLINICAL_NOTE",
        "FOLLOW_UP",
      ])
      .optional(),
    from: optionalDate,
    to: optionalDate,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "from must be before to",
    path: ["from"],
  });

export type CreatePatientInput = z.infer<typeof createPatientValidation>;
export type UpdatePatientInput = z.infer<typeof updatePatientValidation>;
export type PatientListQuery = z.infer<typeof patientListQueryValidation>;
export type PatientTimelineQuery = z.infer<typeof patientTimelineQueryValidation>;
