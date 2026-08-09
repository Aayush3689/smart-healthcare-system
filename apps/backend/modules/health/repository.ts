import type { PrismaClient } from "@prisma/client";

export interface HealthCheckRepository {
  checkDatabase(): Promise<void>;
}

export class HealthRepository implements HealthCheckRepository {
  public constructor(private readonly db: PrismaClient) {}

  public async checkDatabase(): Promise<void> {
    await this.db.$queryRaw`SELECT 1`;
  }
}
