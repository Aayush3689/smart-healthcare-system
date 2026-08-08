import assert from "node:assert/strict";
import test from "node:test";
import {
  patientListValidation,
  updateAshaProfileValidation,
} from "../../modules/asha/validation.js";
import { AshaService } from "../../modules/asha/service.js";

test("ASHA profile validation rejects administrative fields", () => {
  assert.equal(updateAshaProfileValidation.safeParse({ fullName: "Sita Devi" }).success, true);
  assert.equal(
    updateAshaProfileValidation.safeParse({ fullName: "Sita Devi", villageId: "x" }).success,
    false,
  );
});

test("ASHA patient pagination has bounded defaults", () => {
  assert.deepEqual(patientListValidation.parse({}), { page: 1, limit: 20 });
  assert.equal(patientListValidation.safeParse({ limit: 101 }).success, false);
});

test("ASHA cannot read a patient registered by another worker", async () => {
  const profile = {
    id: "asha-1",
    villageId: "v-1",
    user: { status: "ACTIVE" },
    village: { phcId: "p-1" },
  };
  const service = new AshaService(
    { patient: async () => null } as never,
    { requireAsha: async () => profile } as never,
    {} as never,
    {} as never,
    {} as never,
  );
  await assert.rejects(() => service.patient("user-1", "patient-2"), /Patient not found/);
});

test("only pending assigned follow-ups can be completed", async () => {
  const profile = { id: "asha-1", user: { status: "ACTIVE" }, village: {} };
  const service = new AshaService(
    {
      followUp: async () => ({
        id: "f-1",
        status: "COMPLETED",
        doctor: { user: { id: "doctor-user" } },
      }),
    } as never,
    { requireAsha: async () => profile } as never,
    {} as never,
    {} as never,
    {} as never,
  );
  await assert.rejects(() => service.completeFollowUp("user-1", "f-1", "done"), /Only pending/);
});
