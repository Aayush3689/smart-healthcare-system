import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Role } from "@prisma/client";
import { PatientService } from "../../modules/patients/service.js";
import {
  createPatientValidation,
  patientListQueryValidation,
  updatePatientValidation,
} from "../../modules/patients/validation.js";

const patientId = "11111111-1111-4111-8111-111111111111";
const villageId = "22222222-2222-4222-8222-222222222222";
const otherVillageId = "33333333-3333-4333-8333-333333333333";

test("patient validation accepts age and preserves an offline UUID", () => {
  const patient = createPatientValidation.parse({
    id: patientId,
    fullName: "Rahul Das",
    age: 56,
    gender: "MALE",
    villageId,
    clientCreatedAt: new Date(),
  });
  assert.equal(patient.id, patientId);
  assert.ok(patient.dateOfBirth instanceof Date);
  assert.equal("age" in patient, false);
  assert.deepEqual(patientListQueryValidation.parse({}), { page: 1, limit: 20 });
});

test("patient updates reject ownership and synchronization fields", () => {
  for (const input of [
    { registeredById: "asha-2" },
    { villageId },
    { createdAt: new Date() },
    { syncedAt: new Date() },
  ]) {
    assert.equal(updatePatientValidation.safeParse(input).success, false);
  }
  assert.equal(updatePatientValidation.safeParse({ fullName: "Rahul Kumar Das" }).success, true);
});

test("ASHA can create a patient only in their assigned village", async () => {
  let created = false;
  const service = new PatientService(
    {
      village: async () => ({ id: otherVillageId, isActive: true }),
      create: async () => {
        created = true;
      },
    } as never,
    { requireAsha: async () => ({ id: "asha-1", villageId }) } as never,
  );
  await assert.rejects(
    () =>
      service.create("asha-user", {
        fullName: "Rahul Das",
        dateOfBirth: new Date("1970-01-01"),
        gender: "MALE",
        villageId: otherVillageId,
        clientCreatedAt: new Date(),
      }),
    /assigned village/,
  );
  assert.equal(created, false);
});

test("PHC patient lists are constrained by the authenticated admin PHC", async () => {
  let where: unknown;
  const service = new PatientService(
    {
      list: async (input: unknown) => {
        where = input;
        return [[], 0];
      },
    } as never,
    { requireAdminPhc: async () => ({ phcId: "phc-from-token" }) } as never,
  );
  await service.list("admin-user", Role.PHC_ADMIN, { page: 1, limit: 20 });
  assert.match(JSON.stringify(where), /phc-from-token/);
});

test("doctor patient access is constrained to assigned care", async () => {
  let scope: unknown;
  const service = new PatientService(
    {
      find: async (_id: string, input: unknown) => {
        scope = input;
        return null;
      },
    } as never,
    { requireDoctor: async () => ({ id: "doctor-from-token" }) } as never,
  );
  await assert.rejects(
    () => service.get("doctor-user", Role.DOCTOR, patientId),
    /Patient not found/,
  );
  assert.match(JSON.stringify(scope), /doctor-from-token/);
});

test("patient module exposes exactly the six initial product routes", async () => {
  const source = await readFile(
    new URL("../../modules/patients/routes.ts", import.meta.url),
    "utf8",
  );
  assert.equal((source.match(/patientRoutes\.get\(/g) ?? []).length, 4);
  assert.equal((source.match(/patientRoutes\.post\(/g) ?? []).length, 1);
  assert.equal((source.match(/patientRoutes\.patch\(/g) ?? []).length, 1);
  assert.doesNotMatch(source, /patientRoutes\.(put|delete)\(/);
  assert.match(source, /"\/:patientId\/summary"/);
  assert.match(source, /"\/:patientId\/timeline"/);
});
