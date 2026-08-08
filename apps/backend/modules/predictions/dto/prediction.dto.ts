import type { z } from "zod";
import type {
  bulkPredictionValidation,
  createPredictionValidation,
  highRiskPredictionQueryValidation,
  patientPredictionQueryValidation,
  predictionStatisticsQueryValidation,
} from "../validation.js";

export type CreatePredictionRequest = z.infer<typeof createPredictionValidation>;
export type BulkPredictionRequest = z.infer<typeof bulkPredictionValidation>;
export type PatientPredictionQuery = z.infer<typeof patientPredictionQueryValidation>;
export type HighRiskPredictionQuery = z.infer<typeof highRiskPredictionQueryValidation>;
export type PredictionStatisticsQuery = z.infer<typeof predictionStatisticsQueryValidation>;

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
