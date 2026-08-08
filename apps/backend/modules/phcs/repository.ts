import {
  AppointmentStatus,
  Disease,
  FollowUpStatus,
  ReferralStatus,
  RiskLevel,
  UserStatus,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";
import type { UpdatePhcInput } from "./validation.js";

export class PhcRepository {
  public constructor(private readonly db: PrismaClient) {}

  public find(id: string) {
    return this.db.primaryHealthCentre.findUnique({ where: { id } });
  }

  public update(id: string, input: UpdatePhcInput, userId: string) {
    return this.db.$transaction(async (tx) => {
      const phc = await tx.primaryHealthCentre.update({ where: { id }, data: input });
      await tx.auditLog.create({
        data: {
          userId,
          action: "PHC_UPDATED",
          entityType: "PHC",
          entityId: id,
          newData: input,
        },
      });
      return phc;
    });
  }

  public villages(phcId: string) {
    return this.db.village.findMany({ where: { phcId }, orderBy: { name: "asc" } });
  }

  public village(phcId: string, id: string) {
    return this.db.village.findFirst({ where: { id, phcId } });
  }

  public ashaWorkers(phcId: string) {
    return this.db.ashaWorkerProfile.findMany({
      where: { village: { phcId } },
      include: { user: true, village: true },
      orderBy: { fullName: "asc" },
    });
  }

  public async overview(phcId: string, today: Date) {
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const [
      totalPatients,
      totalAshaWorkers,
      totalDoctors,
      activeDoctors,
      pendingReferrals,
      risks,
      appointmentsToday,
      followUpsDue,
      missedFollowUps,
    ] = await Promise.all([
      this.db.patient.count({ where: { village: { phcId } } }),
      this.db.ashaWorkerProfile.count({ where: { village: { phcId } } }),
      this.db.doctorProfile.count({ where: { phcId } }),
      this.db.doctorProfile.count({ where: { phcId, user: { status: UserStatus.ACTIVE } } }),
      this.db.referral.count({ where: this.referralScope(phcId, ReferralStatus.PENDING) }),
      this.db.prediction.findMany({
        where: { riskLevel: RiskLevel.HIGH, assessment: { patient: { village: { phcId } } } },
        select: { assessment: { select: { patientId: true } } },
      }),
      this.db.appointment.count({ where: { phcId, scheduledAt: { gte: today, lt: tomorrow } } }),
      this.db.followUp.count({
        where: {
          patient: { village: { phcId } },
          status: FollowUpStatus.SCHEDULED,
          scheduledDate: { lt: tomorrow },
        },
      }),
      this.db.followUp.count({
        where: { patient: { village: { phcId } }, status: FollowUpStatus.MISSED },
      }),
    ]);
    return {
      totalPatients,
      totalAshaWorkers,
      totalDoctors,
      activeDoctors,
      pendingReferrals,
      highRiskPatients: new Set(risks.map((item) => item.assessment.patientId)).size,
      appointmentsToday,
      followUpsDue,
      missedFollowUps,
    };
  }

  public async statistics(phcId: string, villageId?: string, from?: Date, to?: Date) {
    const patient = { village: { phcId, id: villageId } };
    const createdAt = this.range(from, to);
    const referral = { AND: [this.referralScope(phcId), { patient, createdAt }] };
    const appointment = { phcId, patient, createdAt };
    const followUp = { patient, createdAt };
    const [
      patientTotal,
      patientNew,
      assessments,
      predictionTotal,
      highRisk,
      mediumRisk,
      lowRisk,
      referralTotal,
      referralPending,
      referralCompleted,
      referralRejected,
      appointmentTotal,
      appointmentCompleted,
      appointmentCancelled,
      appointmentNoShow,
      followUpDue,
      followUpCompleted,
      followUpMissed,
    ] = await Promise.all([
      this.db.patient.count({ where: patient }),
      this.db.patient.count({ where: { ...patient, createdAt } }),
      this.db.assessment.count({ where: { patient, createdAt } }),
      this.db.prediction.count({ where: { assessment: { patient }, createdAt } }),
      this.db.prediction.count({
        where: { assessment: { patient }, riskLevel: RiskLevel.HIGH, createdAt },
      }),
      this.db.prediction.count({
        where: { assessment: { patient }, riskLevel: RiskLevel.MEDIUM, createdAt },
      }),
      this.db.prediction.count({
        where: { assessment: { patient }, riskLevel: RiskLevel.LOW, createdAt },
      }),
      this.db.referral.count({ where: referral }),
      this.db.referral.count({ where: { AND: [referral, { status: ReferralStatus.PENDING }] } }),
      this.db.referral.count({ where: { AND: [referral, { status: ReferralStatus.COMPLETED }] } }),
      this.db.referral.count({ where: { AND: [referral, { status: ReferralStatus.REJECTED }] } }),
      this.db.appointment.count({ where: appointment }),
      this.db.appointment.count({ where: { ...appointment, status: AppointmentStatus.COMPLETED } }),
      this.db.appointment.count({ where: { ...appointment, status: AppointmentStatus.CANCELLED } }),
      this.db.appointment.count({ where: { ...appointment, status: AppointmentStatus.NO_SHOW } }),
      this.db.followUp.count({
        where: {
          ...followUp,
          status: FollowUpStatus.SCHEDULED,
          scheduledDate: { lte: to ?? new Date() },
        },
      }),
      this.db.followUp.count({ where: { ...followUp, status: FollowUpStatus.COMPLETED } }),
      this.db.followUp.count({ where: { ...followUp, status: FollowUpStatus.MISSED } }),
    ]);
    return {
      patients: { total: patientTotal, new: patientNew },
      assessments: { total: assessments },
      predictions: { total: predictionTotal, highRisk, mediumRisk, lowRisk },
      referrals: {
        total: referralTotal,
        pending: referralPending,
        completed: referralCompleted,
        rejected: referralRejected,
      },
      appointments: {
        total: appointmentTotal,
        completed: appointmentCompleted,
        cancelled: appointmentCancelled,
        noShow: appointmentNoShow,
      },
      followUps: { due: followUpDue, completed: followUpCompleted, missed: followUpMissed },
    };
  }

  public async diseaseStatistics(phcId: string, villageId?: string, from?: Date, to?: Date) {
    const patient = { village: { phcId, id: villageId } };
    const createdAt = this.range(from, to);
    const pairs = await Promise.all(
      Object.values(Disease).map(
        async (disease) =>
          [
            disease,
            {
              assessed: await this.db.prediction.count({
                where: { disease, createdAt, assessment: { patient } },
              }),
              highRisk: await this.db.prediction.count({
                where: { disease, riskLevel: RiskLevel.HIGH, createdAt, assessment: { patient } },
              }),
            },
          ] as const,
      ),
    );
    return Object.fromEntries(pairs);
  }

  public async villageStatistics(phcId: string) {
    const villages = await this.villages(phcId);
    return Promise.all(
      villages.map(async (village) => {
        const patient = { villageId: village.id };
        const [patients, assessments, risks, pendingReferrals, missedFollowUps] = await Promise.all(
          [
            this.db.patient.count({ where: patient }),
            this.db.assessment.count({ where: { patient } }),
            this.db.prediction.findMany({
              where: { riskLevel: RiskLevel.HIGH, assessment: { patient } },
              select: { assessment: { select: { patientId: true } } },
            }),
            this.db.referral.count({ where: { patient, status: ReferralStatus.PENDING } }),
            this.db.followUp.count({ where: { patient, status: FollowUpStatus.MISSED } }),
          ],
        );
        return {
          villageId: village.id,
          villageName: village.name,
          patients,
          assessments,
          highRiskPatients: new Set(risks.map((item) => item.assessment.patientId)).size,
          pendingReferrals,
          missedFollowUps,
        };
      }),
    );
  }

  public async operations(phcId: string, today: Date) {
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const patient = { village: { phcId } };
    const [pending, awaiting, inProgress, appointmentsToday, upcoming, followUpsToday, overdue] =
      await Promise.all([
        this.db.referral.count({ where: this.referralScope(phcId, ReferralStatus.PENDING) }),
        this.db.referral.count({ where: this.referralScope(phcId, ReferralStatus.ACCEPTED) }),
        this.db.referral.count({ where: this.referralScope(phcId, ReferralStatus.IN_PROGRESS) }),
        this.db.appointment.count({ where: { phcId, scheduledAt: { gte: today, lt: tomorrow } } }),
        this.db.appointment.count({
          where: {
            phcId,
            scheduledAt: { gte: tomorrow },
            status: {
              in: [
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.RESCHEDULED,
              ],
            },
          },
        }),
        this.db.followUp.count({
          where: {
            patient,
            scheduledDate: { gte: today, lt: tomorrow },
            status: FollowUpStatus.SCHEDULED,
          },
        }),
        this.db.followUp.count({
          where: { patient, scheduledDate: { lt: today }, status: FollowUpStatus.SCHEDULED },
        }),
      ]);
    return {
      referrals: { pending, awaitingDoctorAssignment: awaiting, inProgress },
      appointments: { today: appointmentsToday, upcoming },
      followUps: { today: followUpsToday, overdue },
    };
  }

  private referralScope(phcId: string, status?: ReferralStatus): Prisma.ReferralWhereInput {
    return { status, OR: [{ recommendedPhcId: phcId }, { assignedPhcId: phcId }] };
  }

  private range(from?: Date, to?: Date): Prisma.DateTimeFilter | undefined {
    return from || to ? { gte: from, lte: to } : undefined;
  }
}
