import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "express";
import { HealthController } from "../../modules/health/controller.js";
import type { HealthCheckRepository } from "../../modules/health/repository.js";
import { HealthService } from "../../modules/health/service.js";

class RepositoryStub implements HealthCheckRepository {
  public checks = 0;
  public failure?: Error;

  public async checkDatabase(): Promise<void> {
    this.checks++;
    if (this.failure) throw this.failure;
  }
}

function responseStub() {
  const result: { statusCode?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      result.statusCode = code;
      return response;
    },
    json(body: unknown) {
      result.body = body;
      return response;
    },
  } as unknown as Response;
  return { response, result };
}

test("liveness is lightweight and does not query the database", () => {
  const repository = new RepositoryStub();
  const service = new HealthService(repository);

  assert.deepEqual(service.live(), { status: "UP" });
  assert.equal(repository.checks, 0);
});

test("readiness reports an available database", async () => {
  const repository = new RepositoryStub();
  const service = new HealthService(repository);

  assert.deepEqual(await service.ready(), {
    ready: true,
    dependencies: { database: "UP" },
  });
  assert.equal(repository.checks, 1);
});

test("readiness returns the public 503 error contract when the database is unavailable", async () => {
  const repository = new RepositoryStub();
  repository.failure = new Error("connection refused");
  const controller = new HealthController(new HealthService(repository));
  const { response, result } = responseStub();

  await controller.ready({} as never, response);

  assert.equal(result.statusCode, 503);
  assert.deepEqual(result.body, {
    success: false,
    message: "Service is not ready.",
    error: {
      code: "SERVICE_NOT_READY",
      details: [{ field: "database", message: "Database is unavailable." }],
    },
  });
});

test("general health does not query the database", () => {
  const repository = new RepositoryStub();
  const health = new HealthService(repository).health();

  assert.equal(health.status, "UP");
  assert.equal(health.service, "healthcare-backend");
  assert.equal(health.version, "1.0.0");
  assert.equal(typeof health.uptime, "number");
  assert.ok(!Number.isNaN(Date.parse(health.timestamp)));
  assert.equal(repository.checks, 0);
});
