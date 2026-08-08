import { SyncStatus, type Prisma, type PrismaClient, type SyncOperationType } from "@prisma/client";
import type { SyncEntity } from "./validation.js";

export type PullCursor = { updatedAt: Date; entity: string; id: string };

export class SyncRepository {
  public constructor(private readonly db: PrismaClient) {}

  public find(userId: string, changeId: string) {
    return this.db.syncOperation.findUnique({
      where: { userId_operationId: { userId, operationId: changeId } },
    });
  }

  public reserve(input: {
    userId: string;
    changeId: string;
    deviceId: string;
    entity: SyncEntity;
    entityId: string;
    operation: SyncOperationType;
    clientCreatedAt: Date;
    data: Prisma.InputJsonValue;
  }) {
    return this.db.syncOperation.create({
      data: {
        userId: input.userId,
        operationId: input.changeId,
        deviceId: input.deviceId,
        entityType: input.entity,
        entityId: input.entityId,
        operation: input.operation,
        clientCreatedAt: input.clientCreatedAt,
        payload: input.data,
        status: SyncStatus.PENDING,
      },
    });
  }

  public finish(
    id: string,
    status: SyncStatus,
    result?: Prisma.InputJsonValue,
    errorCode?: string,
    errorMessage?: string,
  ) {
    return this.db.syncOperation.update({
      where: { id },
      data: { status, result, errorCode, errorMessage, processedAt: new Date() },
    });
  }

  public retryable(userId: string, changeIds: string[]) {
    return this.db.syncOperation.findMany({
      where: {
        userId,
        operationId: { in: changeIds },
        status: { in: [SyncStatus.FAILED, SyncStatus.CONFLICT] },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  public markPending(id: string) {
    return this.db.syncOperation.update({
      where: { id },
      data: {
        status: SyncStatus.PENDING,
        retryCount: { increment: 1 },
        errorCode: null,
        errorMessage: null,
        processedAt: null,
      },
    });
  }

  public async status(userId: string) {
    const [groups, latest] = await Promise.all([
      this.db.syncOperation.groupBy({ by: ["status"], where: { userId }, _count: true }),
      this.db.syncOperation.aggregate({
        where: { userId, status: SyncStatus.SYNCED },
        _max: { processedAt: true },
      }),
    ]);
    return { groups, lastSyncedAt: latest._max.processedAt };
  }

  public async pull(ashaId: string, cursor: PullCursor | undefined, take: number) {
    const order = [{ updatedAt: "asc" as const }, { id: "asc" as const }];
    const [patients, assessments, predictions, followUps, appointments, referrals] =
      await Promise.all([
        this.db.patient.findMany({
          where: { registeredById: ashaId, ...this.after(cursor, "PATIENT", "updatedAt") },
          orderBy: order,
          take,
        }),
        this.db.assessment.findMany({
          where: { conductedById: ashaId, ...this.after(cursor, "ASSESSMENT", "updatedAt") },
          orderBy: order,
          take,
        }),
        this.db.prediction.findMany({
          where: {
            assessment: { conductedById: ashaId },
            ...this.after(cursor, "PREDICTION", "generatedAt"),
          },
          include: { reasons: true },
          orderBy: [{ generatedAt: "asc" }, { id: "asc" }],
          take,
        }),
        this.db.followUp.findMany({
          where: { assignedToId: ashaId, ...this.after(cursor, "FOLLOW_UP", "updatedAt") },
          orderBy: order,
          take,
        }),
        this.db.appointment.findMany({
          where: {
            patient: { registeredById: ashaId },
            ...this.after(cursor, "APPOINTMENT", "updatedAt"),
          },
          orderBy: order,
          take,
        }),
        this.db.referral.findMany({
          where: {
            patient: { registeredById: ashaId },
            ...this.after(cursor, "REFERRAL", "updatedAt"),
          },
          orderBy: order,
          take,
        }),
      ]);
    return {
      patients,
      assessments,
      predictions: predictions.map((prediction) => ({
        ...prediction,
        updatedAt: prediction.generatedAt,
      })),
      followUps,
      appointments,
      referrals,
    };
  }

  private after(
    cursor: PullCursor | undefined,
    entity: string,
    field: "updatedAt" | "generatedAt",
  ) {
    if (!cursor) return {};
    const later = { [field]: { gt: cursor.updatedAt } };
    if (entity > cursor.entity) return { OR: [later, { [field]: cursor.updatedAt }] };
    if (entity === cursor.entity) {
      return { OR: [later, { [field]: cursor.updatedAt, id: { gt: cursor.id } }] };
    }
    return later;
  }
}
