import crypto from "node:crypto";
import { Platform, Role, UserStatus } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import type { JwtService } from "../../utils/jwt.js";
import type { MailService } from "../../integrations/mail.service.js";
import type { LoginResponseDto, AuthUserResponseDto } from "./dto/auth.dto.js";
import type { ProvisionAccountInput } from "./validation.js";
import { AuthRepository } from "./repository.js";
import { createOtp, hashOtp, otpExpiryDate, verifyOtp } from "../../utils/otp.js";

export class AuthService {
  public constructor(
    private readonly repository: AuthRepository,
    private readonly mailer: MailService,
    private readonly jwtService: JwtService,
  ) {}
  private readonly accessTokenLifetime = "15m";
  private readonly refreshTokenLifetimeMs = 1000 * 60 * 60 * 24 * 30;

  public async requestOtp(email: string): Promise<void> {
    const user = await this.repository.findUserByEmail(email.toLowerCase());
    if (!user || user.status === UserStatus.INACTIVE)
      throw new AppError("No active account exists for this email.", 404, "ACCOUNT_NOT_FOUND");
    const otp = createOtp();
    await this.repository.createOtp(user.id, user.email, await hashOtp(otp), otpExpiryDate());
    await this.mailer.sendLoginOtp(user.email, otp);
  }

  public async verifyOtp(
    email: string,
    otp: string,
    platform: Platform,
    deviceId?: string,
  ): Promise<LoginResponseDto> {
    const record = await this.repository.latestOtp(email.toLowerCase());
    if (!record || !(await verifyOtp(otp, record.otpHash)))
      throw new AppError("The verification code is invalid or expired.", 401, "INVALID_OTP");
    const user = await this.repository.findUserById(record.userId!);
    if (!user) throw new AppError("Account not found.", 404, "ACCOUNT_NOT_FOUND");
    const refreshToken = crypto.randomBytes(48).toString("base64url");
    await this.repository.completeLogin({
      otpId: record.id,
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      platform,
      deviceId,
      expiresAt: new Date(Date.now() + this.refreshTokenLifetimeMs),
    });
    return {
      user: this.publicUser(user),
      accessToken: this.accessToken(user.id, user.role),
      refreshToken,
    };
  }

  public async refresh(refreshToken: string) {
    const active = await this.findActiveRefreshToken(refreshToken);
    const token = crypto.randomBytes(48).toString("base64url");
    await this.repository.rotateRefreshToken({
      currentId: active.id,
      userId: active.userId,
      tokenHash: this.hashToken(token),
      platform: active.platform,
      deviceId: active.deviceId ?? undefined,
      expiresAt: new Date(Date.now() + this.refreshTokenLifetimeMs),
    });
    return { accessToken: this.accessToken(active.user.id, active.user.role), refreshToken: token };
  }

  public async logout(refreshToken: string) {
    const active = await this.findActiveRefreshToken(refreshToken);
    await this.repository.revokeRefreshToken(active.id);
  }
  public async me(userId: string) {
    const user = await this.repository.findUserById(userId);
    if (!user) throw new AppError("Account not found.", 404, "ACCOUNT_NOT_FOUND");
    return this.publicUser(user);
  }
  public async changeEmail(userId: string, email: string) {
    try {
      return this.publicUser(await this.repository.updateEmail(userId, email.toLowerCase()));
    } catch {
      throw new AppError("This email address is already in use.", 409, "EMAIL_ALREADY_IN_USE");
    }
  }
  public async provision(actorId: string, input: ProvisionAccountInput) {
    try {
      const admin = await this.repository.adminPhc(actorId);
      if (!admin) throw new AppError("PHC administrator profile not found.", 403, "FORBIDDEN");

      if (input.role === Role.ASHA_WORKER) {
        const village = await this.repository.village(input.villageId);
        if (!village || village.phcId !== admin.phcId || !village.isActive) {
          throw new AppError(
            "Village was not found in your PHC or is inactive.",
            404,
            "VILLAGE_NOT_FOUND",
          );
        }
      }

      if (input.role === Role.DOCTOR && input.phcId !== admin.phcId) {
        throw new AppError(
          "Doctors can only be provisioned in your PHC.",
          403,
          "PHC_SCOPE_VIOLATION",
        );
      }

      return this.publicUser(await this.repository.provision({ ...input, invitedById: actorId }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        error instanceof Error ? error.message : "Could not create account.",
        400,
        "ACCOUNT_PROVISION_FAILED",
      );
    }
  }

  private async findActiveRefreshToken(token: string) {
    const record = await this.repository.findRefreshToken(this.hashToken(token));
    if (!record)
      throw new AppError("Refresh token is invalid or expired.", 401, "INVALID_REFRESH_TOKEN");
    return record;
  }
  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
  private accessToken(userId: string, role: Role) {
    return this.jwtService.sign({ sub: userId, role });
  }
  private publicUser(user: {
    id: string;
    email: string;
    role: Role;
    status: UserStatus;
    isEmailVerified: boolean;
  }): AuthUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
