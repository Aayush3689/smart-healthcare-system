import type { z } from "zod";
import type {
  villageDiseaseStatisticsQueryValidation,
  villageFollowUpQueryValidation,
  villageHighRiskQueryValidation,
  villageListQueryValidation,
  villagePatientQueryValidation,
  villageReferralQueryValidation,
} from "../validation.js";

export type VillageListRequest = z.infer<typeof villageListQueryValidation>;
export type VillagePatientRequest = z.infer<typeof villagePatientQueryValidation>;
export type VillageReferralRequest = z.infer<typeof villageReferralQueryValidation>;
export type VillageFollowUpRequest = z.infer<typeof villageFollowUpQueryValidation>;
export type VillageHighRiskRequest = z.infer<typeof villageHighRiskQueryValidation>;
export type VillageDiseaseStatisticsRequest = z.infer<
  typeof villageDiseaseStatisticsQueryValidation
>;
