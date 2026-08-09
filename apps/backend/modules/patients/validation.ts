import { Gender } from "@prisma/client";
import { z } from "zod";
const uuid = z.string().uuid();
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 -]{7,20}$/);
export const createPatientValidation = z
  .object({
    id: uuid.optional(),
    fullName: z.string().trim().min(2).max(150),
    dateOfBirth: z.coerce.date().max(new Date()),
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
  .strict();
export const updatePatientValidation = createPatientValidation
  .omit({ id: true, deviceId: true, clientCreatedAt: true })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field is required.");
export type CreatePatientInput = z.infer<typeof createPatientValidation>;
export type UpdatePatientInput = z.infer<typeof updatePatientValidation>;
