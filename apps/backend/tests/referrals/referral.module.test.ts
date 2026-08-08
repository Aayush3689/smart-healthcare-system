import assert from "node:assert/strict";
import test from "node:test";
import { ReferralPriority, ReferralStatus, RiskLevel, Role, UserStatus } from "@prisma/client";
import { ReferralService } from "../../modules/referrals/service.js";
import {
  createReferralValidation,
  referralListQueryValidation,
} from "../../modules/referrals/validation.js";

const patientId = "11111111-1111-4111-8111-111111111111";
const assessmentId = "22222222-2222-4222-8222-222222222222";
const predictionId = "33333333-3333-4333-8333-333333333333";
const phcId = "44444444-4444-4444-8444-444444444444";
const referralId = "55555555-5555-4555-8555-555555555555";

const createInput = {
  patientId,
  assessmentId,
  predictionId,
  phcId,
  reason: "AI detected high diabetes risk.",
  notes: "Patient advised to visit PHC.",
};

const referral = {
  id: referralId,
  patientId,
  assessmentId,
  predictionId,
  createdById: "asha-user",
  recommendedPhcId: phcId,
  assignedPhcId: null,
  recommendedSpecialization: null,
  priority: ReferralPriority.HIGH,
  reason: createInput.reason,
  status: ReferralStatus.PENDING,
  referredAt: new Date(),
  acceptedAt: null,
  completedAt: null,
  notes: createInput.notes,
  createdAt: new Date(),
  updatedAt: new Date(),
  patient: {
    id: patientId,
    fullName: "Rahul Das",
    dateOfBirth: new Date("1970-01-01"),
    village: { id: "village-1", phcId },
  },
  assessment: { id: assessmentId, predictions: [] },
  prediction: {
    id: predictionId,
    disease: "DIABETES",
    probability: 0.91,
    riskLevel: RiskLevel.HIGH,
    triage: "REFER_TO_PHC",
    reasons: [],
    modelVersion: { version: "v1" },
  },
  recommendedPhc: { id: phcId, name: "Village PHC" },
  assignedPhc: null,
  createdBy: { id: "asha-user", email: "asha@example.com" },
  doctorAssignments: [],
};

test("referral validation requires linked patient, assessment, prediction, and PHC", () => {
  assert.equal(createReferralValidation.safeParse(createInput).success, true);
  assert.equal(
    createReferralValidation.safeParse({ ...createInput, predictionId: undefined }).success,
    false,
  );
  assert.deepEqual(referralListQueryValidation.parse({}), { page: 1, limit: 20 });
});

test("ASHA cannot refer a patient outside their scope", async () => {
  const service = new ReferralService(
    {
      context: async () => [
        { id: patientId, registeredById: "asha-2", village: { phcId } },
        { id: assessmentId, patientId },
        { id: predictionId, assessmentId },
        { id: phcId },
        null,
      ],
    } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
  );
  await assert.rejects(
    () => service.create("asha-user", createInput),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "RESOURCE_NOT_FOUND",
  );
});

test("referral priority is derived from prediction risk", async () => {
  let storedPriority: ReferralPriority | undefined;
  const service = new ReferralService(
    {
      context: async () => [
        { id: patientId, registeredById: "asha-1", village: { phcId } },
        { id: assessmentId, patientId },
        {
          id: predictionId,
          assessmentId,
          prediction: true,
          riskLevel: RiskLevel.HIGH,
          triage: "REFER_TO_PHC",
        },
        { id: phcId },
        null,
      ],
      create: async (_input: unknown, priority: ReferralPriority) => {
        storedPriority = priority;
        return referral;
      },
    } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
  );
  await service.create("asha-user", createInput);
  assert.equal(storedPriority, ReferralPriority.HIGH);
});

test("duplicate referrals for one prediction are rejected", async () => {
  const service = new ReferralService(
    {
      context: async () => [
        { id: patientId, registeredById: "asha-1", village: { phcId } },
        { id: assessmentId, patientId },
        {
          id: predictionId,
          assessmentId,
          prediction: true,
          riskLevel: RiskLevel.HIGH,
          triage: "REFER_TO_PHC",
        },
        { id: phcId },
        { id: referralId },
      ],
    } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
  );
  await assert.rejects(() => service.create("asha-user", createInput), /already exists/);
});

test("PHC cannot assign a doctor before accepting a referral", async () => {
  const service = new ReferralService(
    { find: async () => referral } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  await assert.rejects(
    () => service.assignDoctor("admin-user", referralId, { doctorId: "doctor-1" }),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "INVALID_REFERRAL_TRANSITION",
  );
});

test("doctor assignment requires an active doctor in the referral PHC", async () => {
  const accepted = { ...referral, status: ReferralStatus.ACCEPTED };
  const service = new ReferralService(
    {
      find: async () => accepted,
      doctor: async () => ({ phcId: "another-phc", user: { status: UserStatus.ACTIVE } }),
    } as never,
    { requireAdminPhc: async () => ({ phcId }) } as never,
  );
  await assert.rejects(
    () => service.assignDoctor("admin-user", referralId, { doctorId: "doctor-1" }),
    /does not belong to this PHC/,
  );
});

test("ASHA cannot cancel a referral after processing starts", async () => {
  const service = new ReferralService(
    { find: async () => ({ ...referral, status: ReferralStatus.IN_PROGRESS }) } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
  );
  await assert.rejects(
    () => service.cancel("asha-user", Role.ASHA_WORKER, referralId, "No longer required"),
    /cannot be/,
  );
});
