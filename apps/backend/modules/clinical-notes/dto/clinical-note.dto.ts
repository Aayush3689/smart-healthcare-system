import type { z } from "zod";
import type {
  clinicalNoteListQueryValidation,
  createClinicalNoteValidation,
  updateClinicalNoteValidation,
} from "../validation.js";

export type CreateClinicalNoteRequest = z.infer<typeof createClinicalNoteValidation>;
export type UpdateClinicalNoteRequest = z.infer<typeof updateClinicalNoteValidation>;
export type ClinicalNoteListRequest = z.infer<typeof clinicalNoteListQueryValidation>;
