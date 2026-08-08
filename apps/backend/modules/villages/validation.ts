import {
  Disease,
  FollowUpStatus,
  ReferralPriority,
  ReferralStatus,
  RiskLevel,
} from "@prisma/client";
import { z } from "zod";

const uuid = z.string().uuid();
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);
const search = z.string().trim().min(1).max(150).optional();

export const villageIdParamValidation = z.object({ villageId: uuid }).strict();
export const villageListQueryValidation = z.object({ search, page, limit }).strict();
export const villagePatientQueryValidation = z
  .object({
    search,
    riskLevel: z.nativeEnum(RiskLevel).optional(),
    ashaWorkerId: uuid.optional(),
    page,
    limit,
  })
  .strict();
export const villageReferralQueryValidation = z
  .object({
    status: z.nativeEnum(ReferralStatus).optional(),
    priority: z.nativeEnum(ReferralPriority).optional(),
    page,
    limit,
  })
  .strict();
export const villageFollowUpQueryValidation = z
  .object({
    status: z.nativeEnum(FollowUpStatus).optional(),
    priority: z.nativeEnum(ReferralPriority).optional(),
    page,
    limit,
  })
  .strict();
export const villageHighRiskQueryValidation = z
  .object({ disease: z.nativeEnum(Disease).optional(), page, limit })
  .strict();
export const villageStatisticsQueryValidation = z.object({}).strict();
export const villageDiseaseStatisticsQueryValidation = z
  .object({ from: z.coerce.date().optional(), to: z.coerce.date().optional() })
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "from must be before to",
    path: ["from"],
  });

export type VillageListQuery = z.infer<typeof villageListQueryValidation>;
export type VillagePatientQuery = z.infer<typeof villagePatientQueryValidation>;
export type VillageReferralQuery = z.infer<typeof villageReferralQueryValidation>;
export type VillageFollowUpQuery = z.infer<typeof villageFollowUpQueryValidation>;
export type VillageHighRiskQuery = z.infer<typeof villageHighRiskQueryValidation>;
export type VillageDiseaseStatisticsQuery = z.infer<typeof villageDiseaseStatisticsQueryValidation>;
