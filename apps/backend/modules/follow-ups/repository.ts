import { FollowUpStatus, NotificationType, type Prisma, type PrismaClient } from "@prisma/client";
import type { CreateFollowUpInput } from "./validation.js";

const include = {
  patient: { include: { village: true } },
  doctor: true,
  assignedTo: true,
  appointment: true,
  clinicalNote: true,
  assessments: {
    orderBy: { createdAt: "desc" },
    include: { predictions: { include: { reasons: true } } },
  },
} satisfies Prisma.FollowUpInclude;

export type FollowUpDetail = Prisma.FollowUpGetPayload<{ include: typeof include }>;

export class FollowUpRepository {
  public constructor(private readonly db: PrismaClient) {}

  public clinicalContext(noteId: string) {
    return this.db.clinicalNote.findUnique({
      where: { id: noteId },
      include: {
        patient: { include: { registeredBy: { include: { user: true } }, village: true } },
        appointment: true,
      },
    });
  }

  public create(input: CreateFollowUpInput, doctorId: string, ashaId: string, userId: string) {
    return this.db.$transaction(async (tx) => {
      const followUp = await tx.followUp.create({
        data: {
          patientId: input.patientId,
          clinicalNoteId: input.clinicalNoteId,
          appointmentId: input.appointmentId,
          doctorId,
          assignedToId: ashaId,
          scheduledDate: input.scheduledFor,
          reason: input.reason,
          priority: input.priority,
          status: FollowUpStatus.SCHEDULED,
        },
        include,
      });
      await tx.followUpHistory.createMany({
        data: [
          { followUpId: followUp.id, status: FollowUpStatus.PENDING, changedById: userId },
          {
            followUpId: followUp.id,
            status: FollowUpStatus.SCHEDULED,
            changedById: userId,
            scheduledAt: input.scheduledFor,
          },
        ],
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: "FOLLOW_UP_CREATED",
          entityType: "FOLLOW_UP",
          entityId: followUp.id,
        },
      });
      await tx.notification.create({
        data: {
          userId: followUp.assignedTo.userId,
          type: NotificationType.FOLLOW_UP_REMINDER,
          title: "New follow-up assigned",
          message: `A follow-up was scheduled for ${followUp.patient.fullName}.`,
          referenceType: "FOLLOW_UP",
          referenceId: followUp.id,
        },
      });
      return followUp;
    });
  }

  public find(id: string, scope: Prisma.FollowUpWhereInput) {
    return this.db.followUp.findFirst({ where: { id, ...scope }, include });
  }

  public async list(where: Prisma.FollowUpWhereInput, skip: number, take: number) {
    return Promise.all([
      this.db.followUp.findMany({
        where,
        include,
        orderBy: { scheduledDate: "asc" },
        skip,
        take,
      }),
      this.db.followUp.count({ where }),
    ]);
  }

  public history(id: string) {
    return this.db.followUpHistory.findMany({
      where: { followUpId: id },
      include: { changedBy: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  public assessment(id: string, patientId: string, ashaId: string) {
    return this.db.assessment.findFirst({
      where: { id, patientId, conductedById: ashaId },
      select: { id: true, followUpId: true, completedAt: true },
    });
  }

  public transition(
    id: string,
    status: FollowUpStatus,
    userId: string,
    data: { reason?: string; visited?: boolean; assessmentId?: string } = {},
  ) {
    return this.db.$transaction(async (tx) => {
      if (data.assessmentId) {
        await tx.assessment.update({ where: { id: data.assessmentId }, data: { followUpId: id } });
      }
      const followUp = await tx.followUp.update({
        where: { id },
        data: {
          status,
          notes: data.reason,
          visited: data.visited,
          completedDate: status === FollowUpStatus.COMPLETED ? new Date() : undefined,
        },
        include,
      });
      await tx.followUpHistory.create({
        data: { followUpId: id, status, changedById: userId, reason: data.reason },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: `FOLLOW_UP_${status}`,
          entityType: "FOLLOW_UP",
          entityId: id,
        },
      });
      return followUp;
    });
  }

  public reschedule(id: string, scheduledFor: Date, reason: string, userId: string) {
    return this.db.$transaction(async (tx) => {
      const followUp = await tx.followUp.update({
        where: { id },
        data: { scheduledDate: scheduledFor, status: FollowUpStatus.SCHEDULED },
        include,
      });
      await tx.followUpHistory.create({
        data: {
          followUpId: id,
          status: FollowUpStatus.SCHEDULED,
          changedById: userId,
          reason,
          scheduledAt: scheduledFor,
        },
      });
      return followUp;
    });
  }
}
