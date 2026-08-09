import {
  AppointmentStatus,
  AssignmentStatus,
  ReferralStatus,
  RiskLevel,
  Role,
  UserStatus,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";
import type { CreateDoctorInput, UpdateDoctorInput } from "./validation.js";

const doctorInclude = {
  user: true,
  phc: true,
  availability: true,
} satisfies Prisma.DoctorProfileInclude;

export type DoctorDetail = Prisma.DoctorProfileGetPayload<{ include: typeof doctorInclude }>;

export class DoctorRepository {
  public constructor(private readonly db: PrismaClient) {}

  public userByEmail(email: string) {
    return this.db.user.findUnique({ where: { email }, select: { id: true } });
  }

  public findById(id: string, phcId?: string) {
    return this.db.doctorProfile.findFirst({ where: { id, phcId }, include: doctorInclude });
  }

  public findByUserId(userId: string) {
    return this.db.doctorProfile.findUnique({ where: { userId }, include: doctorInclude });
  }

  public async list(where: Prisma.DoctorProfileWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.doctorProfile.findMany({
        where,
        include: doctorInclude,
        orderBy: { fullName: "asc" },
        skip,
        take,
      }),
      this.db.doctorProfile.count({ where }),
    ]);
  }

  public create(input: CreateDoctorInput, phcId: string, invitedById: string) {
    return this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          role: Role.DOCTOR,
          status: UserStatus.INVITED,
          invitedById,
        },
      });
      const doctor = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          fullName: input.fullName,
          specialization: input.specialization,
          phcId,
        },
        include: doctorInclude,
      });
      await tx.auditLog.create({
        data: {
          userId: invitedById,
          action: "DOCTOR_CREATED",
          entityType: "DOCTOR",
          entityId: doctor.id,
        },
      });
      return doctor;
    });
  }

  public update(id: string, input: UpdateDoctorInput, changedById: string) {
    return this.db.$transaction(async (tx) => {
      const doctor = await tx.doctorProfile.update({
        where: { id },
        data: input,
        include: doctorInclude,
      });
      await tx.auditLog.create({
        data: {
          userId: changedById,
          action: "DOCTOR_UPDATED",
          entityType: "DOCTOR",
          entityId: id,
          newData: input,
        },
      });
      return doctor;
    });
  }

  public updateStatus(id: string, status: UserStatus, changedById: string) {
    return this.db.$transaction(async (tx) => {
      const profile = await tx.doctorProfile.findUniqueOrThrow({ where: { id } });
      await tx.user.update({ where: { id: profile.userId }, data: { status } });
      await tx.auditLog.create({
        data: {
          userId: changedById,
          action: `DOCTOR_${status}`,
          entityType: "DOCTOR",
          entityId: id,
        },
      });
      return tx.doctorProfile.findUniqueOrThrow({ where: { id }, include: doctorInclude });
    });
  }

  public deactivationBlockers(id: string) {
    return Promise.all([
      this.db.appointment.count({
        where: {
          doctorId: id,
          scheduledAt: { gte: new Date() },
          status: {
            in: [
              AppointmentStatus.SCHEDULED,
              AppointmentStatus.CONFIRMED,
              AppointmentStatus.RESCHEDULED,
            ],
          },
        },
      }),
      this.db.doctorAssignment.count({
        where: {
          doctorId: id,
          status: { in: [AssignmentStatus.PENDING, AssignmentStatus.ACCEPTED] },
        },
      }),
    ]);
  }

  public availability(doctorId: string) {
    return this.db.doctorAvailability.findUnique({ where: { doctorId } });
  }

  public updateAvailability(
    doctorId: string,
    schedule: Prisma.InputJsonValue,
    changedById: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const availability = await tx.doctorAvailability.upsert({
        where: { doctorId },
        create: { doctorId, schedule },
        update: { schedule },
      });
      await tx.auditLog.create({
        data: {
          userId: changedById,
          action: "DOCTOR_AVAILABILITY_UPDATED",
          entityType: "DOCTOR",
          entityId: doctorId,
          newData: schedule,
        },
      });
      return availability;
    });
  }

  public async summary(doctorId: string, today: Date) {
    const tomorrow = new Date(today.getTime() + 86_400_000);
    const [todayAppointments, pendingReferrals, completedAppointments, highRisk] =
      await Promise.all([
        this.db.appointment.count({
          where: { doctorId, scheduledAt: { gte: today, lt: tomorrow } },
        }),
        this.db.referral.count({
          where: {
            doctorAssignments: { some: { doctorId } },
            status: { in: [ReferralStatus.ASSIGNED, ReferralStatus.IN_PROGRESS] },
          },
        }),
        this.db.appointment.count({
          where: { doctorId, status: AppointmentStatus.COMPLETED },
        }),
        this.db.prediction.findMany({
          where: {
            riskLevel: RiskLevel.HIGH,
            assessment: {
              patient: {
                OR: [
                  { appointments: { some: { doctorId } } },
                  {
                    referrals: {
                      some: { doctorAssignments: { some: { doctorId } } },
                    },
                  },
                ],
              },
            },
          },
          select: { assessment: { select: { patientId: true } } },
        }),
      ]);
    return {
      todayAppointments,
      pendingReferrals,
      completedAppointments,
      highRiskPatients: new Set(highRisk.map((item) => item.assessment.patientId)).size,
    };
  }

  public async patients(
    doctorId: string,
    where: Prisma.PatientWhereInput,
    skip: number,
    take: number,
  ) {
    const scope: Prisma.PatientWhereInput = {
      OR: [
        { appointments: { some: { doctorId } } },
        { referrals: { some: { doctorAssignments: { some: { doctorId } } } } },
      ],
    };
    const combined = { AND: [scope, where] } satisfies Prisma.PatientWhereInput;
    return Promise.all([
      this.db.patient.findMany({
        where: combined,
        include: {
          village: true,
          assessments: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: { predictions: { orderBy: { probability: "desc" }, take: 1 } },
          },
          referrals: {
            where: { doctorAssignments: { some: { doctorId } } },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          appointments: { where: { doctorId }, orderBy: { scheduledAt: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
      this.db.patient.count({ where: combined }),
    ]);
  }

  public patient(doctorId: string, patientId: string) {
    return this.db.patient.findFirst({
      where: {
        id: patientId,
        OR: [
          { appointments: { some: { doctorId } } },
          { referrals: { some: { doctorAssignments: { some: { doctorId } } } } },
        ],
      },
      include: {
        village: true,
        assessments: {
          orderBy: { createdAt: "desc" },
          include: { predictions: { include: { reasons: true, modelVersion: true } } },
        },
        referrals: {
          where: { doctorAssignments: { some: { doctorId } } },
          include: { prediction: true, doctorAssignments: true },
          orderBy: { createdAt: "desc" },
        },
        appointments: { where: { doctorId }, orderBy: { scheduledAt: "desc" } },
      },
    });
  }
}
