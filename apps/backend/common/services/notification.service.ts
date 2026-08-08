import { NotificationType, type Prisma, type PrismaClient } from "@prisma/client";

type Database = PrismaClient | Prisma.TransactionClient;
export class NotificationService {
  public create(
    database: Database,
    input: {
      userId: string;
      type: NotificationType;
      title: string;
      message: string;
      referenceType?: string;
      referenceId?: string;
    },
  ) {
    return database.notification.create({ data: input });
  }
}
