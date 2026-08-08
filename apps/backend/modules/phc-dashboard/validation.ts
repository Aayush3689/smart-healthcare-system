import {
  AppointmentStatus,
  Disease,
  FollowUpStatus,
  ReferralPriority,
  ReferralStatus,
  UserStatus,
} from "@prisma/client";
import { z } from "zod";

const uuid = z.string().uuid();
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);
const pagination = { page, limit };

export const dashboardQueryValidation = z.object({}).strict();
export const referralDashboardQueryValidation = z
  .object({
    status: z.nativeEnum(ReferralStatus).optional(),
    priority: z.nativeEnum(ReferralPriority).optional(),
    doctorId: uuid.optional(),
    villageId: uuid.optional(),
    ...pagination,
  })
  .strict();
export const highRiskDashboardQueryValidation = z
  .object({
    disease: z.nativeEnum(Disease).optional(),
    villageId: uuid.optional(),
    ashaWorkerId: uuid.optional(),
    ...pagination,
  })
  .strict();
export const appointmentDashboardQueryValidation = z
  .object({
    date: z.coerce.date().optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    doctorId: uuid.optional(),
    villageId: uuid.optional(),
    ...pagination,
  })
  .strict();
export const followUpDashboardQueryValidation = z
  .object({
    status: z.nativeEnum(FollowUpStatus).optional(),
    villageId: uuid.optional(),
    ashaWorkerId: uuid.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    ...pagination,
  })
  .strict()
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "from must be before to",
    path: ["from"],
  });
export const villageDashboardQueryValidation = z
  .object({ search: z.string().trim().min(1).max(150).optional(), ...pagination })
  .strict();
export const doctorDashboardQueryValidation = z
  .object({ status: z.nativeEnum(UserStatus).optional(), ...pagination })
  .strict();
export const ashaDashboardQueryValidation = z
  .object({
    villageId: uuid.optional(),
    status: z.nativeEnum(UserStatus).optional(),
    ...pagination,
  })
  .strict();
export const trendDashboardQueryValidation = z
  .object({ period: z.enum(["7D", "30D", "90D"]).default("30D") })
  .strict();

export type ReferralDashboardQuery = z.infer<typeof referralDashboardQueryValidation>;
export type HighRiskDashboardQuery = z.infer<typeof highRiskDashboardQueryValidation>;
export type AppointmentDashboardQuery = z.infer<typeof appointmentDashboardQueryValidation>;
export type FollowUpDashboardQuery = z.infer<typeof followUpDashboardQueryValidation>;
export type VillageDashboardQuery = z.infer<typeof villageDashboardQueryValidation>;
export type DoctorDashboardQuery = z.infer<typeof doctorDashboardQueryValidation>;
export type AshaDashboardQuery = z.infer<typeof ashaDashboardQueryValidation>;
export type TrendDashboardQuery = z.infer<typeof trendDashboardQueryValidation>;
