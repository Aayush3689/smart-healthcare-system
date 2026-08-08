import {
  AppointmentStatus,
  FollowUpStatus,
  ReferralStatus,
  RiskLevel,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";
import type {
  AppointmentDashboardQuery,
  AshaDashboardQuery,
  DoctorDashboardQuery,
  FollowUpDashboardQuery,
  HighRiskDashboardQuery,
  ReferralDashboardQuery,
  VillageDashboardQuery,
} from "./validation.js";

const referralSelect = {
  id: true,
  priority: true,
  status: true,
  createdAt: true,
  patient: { select: { id: true, fullName: true, village: { select: { id: true, name: true } } } },
} satisfies Prisma.ReferralSelect;
const appointmentSelect = {
  id: true,
  scheduledAt: true,
  durationMinutes: true,
  status: true,
  patient: { select: { id: true, fullName: true } },
  doctor: { select: { id: true, fullName: true } },
} satisfies Prisma.AppointmentSelect;
const followUpSelect = {
  id: true,
  scheduledDate: true,
  status: true,
  patient: {
    select: { id: true, fullName: true, village: { select: { id: true, name: true } } },
  },
  assignedTo: { select: { id: true, fullName: true } },
} satisfies Prisma.FollowUpSelect;
const predictionSelect = {
  id: true,
  disease: true,
  riskLevel: true,
  probability: true,
  assessment: {
    select: {
      id: true,
      patient: {
        select: { id: true, fullName: true, village: { select: { id: true, name: true } } },
      },
    },
  },
} satisfies Prisma.PredictionSelect;

export class PhcDashboardRepository {
  public constructor(private readonly db: PrismaClient) {}

  public async summary(phcId: string, today: Date, tomorrow: Date) {
    const patientScope = { village: { phcId } };
    const dueStatuses = [FollowUpStatus.PENDING, FollowUpStatus.SCHEDULED];
    const [
      totalPatients,
      totalAshaWorkers,
      totalDoctors,
      totalAssessments,
      highRisks,
      pendingReferrals,
      appointmentsToday,
      followUpsDue,
      missedFollowUps,
    ] = await Promise.all([
      this.db.patient.count({ where: patientScope }),
      this.db.ashaWorkerProfile.count({ where: { village: { phcId } } }),
      this.db.doctorProfile.count({ where: { phcId } }),
      this.db.assessment.count({ where: { patient: patientScope } }),
      this.db.prediction.findMany({
        where: { riskLevel: RiskLevel.HIGH, assessment: { patient: patientScope } },
        select: { assessment: { select: { patientId: true } } },
      }),
      this.db.referral.count({
        where: this.referralScope(phcId, { status: ReferralStatus.PENDING }),
      }),
      this.db.appointment.count({ where: { phcId, scheduledAt: { gte: today, lt: tomorrow } } }),
      this.db.followUp.count({
        where: {
          patient: patientScope,
          status: { in: dueStatuses },
          scheduledDate: { lt: tomorrow },
        },
      }),
      this.db.followUp.count({ where: { patient: patientScope, status: FollowUpStatus.MISSED } }),
    ]);
    return {
      totalPatients,
      totalAshaWorkers,
      totalDoctors,
      totalAssessments,
      highRiskPatients: new Set(highRisks.map((item) => item.assessment.patientId)).size,
      pendingReferrals,
      appointmentsToday,
      followUpsDue,
      missedFollowUps,
    };
  }

  public async highlights(phcId: string, today: Date, tomorrow: Date) {
    const patient = { village: { phcId } };
    const [recentReferrals, todayAppointments, highRiskPatients, followUpsDue] = await Promise.all([
      this.db.referral.findMany({
        where: this.referralScope(phcId),
        select: referralSelect,
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.db.appointment.findMany({
        where: { phcId, scheduledAt: { gte: today, lt: tomorrow } },
        select: appointmentSelect,
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      this.db.prediction.findMany({
        where: { riskLevel: RiskLevel.HIGH, assessment: { patient } },
        select: predictionSelect,
        orderBy: { generatedAt: "desc" },
        take: 5,
      }),
      this.db.followUp.findMany({
        where: {
          patient,
          status: { in: [FollowUpStatus.PENDING, FollowUpStatus.SCHEDULED] },
          scheduledDate: { lt: tomorrow },
        },
        select: followUpSelect,
        orderBy: { scheduledDate: "asc" },
        take: 5,
      }),
    ]);
    return { recentReferrals, todayAppointments, highRiskPatients, followUpsDue };
  }

  public referrals(phcId: string, query: ReferralDashboardQuery) {
    const where = this.referralScope(phcId, {
      status: query.status,
      priority: query.priority,
      patient: query.villageId ? { villageId: query.villageId } : undefined,
      doctorAssignments: query.doctorId ? { some: { doctorId: query.doctorId } } : undefined,
    });
    return this.page(
      this.db.referral.findMany({
        where,
        select: referralSelect,
        orderBy: { createdAt: "desc" },
        skip: this.skip(query),
        take: query.limit,
      }),
      this.db.referral.count({ where }),
    );
  }

  public highRiskPatients(phcId: string, query: HighRiskDashboardQuery) {
    const where: Prisma.PredictionWhereInput = {
      riskLevel: RiskLevel.HIGH,
      disease: query.disease,
      assessment: {
        patient: {
          village: { phcId, id: query.villageId },
          registeredById: query.ashaWorkerId,
        },
      },
    };
    return this.page(
      this.db.prediction.findMany({
        where,
        select: predictionSelect,
        orderBy: { generatedAt: "desc" },
        skip: this.skip(query),
        take: query.limit,
      }),
      this.db.prediction.count({ where }),
    );
  }

  public appointments(
    phcId: string,
    query: AppointmentDashboardQuery,
    date?: Prisma.DateTimeFilter,
  ) {
    const where: Prisma.AppointmentWhereInput = {
      phcId,
      status: query.status,
      doctorId: query.doctorId,
      scheduledAt: date,
      patient: query.villageId ? { villageId: query.villageId } : undefined,
    };
    return this.page(
      this.db.appointment.findMany({
        where,
        select: appointmentSelect,
        orderBy: { scheduledAt: "asc" },
        skip: this.skip(query),
        take: query.limit,
      }),
      this.db.appointment.count({ where }),
    );
  }

  public followUps(phcId: string, query: FollowUpDashboardQuery, range?: Prisma.DateTimeFilter) {
    const where: Prisma.FollowUpWhereInput = {
      status: query.status,
      assignedToId: query.ashaWorkerId,
      scheduledDate: range,
      patient: { village: { phcId, id: query.villageId } },
    };
    return this.page(
      this.db.followUp.findMany({
        where,
        select: followUpSelect,
        orderBy: { scheduledDate: "asc" },
        skip: this.skip(query),
        take: query.limit,
      }),
      this.db.followUp.count({ where }),
    );
  }

  public async villages(phcId: string, query: VillageDashboardQuery, today: Date, tomorrow: Date) {
    const where: Prisma.VillageWhereInput = {
      phcId,
      name: query.search ? { contains: query.search, mode: "insensitive" } : undefined,
    };
    const [villages, total] = await Promise.all([
      this.db.village.findMany({
        where,
        orderBy: { name: "asc" },
        skip: this.skip(query),
        take: query.limit,
      }),
      this.db.village.count({ where }),
    ]);
    const items = await Promise.all(
      villages.map(async (village) => {
        const patient = { villageId: village.id };
        const [
          patients,
          assessments,
          risks,
          pendingReferrals,
          appointmentsToday,
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
          this.db.appointment.count({
            where: { patient, scheduledAt: { gte: today, lt: tomorrow } },
          }),
          this.db.followUp.count({
            where: {
              patient,
              status: { in: [FollowUpStatus.PENDING, FollowUpStatus.SCHEDULED] },
              scheduledDate: { lt: tomorrow },
            },
          }),
          this.db.followUp.count({ where: { patient, status: FollowUpStatus.MISSED } }),
          this.db.ashaWorkerProfile.count({ where: { villageId: village.id } }),
        ]);
        return {
          villageId: village.id,
          name: village.name,
          population: village.population,
          patients,
          assessments,
          highRiskPatients: new Set(risks.map((item) => item.assessment.patientId)).size,
          pendingReferrals,
          appointmentsToday,
          followUpsDue,
          missedFollowUps,
          ashaWorkers,
        };
      }),
    );
    return [items, total] as const;
  }

  public async doctors(phcId: string, query: DoctorDashboardQuery, today: Date, tomorrow: Date) {
    const where: Prisma.DoctorProfileWhereInput = { phcId, user: { status: query.status } };
    const [doctors, total] = await Promise.all([
      this.db.doctorProfile.findMany({
        where,
        include: { user: true },
        orderBy: { fullName: "asc" },
        skip: this.skip(query),
        take: query.limit,
      }),
      this.db.doctorProfile.count({ where }),
    ]);
    const items = await Promise.all(
      doctors.map(async (doctor) => {
        const [todayAppointments, pendingReferrals, upcomingAppointments] = await Promise.all([
          this.db.appointment.count({
            where: { doctorId: doctor.id, scheduledAt: { gte: today, lt: tomorrow } },
          }),
          this.db.referral.count({
            where: {
              AND: [
                this.referralScope(phcId),
                {
                  status: { in: [ReferralStatus.ASSIGNED, ReferralStatus.IN_PROGRESS] },
                  doctorAssignments: { some: { doctorId: doctor.id } },
                },
              ],
            },
          }),
          this.db.appointment.count({
            where: {
              doctorId: doctor.id,
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
        ]);
        return {
          doctorId: doctor.id,
          fullName: doctor.fullName,
          specialization: doctor.specialization,
          status: doctor.user.status,
          todayAppointments,
          pendingReferrals,
          upcomingAppointments,
        };
      }),
    );
    return [items, total] as const;
  }

  public async ashaWorkers(phcId: string, query: AshaDashboardQuery) {
    const where: Prisma.AshaWorkerProfileWhereInput = {
      village: { phcId, id: query.villageId },
      user: { status: query.status },
    };
    const [workers, total] = await Promise.all([
      this.db.ashaWorkerProfile.findMany({
        where,
        include: { user: true, village: true },
        orderBy: { fullName: "asc" },
        skip: this.skip(query),
        take: query.limit,
      }),
      this.db.ashaWorkerProfile.count({ where }),
    ]);
    const items = await Promise.all(
      workers.map(async (worker) => {
        const [patientsRegistered, assessmentsCompleted, referralsCreated, followUpsCompleted] =
          await Promise.all([
            this.db.patient.count({ where: { registeredById: worker.id } }),
            this.db.assessment.count({
              where: { conductedById: worker.id, completedAt: { not: null } },
            }),
            this.db.referral.count({ where: { createdById: worker.userId } }),
            this.db.followUp.count({
              where: { assignedToId: worker.id, status: FollowUpStatus.COMPLETED },
            }),
          ]);
        return {
          ashaWorkerId: worker.id,
          fullName: worker.fullName,
          employeeCode: worker.employeeCode,
          status: worker.user.status,
          village: { id: worker.village.id, name: worker.village.name },
          patientsRegistered,
          assessmentsCompleted,
          referralsCreated,
          followUpsCompleted,
        };
      }),
    );
    return [items, total] as const;
  }

  public trends(phcId: string, from: Date) {
    const patient = { village: { phcId } };
    return Promise.all([
      this.db.assessment.findMany({
        where: { patient, createdAt: { gte: from } },
        select: { createdAt: true },
      }),
      this.db.prediction.findMany({
        where: { riskLevel: RiskLevel.HIGH, assessment: { patient }, generatedAt: { gte: from } },
        select: { generatedAt: true },
      }),
      this.db.referral.findMany({
        where: this.referralScope(phcId, { createdAt: { gte: from } }),
        select: { createdAt: true },
      }),
      this.db.appointment.findMany({
        where: { phcId, status: AppointmentStatus.COMPLETED, scheduledAt: { gte: from } },
        select: { scheduledAt: true },
      }),
    ]);
  }

  private referralScope(
    phcId: string,
    filters: Prisma.ReferralWhereInput = {},
  ): Prisma.ReferralWhereInput {
    return { AND: [{ OR: [{ recommendedPhcId: phcId }, { assignedPhcId: phcId }] }, filters] };
  }

  private skip(query: { page: number; limit: number }) {
    return (query.page - 1) * query.limit;
  }

  private page<T>(items: Promise<T[]>, total: Promise<number>) {
    return Promise.all([items, total]);
  }
}
