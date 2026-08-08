import assert from "node:assert/strict";
import test from "node:test";
import { PhcService } from "../../modules/phcs/service.js";
import { statisticsQueryValidation, updatePhcValidation } from "../../modules/phcs/validation.js";

const phcId = "44444444-4444-4444-8444-444444444444";
const villageId = "33333333-3333-4333-8333-333333333333";

test("PHC update validation rejects code and status changes", () => {
  assert.equal(
    updatePhcValidation.safeParse({ name: "Village Primary Health Centre" }).success,
    true,
  );
  assert.equal(updatePhcValidation.safeParse({ code: "PHC-999" }).success, false);
  assert.equal(updatePhcValidation.safeParse({ status: "INACTIVE" }).success, false);
});

test("PHC statistics validation rejects invalid date ranges and unknown filters", () => {
  assert.equal(
    statisticsQueryValidation.safeParse({
      from: "2026-08-10T00:00:00.000Z",
      to: "2026-08-01T00:00:00.000Z",
    }).success,
    false,
  );
  assert.equal(statisticsQueryValidation.safeParse({ phcId }).success, false);
});

test("PHC profile is always derived from authenticated admin", async () => {
  let requestedId: string | undefined;
  const service = new PhcService(
    {
      find: async (id: string) => {
        requestedId = id;
        return { id, name: "Village PHC" };
      },
    } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  await service.me("admin-user");
  assert.equal(requestedId, phcId);
});

test("PHC admin cannot access a village from another PHC", async () => {
  const service = new PhcService(
    { village: async () => null } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  await assert.rejects(() => service.village("admin-user", villageId), /Village not found/);
});

test("cross-PHC village analytics are rejected before aggregation", async () => {
  let aggregated = false;
  const service = new PhcService(
    {
      village: async () => null,
      statistics: async () => {
        aggregated = true;
      },
    } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  await assert.rejects(() => service.statistics("admin-user", { villageId }), /Village not found/);
  assert.equal(aggregated, false);
});

test("PHC worker listing is scoped through villages", async () => {
  let requestedId: string | undefined;
  const service = new PhcService(
    {
      ashaWorkers: async (id: string) => {
        requestedId = id;
        return [];
      },
    } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  const result = await service.ashaWorkers("admin-user");
  assert.equal(requestedId, phcId);
  assert.deepEqual(result, { items: [] });
});
