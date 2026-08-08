import { Role, UserStatus, type PrismaClient } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";

export class AccessPolicy {
  public constructor(private readonly prisma: PrismaClient) {}

  public async requireActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE)
      throw new AppError("Your account is not active.", 403, "ACCOUNT_INACTIVE");
    return user;
  }

  public async requireAdminPhc(userId: string, phcId?: string) {
    const profile = await this.prisma.adminProfile.findUnique({
      where: { userId },
      include: { phc: true },
    });
    if (!profile || (phcId && profile.phcId !== phcId)) throw this.forbidden();
    return profile;
  }

  public async requireDoctor(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: { user: true, phc: true },
    });
    if (!profile || profile.user.status !== UserStatus.ACTIVE) throw this.forbidden();
    return profile;
  }

  public async requireAsha(userId: string) {
    const profile = await this.prisma.ashaWorkerProfile.findUnique({
      where: { userId },
      include: { user: true, village: { include: { phc: true } } },
    });
    if (!profile || profile.user.status !== UserStatus.ACTIVE) throw this.forbidden();
    return profile;
  }

  public async phcId(userId: string, role: Role): Promise<string> {
    if (role === Role.PHC_ADMIN) return (await this.requireAdminPhc(userId)).phcId;
    if (role === Role.DOCTOR) return (await this.requireDoctor(userId)).phcId;
    const phcId = (await this.requireAsha(userId)).village.phcId;
    if (!phcId) throw this.forbidden();
    return phcId;
  }

  public forbidden(): AppError {
    return new AppError("You do not have permission to access this resource.", 403, "FORBIDDEN");
  }
}
