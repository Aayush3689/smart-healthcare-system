import { Platform, Role } from "@prisma/client";
import { z } from "zod";

const email = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((value) => value.toLowerCase());

export const requestOtpValidation = z.object({ email }).strict();
export const verifyOtpValidation = z
  .object({
    email,
    otp: z.string().regex(/^\d{6}$/),
    platform: z.nativeEnum(Platform).default(Platform.MOBILE_APP),
    deviceId: z.string().trim().max(200).optional(),
  })
  .strict();
export const refreshTokenValidation = z
  .object({ refreshToken: z.string().min(40).max(300) })
  .strict();
export const updateLoginDetailsValidation = z.object({ email }).strict();
export const provisionAccountValidation = z.discriminatedUnion("role", [
  z
    .object({
      email,
      role: z.literal(Role.DOCTOR),
      fullName: z.string().trim().min(2).max(150),
      phcId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      email,
      role: z.literal(Role.ASHA_WORKER),
      fullName: z.string().trim().min(2).max(150),
      villageId: z.string().uuid(),
      employeeCode: z.string().trim().min(2).max(100),
    })
    .strict(),
]);

export type RequestOtpInput = z.infer<typeof requestOtpValidation>;
export type VerifyOtpInput = z.infer<typeof verifyOtpValidation>;
export type RefreshTokenInput = z.infer<typeof refreshTokenValidation>;
export type UpdateLoginDetailsInput = z.infer<typeof updateLoginDetailsValidation>;
export type ProvisionAccountInput = z.infer<typeof provisionAccountValidation>;
