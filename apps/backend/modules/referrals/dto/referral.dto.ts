import type { z } from "zod";
import type {
  assignDoctorValidation,
  cancelReferralValidation,
  completeReferralValidation,
  createReferralValidation,
  referralListQueryValidation,
  rejectReferralValidation,
} from "../validation.js";

export type CreateReferralRequest = z.infer<typeof createReferralValidation>;
export type ReferralListRequest = z.infer<typeof referralListQueryValidation>;
export type AssignDoctorRequest = z.infer<typeof assignDoctorValidation>;
export type RejectReferralRequest = z.infer<typeof rejectReferralValidation>;
export type CancelReferralRequest = z.infer<typeof cancelReferralValidation>;
export type CompleteReferralRequest = z.infer<typeof completeReferralValidation>;
