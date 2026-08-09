import {
  AppointmentStatus,
  ClinicalNoteStatus,
  FollowUpStatus,
  ReferralStatus,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";
import type { PatientTimelineItemResponse } from "./dto/patient.dto.js";

const patientInclude = {
  village: { select: { id: true, name: true, phcId: true } },
  registeredBy: { select: { id: true, fullName: true } },
} satisfies Prisma.PatientInclude;

export type PatientDetail = Prisma.PatientGetPayload<{ include: typeof patientInclude }>;

export class PatientRepository {
  public constructor(private readonly db: PrismaClient) {}

  public find(id: string, scope: Prisma.PatientWhereInput = {}) {
    return this.db.patient.findFirst({ where: { id, AND: [scope] }, include: patientInclude });
  }

  public village(id: string) {
    return this.db.village.findUnique({ where: { id } });
  }

  public async list(where: Prisma.PatientWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.patient.findMany({
        where,
        include: patientInclude,
        orderBy: { fullName: "asc" },
        skip,
        take,
      }),
      this.db.patient.count({ where }),
    ]);
  }

  public create(data: Prisma.PatientUncheckedCreateInput, userId: string) {
    return this.db.$transaction(async (tx) => {
      const patient = await tx.patient.create({ data, include: patientInclude });
      await tx.auditLog.create({
        data: {
          userId,
          action: "PATIENT_CREATED",
          entityType: "PATIENT",
          entityId: patient.id,
        },
      });
      return patient;
    });
  }

  public update(id: string, data: Prisma.PatientUncheckedUpdateInput, userId: string) {
    return this.db.$transaction(async (tx) => {
      const patient = await tx.patient.update({ where: { id }, data, include: patientInclude });
      await tx.auditLog.create({
        data: {
          userId,
          action: "PATIENT_UPDATED",
          entityType: "PATIENT",
          entityId: id,
        },
      });
      return patient;
    });
  }

  public summary(id: string, scope: Prisma.PatientWhereInput) {
    return this.db.patient.findFirst({
      where: { id, AND: [scope] },
      include: {
        village: { select: { id: true, name: true } },
        registeredBy: { select: { id: true, fullName: true } },
        assessments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            predictions: { orderBy: { generatedAt: "desc" }, include: { reasons: true } },
          },
        },
        referrals: {
          where: {
            status: {
              in: [
                ReferralStatus.PENDING,
                ReferralStatus.RECEIVED,
                ReferralStatus.ACCEPTED,
                ReferralStatus.ASSIGNED,
                ReferralStatus.IN_PROGRESS,
              ],
            },
          },
          orderBy: { createdAt: "desc" },
        },
        appointments: {
          where: {
            status: {
              in: [
                AppointmentStatus.SCHEDULED,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.RESCHEDULED,
              ],
            },
            scheduledAt: { gte: new Date() },
          },
          orderBy: { scheduledAt: "asc" },
          take: 1,
        },
        followUps: {
          where: {
            status: {
              in: [FollowUpStatus.PENDING, FollowUpStatus.SCHEDULED, FollowUpStatus.IN_PROGRESS],
            },
          },
          orderBy: { scheduledDate: "asc" },
        },
        clinicalNotes: {
          where: { status: ClinicalNoteStatus.FINAL },
          orderBy: { finalizedAt: "desc" },
          take: 1,
          include: { medications: true },
        },
      },
    });
  }

  public async timeline(
    id: string,
    range: { gte?: Date; lte?: Date } | undefined,
  ): Promise<PatientTimelineItemResponse[]> {
    const patient = await this.db.patient.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        assessments: {
          where: { createdAt: range },
          select: {
            id: true,
            createdAt: true,
            predictions: { where: { generatedAt: range }, select: { id: true, generatedAt: true } },
          },
        },
        referrals: { where: { createdAt: range }, select: { id: true, createdAt: true } },
        appointments: { where: { createdAt: range }, select: { id: true, createdAt: true } },
        clinicalNotes: { where: { createdAt: range }, select: { id: true, createdAt: true } },
        followUps: { where: { createdAt: range }, select: { id: true, createdAt: true } },
      },
    });
    if (!patient) return [];

    const registered =
      (!range?.gte || patient.createdAt >= range.gte) &&
      (!range?.lte || patient.createdAt <= range.lte)
        ? [{ type: "PATIENT_REGISTERED" as const, id: patient.id, timestamp: patient.createdAt }]
        : [];
    return [
      ...registered,
      ...patient.assessments.map((item) => ({
        type: "ASSESSMENT" as const,
        id: item.id,
        timestamp: item.createdAt,
      })),
      ...patient.assessments.flatMap((assessment) =>
        assessment.predictions.map((item) => ({
          type: "PREDICTION" as const,
          id: item.id,
          timestamp: item.generatedAt,
        })),
      ),
      ...patient.referrals.map((item) => ({
        type: "REFERRAL" as const,
        id: item.id,
        timestamp: item.createdAt,
      })),
      ...patient.appointments.map((item) => ({
        type: "APPOINTMENT" as const,
        id: item.id,
        timestamp: item.createdAt,
      })),
      ...patient.clinicalNotes.map((item) => ({
        type: "CLINICAL_NOTE" as const,
        id: item.id,
        timestamp: item.createdAt,
      })),
      ...patient.followUps.map((item) => ({
        type: "FOLLOW_UP" as const,
        id: item.id,
        timestamp: item.createdAt,
      })),
    ].sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
  }

  public history(id: string, type: string) {
    if (type === "assessments") {
      return this.db.assessment.findMany({
        where: { patientId: id },
        include: { predictions: { include: { reasons: true, modelVersion: true } } },
        orderBy: { createdAt: "desc" },
      });
    }
    return this.db.prediction.findMany({
      where: { assessment: { patientId: id } },
      include: { reasons: true, modelVersion: true },
      orderBy: { generatedAt: "desc" },
    });
  }
}
