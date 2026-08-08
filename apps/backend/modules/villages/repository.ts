import {
  Disease,
  FollowUpStatus,
  ReferralStatus,
  RiskLevel,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";

export class VillageRepository {
  public constructor(private readonly db: PrismaClient) {}

  public find(id: string) {
    return this.db.village.findUnique({ where: { id }, include: { phc: true } });
  }

  public async list(where: Prisma.VillageWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.village.findMany({
        where,
        include: { phc: true },
        orderBy: { name: "asc" },
        skip,
        take,
      }),
      this.db.village.count({ where }),
    ]);
  }

  public ashaWorkers(villageId: string) {
    return this.db.ashaWorkerProfile.findMany({
      where: { villageId },
      include: { user: true },
      orderBy: { fullName: "asc" },
    });
  }

  public async patients(where: Prisma.PatientWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.patient.findMany({
        where,
        include: {
          registeredBy: true,
          assessments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { predictions: { orderBy: { probability: "desc" }, take: 1 } },
          },
        },
        orderBy: { fullName: "asc" },
        skip,
        take,
      }),
      this.db.patient.count({ where }),
    ]);
  }

  public async statistics(villageId: string, tomorrow: Date) {
    const patient = { villageId };
    const [
      patients,
      assessments,
      risks,
      pendingReferrals,
      appointments,
      followUpsDue,
      missedFollowUps,
      ashaWorkers,
    ] = await Promise.all([
      this.db.patient.count({ where: patient }),
      this.db.assessment.count({ where: { patient } }),
      this.db.prediction.findMany({
        where: { riskLevel: RiskLevel.HIGH, assessment: { patient } },
        select: { assessment: { select: { patientId: true } } },
      }),
      this.db.referral.count({ where: { patient, status: ReferralStatus.PENDING } }),
      this.db.appointment.count({ where: { patient } }),
      this.db.followUp.count({
        where: { patient, status: FollowUpStatus.SCHEDULED, scheduledDate: { lt: tomorrow } },
      }),
      this.db.followUp.count({ where: { patient, status: FollowUpStatus.MISSED } }),
      this.db.ashaWorkerProfile.count({ where: { villageId } }),
    ]);
    return {
      patients,
      assessments,
      highRiskPatients: new Set(risks.map((item) => item.assessment.patientId)).size,
      pendingReferrals,
      appointments,
      followUpsDue,
      missedFollowUps,
      ashaWorkers,
    };
  }

  public async diseaseStatistics(villageId: string, from?: Date, to?: Date) {
    const createdAt = from || to ? { gte: from, lte: to } : undefined;
    const pairs = await Promise.all(
      Object.values(Disease).map(
        async (disease) =>
          [
            disease,
            {
              assessed: await this.db.prediction.count({
                where: { disease, createdAt, assessment: { patient: { villageId } } },
              }),
              highRisk: await this.db.prediction.count({
                where: {
                  disease,
                  riskLevel: RiskLevel.HIGH,
                  createdAt,
                  assessment: { patient: { villageId } },
                },
              }),
            },
          ] as const,
      ),
    );
    return Object.fromEntries(pairs);
  }

  public async highRisk(where: Prisma.PredictionWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.prediction.findMany({
        where,
        include: { assessment: { include: { patient: true } } },
        orderBy: { probability: "desc" },
        skip,
        take,
      }),
      this.db.prediction.count({ where }),
    ]);
  }

  public async referrals(where: Prisma.ReferralWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.referral.findMany({
        where,
        include: { patient: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.db.referral.count({ where }),
    ]);
  }

  public async followUps(where: Prisma.FollowUpWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.followUp.findMany({
        where,
        include: { patient: true, doctor: true, assignedTo: true },
        orderBy: { scheduledDate: "asc" },
        skip,
        take,
      }),
      this.db.followUp.count({ where }),
    ]);
  }
}
