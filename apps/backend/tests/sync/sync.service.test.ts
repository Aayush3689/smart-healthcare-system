import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { SyncOperationType, SyncStatus } from "@prisma/client";
import { SyncService } from "../../modules/sync/service.js";
import { syncPushValidation } from "../../modules/sync/validation.js";

const patientId = "11111111-1111-4111-8111-111111111111";
const change = {
  changeId: "change-1",
  entity: "PATIENT" as const,
  operation: SyncOperationType.CREATE,
  clientCreatedAt: new Date("2026-08-09T08:00:00Z"),
  data: { id: patientId },
};

const service = (repository: object, asha: object = {}) =>
  new SyncService(
    repository as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
    asha as never,
    {} as never,
    {} as never,
  );

test("push validation rejects duplicate change IDs in one batch", () => {
  assert.equal(
    syncPushValidation.safeParse({ deviceId: "phone-1", changes: [change, change] }).success,
    false,
  );
});

test("a replay returns the stored result without executing a domain mutation", async () => {
  let called = false;
  const prior = {
    operationId: change.changeId,
    entityType: change.entity,
    status: SyncStatus.SYNCED,
    errorCode: null,
    errorMessage: null,
  };
  const result = await service(
    { find: async () => prior },
    {
      createPatient: async () => {
        called = true;
      },
    },
  ).push("user-1", { deviceId: "phone-1", changes: [change] });

  assert.equal(called, false);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.failed.length, 0);
});

test("a prohibited delete is persisted and returned as a conflict", async () => {
  let finished: SyncStatus | undefined;
  const result = await service({
    find: async () => null,
    reserve: async () => ({ id: "sync-1" }),
    finish: async (
      _id: string,
      status: SyncStatus,
      _result: unknown,
      errorCode?: string,
      errorMessage?: string,
    ) => {
      finished = status;
      return {
        operationId: change.changeId,
        entityType: change.entity,
        status,
        errorCode: errorCode ?? null,
        errorMessage: errorMessage ?? null,
      };
    },
  }).push("user-1", {
    deviceId: "phone-1",
    changes: [{ ...change, operation: SyncOperationType.DELETE }],
  });

  assert.equal(finished, SyncStatus.CONFLICT);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0]?.errorCode, "SYNC_DELETE_NOT_ALLOWED");
});

test("pull rejects a malformed opaque cursor", async () => {
  await assert.rejects(
    service({}).pull("user-1", { cursor: "not-a-cursor", limit: 20 }),
    (error: Error & { code?: string }) => error.code === "INVALID_SYNC_CURSOR",
  );
});

test("sync exposes only the four locked public routes", async () => {
  const source = await readFile(new URL("../../modules/sync/routes.ts", import.meta.url), "utf8");
  assert.match(source, /router\.post\(\s*"\/push"/);
  assert.match(source, /router\.get\(\s*"\/pull"/);
  assert.match(source, /router\.get\(\s*"\/status"/);
  assert.match(source, /router\.post\(\s*"\/retry"/);
  assert.doesNotMatch(source, /register-device|resolve-conflict|\/ack|\/changes/);
});
