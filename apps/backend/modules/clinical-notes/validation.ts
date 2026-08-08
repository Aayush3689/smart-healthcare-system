import { ClinicalNoteStatus } from "@prisma/client";
import { z } from "zod";

const uuid = z.string().uuid();
const text = z.string().trim().min(1).max(5000);
const medication = z
  .object({
    name: z.string().trim().min(1).max(200),
    dosage: z.string().trim().min(1).max(100),
    frequency: z.string().trim().min(1).max(100),
    duration: z.string().trim().min(1).max(100),
    route: z.string().trim().min(1).max(100),
    instructions: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

const noteFields = {
  observations: text.optional(),
  clinicalImpression: text.optional(),
  diagnosis: text.optional(),
  treatmentPlan: text.optional(),
  advice: text.optional(),
  medications: z.array(medication).max(50).optional(),
  followUpRequired: z.boolean().default(false),
  followUpAfterDays: z.number().int().min(1).max(365).optional(),
};

const followUpRule = (value: { followUpRequired?: boolean; followUpAfterDays?: number }) =>
  value.followUpRequired
    ? value.followUpAfterDays !== undefined
    : value.followUpAfterDays === undefined;

export const createClinicalNoteValidation = z
  .object({ appointmentId: uuid, patientId: uuid, ...noteFields })
  .strict()
  .refine(followUpRule, {
    message: "followUpAfterDays is required only when follow-up is required.",
  });

export const updateClinicalNoteValidation = z
  .object({ ...noteFields, followUpRequired: z.boolean().optional() })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required.")
  .refine(followUpRule, { message: "followUpAfterDays requires followUpRequired to be true." });

export const clinicalNoteIdParamValidation = z.object({ clinicalNoteId: uuid }).strict();
export const clinicalNotePatientParamValidation = z.object({ patientId: uuid }).strict();
export const clinicalNoteListQueryValidation = z
  .object({
    patientId: uuid.optional(),
    status: z.nativeEnum(ClinicalNoteStatus).optional(),
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
export const emptyClinicalNoteActionValidation = z.object({}).strict();

export type CreateClinicalNoteInput = z.infer<typeof createClinicalNoteValidation>;
export type UpdateClinicalNoteInput = z.infer<typeof updateClinicalNoteValidation>;
export type ClinicalNoteListQuery = z.infer<typeof clinicalNoteListQueryValidation>;
