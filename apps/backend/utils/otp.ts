import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const OTP_LENGTH = 6;
const OTP_MIN = 10 ** (OTP_LENGTH - 1);
const OTP_MAX_EXCLUSIVE = 10 ** OTP_LENGTH;

export function createOtp(): string {
  return crypto.randomInt(OTP_MIN, OTP_MAX_EXCLUSIVE).toString();
}

export function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 12);
}

export function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}
