import assert from "node:assert/strict";
import test from "node:test";
import { Role } from "@prisma/client";
import { AssessmentService } from "../../modules/assessments/service.js";
import {
  assessmentListQueryValidation,
  createAssessmentValidation,
  updateAssessmentValidation,
} from "../../modules/assessments/validation.js";

const patientId = "11111111-1111-4111-8111-111111111111";
const assessmentId = "22222222-2222-4222-8222-222222222222";

const features = {
  age: 56,
  bmi: 31.8,
  pregnancies: 0,
  glucose: 185,
  diabetesBloodPressure: 110,
  skinThickness: 25,
  insulin: 120,
  diabetesPedigreeFunction: 0.52,
  heartSex: 1,
  chestPainType: 2,
  restingBloodPressure: 170,
  cholesterol: 245,
  fastingBloodSugar: true,
  restingEcg: 1,
  maxHeartRate: 120,
  exerciseInducedAngina: false,
  oldpeak: 2.1,
  stSlope: 1,
  majorVessels: 1,
  thal: 2,
  systolicBp: 170,
  diastolicBp: 110,
  heartRate: 88,
  bpHistory: "Hypertension",
  medication: "BETA_BLOCKER",
  familyHistoryHypertension: true,
  exerciseLevel: "Low",
  smokingStatus: "SMOKER",
} as const;

const draft = {
  id: assessmentId,
  patientId,
  conductedById: "asha-1",
  completedAt: null,
  predictions: [],
  ...features,
};

test("assessment request validation accepts a complete strict payload", () => {
  const result = createAssessmentValidation.safeParse({
    id: assessmentId,
    patientId,
    clientCreatedAt: "2026-08-08T10:40:00Z",
    symptoms: ["dizziness"],
    ...features,
  });
  assert.equal(result.success, true);
  assert.equal(
    createAssessmentValidation.safeParse({
      patientId,
      clientCreatedAt: new Date(),
      age: 56,
      administrativeOverride: true,
    }).success,
    false,
  );
});

test("assessment list query applies bounded pagination and date validation", () => {
  assert.deepEqual(assessmentListQueryValidation.parse({}), { page: 1, limit: 20 });
  assert.equal(assessmentListQueryValidation.safeParse({ limit: 101 }).success, false);
  assert.equal(
    assessmentListQueryValidation.safeParse({ from: "2026-08-09", to: "2026-08-08" }).success,
    false,
  );
  assert.equal(updateAssessmentValidation.safeParse({}).success, false);
});

test("ASHA cannot create an assessment for another worker's patient", async () => {
  const service = new AssessmentService(
    { patient: async () => ({ id: patientId, registeredById: "asha-2" }) } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
    {} as never,
  );
  await assert.rejects(
    () =>
      service.create("user-1", {
        patientId,
        clientCreatedAt: new Date(),
        symptoms: [],
        inputSource: "MANUAL",
        ...features,
      }),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "RESOURCE_NOT_FOUND",
  );
});

test("offline assessment retries return the existing owned assessment", async () => {
  let created = false;
  const service = new AssessmentService(
    {
      patient: async () => ({ id: patientId, registeredById: "asha-1" }),
      find: async () => draft,
      create: async () => {
        created = true;
      },
    } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
    {} as never,
  );
  const result = await service.create("user-1", {
    id: assessmentId,
    patientId,
    clientCreatedAt: new Date(),
    symptoms: [],
    inputSource: "MANUAL",
    ...features,
  });
  assert.equal(result.id, assessmentId);
  assert.equal(created, false);
});

test("completed assessments are immutable", async () => {
  const service = new AssessmentService(
    { find: async () => ({ ...draft, completedAt: new Date() }) } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
    {} as never,
  );
  await assert.rejects(
    () => service.update("user-1", assessmentId, { glucose: 195 }),
    /Completed assessments cannot be modified/,
  );
});

test("completion rejects missing model features before prediction verification", async () => {
  let predictionCalled = false;
  const service = new AssessmentService(
    { find: async () => ({ ...draft, glucose: null }) } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
    { generate: async () => (predictionCalled = true) } as never,
  );
  await assert.rejects(() => service.complete("user-1", assessmentId), /required AI features/);
  assert.equal(predictionCalled, false);
});

test("completion verifies uploaded predictions before finalizing the assessment", async () => {
  const events: string[] = [];
  const service = new AssessmentService(
    {
      find: async () => draft,
      markCompleted: async () => {
        events.push("complete");
        return { ...draft, completedAt: new Date() };
      },
    } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
    {
      requireComplete: async (_id: string) => {
        events.push("verify-predictions");
      },
    } as never,
  );
  const result = await service.complete("user-1", assessmentId);
  assert.deepEqual(events, ["verify-predictions", "complete"]);
  assert.equal(result.status, "COMPLETED");
});

test("doctor assessment access is scoped through assignments and appointments", async () => {
  let receivedScope: unknown;
  const service = new AssessmentService(
    {
      find: async (_id: string, scope: unknown) => {
        receivedScope = scope;
        return draft;
      },
    } as never,
    { requireDoctor: async () => ({ id: "doctor-1" }) } as never,
    {} as never,
  );
  await service.get("doctor-user", Role.DOCTOR, assessmentId);
  assert.match(JSON.stringify(receivedScope), /doctor-1/);
});
