import type { z } from "zod";
import type { statisticsQueryValidation, updatePhcValidation } from "../validation.js";

export type UpdatePhcRequest = z.infer<typeof updatePhcValidation>;
export type PhcStatisticsRequest = z.infer<typeof statisticsQueryValidation>;
