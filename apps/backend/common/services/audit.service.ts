import type { Prisma, PrismaClient } from "@prisma/client";

type Database = PrismaClient | Prisma.TransactionClient;
export interface AuditInput {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: Prisma.InputJsonValue;
  newData?: Prisma.InputJsonValue;
  deviceId?: string;
  ipAddress?: string;
}

export class AuditService {
  public record(database: Database, input: AuditInput) {
    return database.auditLog.create({ data: input });
  }
}
