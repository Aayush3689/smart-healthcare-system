import {
  AppointmentStatus,
  NotificationType,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";
import { AppError } from "../../utils/app-error.js";
import type { CreateAppointmentInput } from "./validation.js";

export const appointmentInclude = {
  patient: {
    include: {
      village: true,
      registeredBy: { select: { userId: true } },
      assessments: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { predictions: { include: { reasons: true, modelVersion: true } } },
      },
    },
  },
  doctor: true,
  phc: true,
  referral: { include: { prediction: { include: { reasons: true } } } },
} satisfies Prisma.AppointmentInclude;

export type AppointmentDetail = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

export class AppointmentRepository {
  public constructor(private readonly db: PrismaClient) {}

  public context(referralId: string, patientId: string, doctorId: string) {
    return Promise.all([
      this.db.referral.findUnique({
        where: { id: referralId },
        include: { doctorAssignments: true, appointments: true },
      }),
      this.db.patient.findUnique({
        where: { id: patientId },
        include: { registeredBy: true, village: true },
      }),
      this.db.doctorProfile.findUnique({ where: { id: doctorId }, include: { user: true } }),
    ]);
  }

  public find(id: string, scope?: Prisma.AppointmentWhereInput) {
    return this.db.appointment.findFirst({ where: { id, ...scope }, include: appointmentInclude });
  }

  public async list(where: Prisma.AppointmentWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.appointment.findMany({
        where,
        include: appointmentInclude,
        orderBy: { scheduledAt: "asc" },
        skip,
        take,
      }),
      this.db.appointment.count({ where }),
    ]);
  }

  public create(input: CreateAppointmentInput, phcId: string, userId: string) {
    return this.db.$transaction(async (tx) => {
      await this.ensureAvailable(tx, input.doctorId, input.scheduledAt, input.durationMinutes);
      const appointment = await tx.appointment.create({
        data: { ...input, phcId },
        include: appointmentInclude,
      });
      await tx.appointmentHistory.create({
        data: {
          appointmentId: appointment.id,
          status: AppointmentStatus.SCHEDULED,
          changedById: userId,
          scheduledAt: input.scheduledAt,
        },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "APPOINTMENT_CREATED",
          entityType: "APPOINTMENT",
          entityId: appointment.id,
        },
      });
      await tx.notification.createMany({
        data: [
          {
            userId: appointment.doctor.userId,
            type: NotificationType.APPOINTMENT_SCHEDULED,
            title: "Appointment scheduled",
            message: `An appointment is scheduled for ${appointment.scheduledAt.toISOString()}.`,
            referenceType: "APPOINTMENT",
            referenceId: appointment.id,
          },
          {
            userId: appointment.patient.registeredBy.userId,
            type: NotificationType.APPOINTMENT_SCHEDULED,
            title: "Patient appointment scheduled",
            message: `${appointment.patient.fullName} has a PHC appointment.`,
            referenceType: "APPOINTMENT",
            referenceId: appointment.id,
          },
        ],
      });
      return appointment;
    });
  }

  public transition(id: string, status: AppointmentStatus, userId: string, reason?: string) {
    return this.db.$transaction(async (tx) => {
      const appointment = await tx.appointment.update({
        where: { id },
        data: { status, notes: reason ? { set: reason } : undefined },
        include: appointmentInclude,
      });
      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          status,
          changedById: userId,
          reason,
          scheduledAt: appointment.scheduledAt,
        },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: `APPOINTMENT_${status}`,
          entityType: "APPOINTMENT",
          entityId: id,
        },
      });
      return appointment;
    });
  }

  public reschedule(
    id: string,
    doctorId: string,
    scheduledAt: Date,
    userId: string,
    reason: string,
  ) {
    return this.db.$transaction(async (tx) => {
      const current = await tx.appointment.findUniqueOrThrow({ where: { id } });
      await this.ensureAvailable(tx, doctorId, scheduledAt, current.durationMinutes, id);
      const appointment = await tx.appointment.update({
        where: { id },
        data: { scheduledAt, status: AppointmentStatus.RESCHEDULED },
        include: appointmentInclude,
      });
      await tx.appointmentHistory.create({
        data: {
          appointmentId: id,
          status: AppointmentStatus.RESCHEDULED,
          changedById: userId,
          reason,
          scheduledAt,
        },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "APPOINTMENT_RESCHEDULED",
          entityType: "APPOINTMENT",
          entityId: id,
        },
      });
      return appointment;
    });
  }

  public history(appointmentId: string) {
    return this.db.appointmentHistory.findMany({
      where: { appointmentId },
      include: { changedBy: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  private async ensureAvailable(
    tx: Prisma.TransactionClient,
    doctorId: string,
    scheduledAt: Date,
    durationMinutes: number,
    excludeId?: string,
  ): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${doctorId}))`;
    const appointments = await tx.appointment.findMany({
      where: {
        doctorId,
        id: excludeId ? { not: excludeId } : undefined,
        status: {
          in: [
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.RESCHEDULED,
          ],
        },
      },
      select: { scheduledAt: true, durationMinutes: true },
    });
    const requestedEnd = scheduledAt.getTime() + durationMinutes * 60_000;
    const conflict = appointments.some((appointment) => {
      const existingStart = appointment.scheduledAt.getTime();
      const existingEnd = existingStart + appointment.durationMinutes * 60_000;
      return scheduledAt.getTime() < existingEnd && requestedEnd > existingStart;
    });
    if (conflict) {
      throw new AppError(
        "Appointment conflicts with an existing appointment.",
        409,
        "RESOURCE_CONFLICT",
        [{ field: "scheduledAt", message: "Doctor is already booked during this time." }],
      );
    }
  }
}
