import { Role, type Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import type { RequestContext } from "./types.js";

export class AccessService {
  public constructor(private readonly prisma: PrismaClient) {}
  public forbidden(): AppError {
    return new AppError("You do not have permission to access this resource.", 403, "FORBIDDEN");
  }
  public async adminPhc(context: RequestContext, expected?: string): Promise<string> {
    if (context.role !== Role.PHC_ADMIN) throw this.forbidden();
    const profile = await this.prisma.adminProfile.findUnique({
      where: { userId: context.userId },
    });
    if (!profile || (expected && profile.phcId !== expected)) throw this.forbidden();
    return profile.phcId;
  }
  public async doctor(context: RequestContext) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: context.userId },
      include: { user: true, phc: true },
    });
    if (!profile) throw this.forbidden();
    return profile;
  }
  public async asha(context: RequestContext) {
    const profile = await this.prisma.ashaWorkerProfile.findUnique({
      where: { userId: context.userId },
      include: { user: true, village: { include: { phc: true } } },
    });
    if (!profile) throw this.forbidden();
    return profile;
  }
  public async phc(context: RequestContext): Promise<string> {
    if (context.role === Role.PHC_ADMIN) return this.adminPhc(context);
    if (context.role === Role.DOCTOR) return (await this.doctor(context)).phcId;
    const phcId = (await this.asha(context)).village.phcId;
    if (!phcId) throw this.forbidden();
    return phcId;
  }
  public async requirePhc(context: RequestContext, phcId: string): Promise<void> {
    if ((await this.phc(context)) !== phcId) throw this.forbidden();
  }
  public async patientWhere(context: RequestContext): Promise<Prisma.PatientWhereInput> {
    if (context.role === Role.ASHA_WORKER) return { registeredById: (await this.asha(context)).id };
    return { village: { phcId: await this.phc(context) } };
  }
  public async patient(context: RequestContext, patientId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, ...(await this.patientWhere(context)) },
      include: { village: true, registeredBy: true },
    });
    if (!patient) throw new AppError("Patient not found.", 404, "PATIENT_NOT_FOUND");
    return patient;
  }
}
