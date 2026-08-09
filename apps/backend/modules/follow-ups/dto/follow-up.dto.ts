import type { z } from "zod";
import type {
  completeFollowUpValidation,
  createFollowUpValidation,
  followUpListQueryValidation,
  rescheduleFollowUpValidation,
} from "../validation.js";

export type CreateFollowUpRequest = z.infer<typeof createFollowUpValidation>;
export type RescheduleFollowUpRequest = z.infer<typeof rescheduleFollowUpValidation>;
export type CompleteFollowUpRequest = z.infer<typeof completeFollowUpValidation>;
export type FollowUpListRequest = z.infer<typeof followUpListQueryValidation>;
