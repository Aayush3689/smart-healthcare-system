import assert from "node:assert/strict";
import test from "node:test";
import { SyncStatus } from "@prisma/client";
import { SyncService } from "../../modules/sync/service.js";
import { syncValidation } from "../../modules/sync/validation.js";

const operation = {
  operationId: "op-1",
  entityType: "PATIENT" as const,
  entityId: "11111111-1111-4111-8111-111111111111",
  operation: "CREATE" as const,
  payload: {},
};
test("sync validation rejects duplicate operation IDs in one batch", () => {
  assert.equal(
    syncValidation.safeParse({ deviceId: "phone-1", operations: [operation, operation] }).success,
    false,
  );
});
test("replayed operation returns prior result without executing domain mutation", async () => {
  let called = false;
  const prior = {
    id: "sync-1",
    ...operation,
    deviceId: "phone-1",
    status: SyncStatus.SYNCED,
    errorCode: null,
    errorMessage: null,
    processedAt: new Date(),
    createdAt: new Date(),
    payload: {},
  };
  const service = new SyncService(
    { find: async () => prior } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
    {
      createPatient: async () => {
        called = true;
      },
    } as never,
  );
  const result = await service.synchronize("user-1", {
    deviceId: "phone-1",
    operations: [operation],
  });
  assert.equal(called, false);
  assert.equal(result.succeeded, 1);
});
test("unsupported delete is persisted as a failed operation", async () => {
  let finished: SyncStatus | undefined;
  const reserved = { id: "sync-1" };
  const service = new SyncService(
    {
      find: async () => null,
      reserve: async () => reserved,
      finish: async (_id: string, status: SyncStatus, _code?: string, message?: string) => {
        finished = status;
        return {
          operationId: "op-1",
          entityId: operation.entityId,
          status,
          errorCode: "SYNC_DELETE_NOT_ALLOWED",
          errorMessage: message ?? null,
        };
      },
    } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
    {} as never,
  );
  const result = await service.synchronize("user-1", {
    deviceId: "phone-1",
    operations: [{ ...operation, operation: "DELETE" }],
  });
  assert.equal(finished, SyncStatus.FAILED);
  assert.equal(result.failed, 1);
});
