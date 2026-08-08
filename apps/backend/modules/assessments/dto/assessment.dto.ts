import type { z } from "zod";
import type {
  assessmentListQueryValidation,
  createAssessmentValidation,
  updateAssessmentValidation,
} from "../validation.js";

export type CreateAssessmentRequest = z.infer<typeof createAssessmentValidation>;
export type UpdateAssessmentRequest = z.infer<typeof updateAssessmentValidation>;
export type AssessmentListRequest = z.infer<typeof assessmentListQueryValidation>;

export interface AssessmentListResponse<T> {
  assessments: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
