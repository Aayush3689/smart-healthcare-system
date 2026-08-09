import assert from "node:assert/strict";
import test from "node:test";
import { UserStatus } from "@prisma/client";
import { DoctorService } from "../../modules/doctors/service.js";
import {
  createDoctorValidation,
  updateAvailabilityValidation,
  updateDoctorValidation,
} from "../../modules/doctors/validation.js";

const doctorId = "66666666-6666-4666-8666-666666666666";
const phcId = "44444444-4444-4444-8444-444444444444";

const doctor = (status = UserStatus.ACTIVE) => ({
  id: doctorId,
  userId: "doctor-user",
  fullName: "Dr Amit Roy",
  specialization: "General Medicine",
  phcId,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { email: "amit@example.com", status },
  phc: { id: phcId, name: "Village PHC", address: "Main Road" },
  availability: null,
});

test("doctor request validation rejects privileged fields", () => {
  assert.equal(
    createDoctorValidation.safeParse({
      email: "AMIT@example.com",
      fullName: "Dr Amit Roy",
      specialization: "General Medicine",
    }).success,
    true,
  );
  assert.equal(updateDoctorValidation.safeParse({ phcId }).success, false);
  assert.equal(
    updateAvailabilityValidation.safeParse({
      schedule: { monday: { available: true, start: "16:00", end: "09:00" } },
    }).success,
    false,
  );
});

test("PHC admin cannot access a doctor from another PHC", async () => {
  const service = new DoctorService(
    { findById: async () => null } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  await assert.rejects(() => service.get("admin-user", doctorId), /Doctor not found/);
});

test("duplicate doctor email is rejected before creation", async () => {
  const service = new DoctorService(
    { userByEmail: async () => ({ id: "existing-user" }) } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  await assert.rejects(
    () =>
      service.create("admin-user", {
        email: "amit@example.com",
        fullName: "Dr Amit Roy",
        specialization: "General Medicine",
      }),
    /already in use/,
  );
});

test("doctor with active care cannot be deactivated", async () => {
  let changed = false;
  const service = new DoctorService(
    {
      findById: async () => doctor(),
      deactivationBlockers: async () => [1, 0],
      updateStatus: async () => {
        changed = true;
      },
    } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  await assert.rejects(() => service.deactivate("admin-user", doctorId), /active appointments/);
  assert.equal(changed, false);
});

test("availability updates merge partial weekday schedules", async () => {
  let saved: unknown;
  const service = new DoctorService(
    {
      availability: async () => ({ schedule: { monday: { available: false } } }),
      updateAvailability: async (_id: string, schedule: unknown) => {
        saved = schedule;
        return { schedule };
      },
    } as never,
    { requireDoctor: async () => ({ id: doctorId }) } as never,
  );
  await service.updateAvailability("doctor-user", {
    schedule: { tuesday: { available: true, start: "09:00", end: "16:00" } },
  });
  assert.deepEqual(saved, {
    monday: { available: false },
    tuesday: { available: true, start: "09:00", end: "16:00" },
  });
});

test("doctor patient detail remains scoped to assigned care", async () => {
  const service = new DoctorService(
    { patient: async () => null } as never,
    { requireDoctor: async () => ({ id: doctorId }) } as never,
  );
  await assert.rejects(
    () => service.patient("doctor-user", "11111111-1111-4111-8111-111111111111"),
    /Patient not found/,
  );
});
