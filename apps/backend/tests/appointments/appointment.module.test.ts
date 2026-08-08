import assert from "node:assert/strict";
import test from "node:test";
import { AppointmentStatus, ReferralStatus, Role, UserStatus } from "@prisma/client";
import { AppointmentRepository } from "../../modules/appointments/repository.js";
import { AppointmentService } from "../../modules/appointments/service.js";
import {
  appointmentListQueryValidation,
  createAppointmentValidation,
} from "../../modules/appointments/validation.js";

const patientId = "11111111-1111-4111-8111-111111111111";
const referralId = "55555555-5555-4555-8555-555555555555";
const doctorId = "66666666-6666-4666-8666-666666666666";
const appointmentId = "77777777-7777-4777-8777-777777777777";
const phcId = "44444444-4444-4444-8444-444444444444";
const scheduledAt = new Date(Date.now() + 86_400_000);

const input = {
  patientId,
  referralId,
  doctorId,
  scheduledAt,
  durationMinutes: 30,
  reason: "High diabetes risk assessment",
};

const appointment = {
  id: appointmentId,
  patientId,
  referralId,
  doctorId,
  phcId,
  scheduledAt,
  durationMinutes: 30,
  status: AppointmentStatus.SCHEDULED,
  reason: input.reason,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  patient: {
    id: patientId,
    fullName: "Rahul Das",
    dateOfBirth: new Date("1970-01-01"),
    gender: "MALE",
    village: { id: "village-1", phcId },
    registeredBy: { userId: "asha-user" },
    assessments: [],
  },
  doctor: {
    id: doctorId,
    userId: "doctor-user",
    fullName: "Dr Amit Roy",
    specialization: "General Medicine",
  },
  phc: { id: phcId, name: "Village PHC", address: "Main Road" },
  referral: { id: referralId, priority: "HIGH", prediction: null },
};

test("appointment validation requires a future bounded booking", () => {
  assert.equal(createAppointmentValidation.safeParse(input).success, true);
  assert.equal(
    createAppointmentValidation.safeParse({ ...input, durationMinutes: 0 }).success,
    false,
  );
  assert.deepEqual(appointmentListQueryValidation.parse({}), { page: 1, limit: 20 });
});

test("PHC cannot create an appointment before doctor assignment", async () => {
  const service = new AppointmentService(
    {
      context: async () => [
        {
          id: referralId,
          patientId,
          status: ReferralStatus.ACCEPTED,
          recommendedPhcId: phcId,
          assignedPhcId: phcId,
          doctorAssignments: [],
          appointments: [],
        },
        { id: patientId },
        { id: doctorId },
      ],
    } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  await assert.rejects(
    () => service.create("admin-user", input),
    /only after a doctor is assigned/,
  );
});

test("appointment doctor must be active, assigned, and in the same PHC", async () => {
  const service = new AppointmentService(
    {
      context: async () => [
        {
          id: referralId,
          patientId,
          status: ReferralStatus.ASSIGNED,
          recommendedPhcId: phcId,
          assignedPhcId: phcId,
          doctorAssignments: [{ doctorId }],
          appointments: [],
        },
        { id: patientId },
        {
          id: doctorId,
          phcId: "another-phc",
          user: { status: UserStatus.ACTIVE },
        },
      ],
    } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  await assert.rejects(
    () => service.create("admin-user", input),
    /inactive, belongs to another PHC/,
  );
});

test("one referral cannot have multiple active appointments", async () => {
  const service = new AppointmentService(
    {
      context: async () => [
        {
          id: referralId,
          patientId,
          status: ReferralStatus.ASSIGNED,
          recommendedPhcId: phcId,
          assignedPhcId: phcId,
          doctorAssignments: [{ doctorId }],
          appointments: [{ status: AppointmentStatus.SCHEDULED }],
        },
        { id: patientId },
        { id: doctorId, phcId, user: { status: UserStatus.ACTIVE } },
      ],
    } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  await assert.rejects(() => service.create("admin-user", input), /already exists/);
});

test("doctor cannot start an unconfirmed appointment", async () => {
  const service = new AppointmentService(
    { find: async () => appointment } as never,
    { requireDoctor: async () => ({ id: doctorId }) } as never,
  );
  await assert.rejects(
    () => service.start("doctor-user", appointmentId),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "INVALID_APPOINTMENT_TRANSITION",
  );
});

test("completed appointments cannot be cancelled", async () => {
  const service = new AppointmentService(
    { find: async () => ({ ...appointment, status: AppointmentStatus.COMPLETED }) } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
  );
  await assert.rejects(
    () =>
      service.cancel(
        "asha-user",
        Role.ASHA_WORKER,
        appointmentId,
        "Patient requested cancellation",
      ),
    /Cannot cancel/,
  );
});

test("doctor overlap is rejected inside the booking transaction", async () => {
  let created = false;
  const repository = new AppointmentRepository({
    $transaction: async (callback: (transaction: unknown) => unknown) =>
      callback({
        $executeRaw: async () => 0,
        appointment: {
          findMany: async () => [{ scheduledAt, durationMinutes: 30 }],
          create: async () => {
            created = true;
          },
        },
      }),
  } as never);
  await assert.rejects(
    () =>
      repository.create(
        { ...input, scheduledAt: new Date(scheduledAt.getTime() + 15 * 60_000) },
        phcId,
        "admin-user",
      ),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "RESOURCE_CONFLICT",
  );
  assert.equal(created, false);
});
