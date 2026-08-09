import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Role } from "@prisma/client";
import { VillageService } from "../../modules/villages/service.js";
import {
  villageListQueryValidation,
  villagePatientQueryValidation,
} from "../../modules/villages/validation.js";

const villageId = "33333333-3333-4333-8333-333333333333";

test("village list and patient filters use bounded pagination", () => {
  assert.deepEqual(villageListQueryValidation.parse({}), { page: 1, limit: 20 });
  assert.equal(villageListQueryValidation.safeParse({ limit: 101 }).success, false);
  assert.equal(
    villagePatientQueryValidation.safeParse({ riskLevel: "HIGH", page: 1, limit: 20 }).success,
    true,
  );
});

test("PHC village list is scoped to authenticated admin PHC", async () => {
  let where: unknown;
  const service = new VillageService(
    {
      list: async (input: unknown) => {
        where = input;
        return [[], 0];
      },
    } as never,
    { requireAdminPhc: async () => ({ phcId: "phc-1" }) } as never,
  );
  await service.phcVillages("admin-user", { page: 1, limit: 20 });
  assert.match(JSON.stringify(where), /phc-1/);
});

test("PHC admin cannot read another PHC village", async () => {
  const service = new VillageService(
    { find: async () => ({ id: villageId, phcId: "phc-2" }) } as never,
    {
      requireAdminPhc: async () => ({ phcId: "phc-1" }),
      forbidden: () => new Error("Forbidden"),
    } as never,
  );
  await assert.rejects(() => service.get("admin-user", Role.PHC_ADMIN, villageId), /Forbidden/);
});

test("ASHA village is derived from profile rather than request input", async () => {
  let requestedId = "";
  const service = new VillageService(
    {
      find: async (id: string) => {
        requestedId = id;
        return { id, name: "Rampur" };
      },
    } as never,
    { requireAsha: async () => ({ villageId }) } as never,
  );
  await service.myAshaVillage("asha-user");
  assert.equal(requestedId, villageId);
});

test("village routes expose no create, update, or delete operation", async () => {
  const source = await readFile(
    new URL("../../modules/villages/routes.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /villageRoutes\.(post|patch|put|delete)\(/);
  assert.doesNotMatch(source, /phcVillageRoutes\.(post|patch|put|delete)\(/);
  assert.doesNotMatch(source, /ashaVillageRoutes\.(post|patch|put|delete)\(/);
});
