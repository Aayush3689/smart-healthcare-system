import { SyncStatus, type Prisma, type PrismaClient, type SyncOperationType } from "@prisma/client";
export class SyncRepository {
  public constructor(private readonly db: PrismaClient) {}
  find(operationId: string) {
    return this.db.syncOperation.findUnique({ where: { operationId } });
  }
  reserve(input: {
    operationId: string;
    deviceId: string;
    entityType: string;
    entityId: string;
    operation: SyncOperationType;
    payload?: Prisma.InputJsonValue;
  }) {
    return this.db.syncOperation.create({ data: { ...input, status: SyncStatus.PENDING } });
  }
  finish(id: string, status: SyncStatus, errorCode?: string, errorMessage?: string) {
    return this.db.syncOperation.update({
      where: { id },
      data: { status, errorCode, errorMessage, processedAt: new Date() },
    });
  }
  async ownedEntityIds(ashaId: string) {
    const [patients, assessments] = await Promise.all([
      this.db.patient.findMany({ where: { registeredById: ashaId }, select: { id: true } }),
      this.db.assessment.findMany({ where: { conductedById: ashaId }, select: { id: true } }),
    ]);
    return [...patients, ...assessments].map((x) => x.id);
  }
  status(deviceId: string, entityIds: string[]) {
    return this.db.syncOperation.groupBy({
      by: ["status"],
      where: { deviceId, entityId: { in: entityIds } },
      _count: true,
    });
  }
  async changes(ashaId: string, cursor: Date, limit: number) {
    const [patients, assessments] = await Promise.all([
      this.db.patient.findMany({
        where: { registeredById: ashaId, updatedAt: { gt: cursor } },
        orderBy: { updatedAt: "asc" },
        take: limit,
      }),
      this.db.assessment.findMany({
        where: { conductedById: ashaId, updatedAt: { gt: cursor } },
        orderBy: { updatedAt: "asc" },
        take: limit,
      }),
    ]);
    return { patients, assessments };
  }
}
