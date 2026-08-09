import type { HealthCheckRepository } from "./repository.js";

export interface DependencyFailure {
  field: string;
  message: string;
}

export type ReadinessResult =
  | { ready: true; dependencies: { database: "UP" } }
  | { ready: false; details: DependencyFailure[] };

export class HealthService {
  public constructor(private readonly repository: HealthCheckRepository) {}

  public live() {
    return { status: "UP" as const };
  }

  public health() {
    return {
      status: "UP" as const,
      service: "healthcare-backend",
      version: process.env.npm_package_version ?? "1.0.0",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  public async ready(): Promise<ReadinessResult> {
    try {
      await this.repository.checkDatabase();
      return { ready: true, dependencies: { database: "UP" } };
    } catch {
      return {
        ready: false,
        details: [{ field: "database", message: "Database is unavailable." }],
      };
    }
  }
}
