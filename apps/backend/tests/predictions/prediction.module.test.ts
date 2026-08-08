import assert from "node:assert/strict";
import test from "node:test";
import { Disease, RiskLevel } from "@prisma/client";
import { PredictionService } from "../../modules/predictions/service.js";
import {
  bulkPredictionValidation,
  createPredictionValidation,
  patientPredictionQueryValidation,
} from "../../modules/predictions/validation.js";

const predictionId = "33333333-3333-4333-8333-333333333333";
const assessmentId = "22222222-2222-4222-8222-222222222222";

const input = {
  id: predictionId,
  assessmentId,
  disease: Disease.DIABETES,
  prediction: true,
  probability: 0.91,
  riskLevel: RiskLevel.HIGH,
  triage: "REFER_TO_PHC",
  reasons: [{ feature: "glucose", value: 205, message: "Blood sugar is elevated." }],
  modelVersion: "diabetes-v1.0",
  predictionGeneratedAt: new Date("2026-08-08T10:30:00Z"),
  deviceId: "device-123",
};

const stored = {
  ...input,
  modelVersionId: "model-1",
  generatedAt: input.predictionGeneratedAt,
  assessment: {
    patientId: "patient-1",
    patient: {
      id: "patient-1",
      fullName: "Rahul Das",
      dateOfBirth: new Date("1970-01-01"),
      village: { phcId: "phc-1" },
    },
    conductedBy: { id: "asha-1", fullName: "Sita Devi" },
  },
  reasons: [
    {
      id: "reason-1",
      predictionId,
      reason: "Blood sugar is elevated.",
      feature: "glucose",
      value: 205,
      message: "Blood sugar is elevated.",
    },
  ],
  modelVersion: { id: "model-1", version: "diabetes-v1.0" },
};

test("prediction validation accepts structured offline model output", () => {
  const result = createPredictionValidation.parse({
    ...input,
    predictionGeneratedAt: "2026-08-08T10:30:00Z",
  });
  assert.equal(result.probability, 0.91);
  assert.equal(result.reasons[0]?.feature, "glucose");
  assert.equal(createPredictionValidation.safeParse({ ...input, probability: 1.2 }).success, false);
});

test("bulk validation rejects duplicate IDs and assessment-disease pairs", () => {
  assert.equal(bulkPredictionValidation.safeParse({ predictions: [input, input] }).success, false);
  assert.deepEqual(patientPredictionQueryValidation.parse({}), { page: 1, limit: 20 });
});

test("ASHA cannot upload a prediction for another worker's assessment", async () => {
  const service = new PredictionService(
    { assessment: async () => ({ id: assessmentId, conductedById: "asha-2" }) } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
  );
  await assert.rejects(
    () => service.create("user-1", input),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "RESOURCE_NOT_FOUND",
  );
});

test("retrying the same mobile prediction ID is idempotent", async () => {
  let created = false;
  const service = new PredictionService(
    {
      assessment: async () => ({ id: assessmentId, conductedById: "asha-1" }),
      findById: async () => stored,
      create: async () => {
        created = true;
      },
    } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
  );
  const result = await service.create("user-1", input);
  assert.equal(result.alreadyExists, true);
  assert.equal(result.prediction.id, predictionId);
  assert.equal(created, false);
});

test("a second ID cannot replace an assessment-disease prediction", async () => {
  const service = new PredictionService(
    {
      assessment: async () => ({ id: assessmentId, conductedById: "asha-1" }),
      findById: async () => null,
      findByAssessmentDisease: async () => stored,
    } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
  );
  await assert.rejects(
    () => service.create("user-1", { ...input, id: "44444444-4444-4444-8444-444444444444" }),
    /already exists/,
  );
});

test("assessment completion requires all three disease predictions", async () => {
  const service = new PredictionService(
    { assessmentDiseases: async () => [{ disease: Disease.DIABETES }] } as never,
    {} as never,
  );
  await assert.rejects(
    () => service.requireComplete(assessmentId),
    (error: unknown) =>
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "INCOMPLETE_PREDICTIONS",
  );
});

test("assessment completion succeeds when every disease result is uploaded", async () => {
  const service = new PredictionService(
    {
      assessmentDiseases: async () => Object.values(Disease).map((disease) => ({ disease })),
    } as never,
    {} as never,
  );
  await service.requireComplete(assessmentId);
});
