import { PrismaClient, Role, UserStatus } from "@prisma/client";

export class AuthRepository {
  public constructor(private readonly prisma: PrismaClient) {}
  public findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { ashaProfile: true, doctorProfile: true, adminProfile: true },
    });
  }
  public findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { ashaProfile: true, doctorProfile: true, adminProfile: true },
    });
  }
  public createOtp(userId: string, email: string, otpHash: string, expiresAt: Date) {
    return this.prisma.otpVerification.create({
      data: { userId, email, otpHash, expiresAt },
    });
  }
  public latestOtp(email: string) {
    return this.prisma.otpVerification.findFirst({
      where: { email, verifiedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
  }
  public markOtpVerified(id: string) {
    return this.prisma.otpVerification.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }
  public activateUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        lastLoginAt: new Date(),
      },
    });
  }
  public createRefreshToken(
    userId: string,
    tokenHash: string,
    platform: "MOBILE_APP" | "DOCTOR_DASHBOARD" | "ADMIN_DASHBOARD",
    deviceId: string | undefined,
    expiresAt: Date,
  ) {
    return this.prisma.refreshToken.create({
      data: { userId, tokenHash, platform, deviceId, expiresAt },
    });
  }
  public findRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { status: UserStatus.ACTIVE },
      },
      include: { user: true },
    });
  }
  public revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
  public updateEmail(id: string, email: string) {
    return this.prisma.user.update({
      where: { id },
      data: { email, isEmailVerified: false },
    });
  }
  public completeLogin(input: {
    otpId: string;
    userId: string;
    tokenHash: string;
    platform: "MOBILE_APP" | "DOCTOR_DASHBOARD" | "ADMIN_DASHBOARD";
    deviceId?: string;
    expiresAt: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.otpVerification.update({
        where: { id: input.otpId },
        data: { verifiedAt: new Date() },
      });
      await tx.user.update({
        where: { id: input.userId },
        data: {
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          lastLoginAt: new Date(),
        },
      });
      return tx.refreshToken.create({
        data: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          platform: input.platform,
          deviceId: input.deviceId,
          expiresAt: input.expiresAt,
        },
      });
    });
  }
  public rotateRefreshToken(input: {
    currentId: string;
    userId: string;
    tokenHash: string;
    platform: "MOBILE_APP" | "DOCTOR_DASHBOARD" | "ADMIN_DASHBOARD";
    deviceId?: string;
    expiresAt: Date;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const revoked = await tx.refreshToken.updateMany({
        where: { id: input.currentId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (revoked.count !== 1) throw new Error("Refresh token has already been revoked.");
      return tx.refreshToken.create({
        data: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          platform: input.platform,
          deviceId: input.deviceId,
          expiresAt: input.expiresAt,
        },
      });
    });
  }
  public async provision(data: {
    email: string;
    role: Role;
    fullName: string;
    phcId?: string;
    villageId?: string;
    employeeCode?: string;
    invitedById: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          role: data.role,
          invitedById: data.invitedById,
        },
      });
      if (data.role === Role.DOCTOR) {
        if (!data.phcId) throw new Error("phcId is required for a doctor.");
        await tx.doctorProfile.create({
          data: { userId: user.id, fullName: data.fullName, phcId: data.phcId },
        });
      } else if (data.role === Role.ASHA_WORKER) {
        if (!data.villageId || !data.employeeCode)
          throw new Error("villageId and employeeCode are required for an ASHA worker.");
        await tx.ashaWorkerProfile.create({
          data: {
            userId: user.id,
            fullName: data.fullName,
            villageId: data.villageId,
            employeeCode: data.employeeCode,
          },
        });
      } else throw new Error("PHC_ADMIN accounts are created only by the seed process.");
      return user;
    });
  }

  public adminPhc(userId: string) {
    return this.prisma.adminProfile.findUnique({
      where: { userId },
      select: { phcId: true },
    });
  }

  public village(id: string) {
    return this.prisma.village.findUnique({
      where: { id },
      select: { id: true, phcId: true, isActive: true },
    });
  }
}
