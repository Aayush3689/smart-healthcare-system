import assert from "node:assert/strict";
import test from "node:test";
import { createAppointmentValidation } from "../../modules/appointments/validation.js";
import { createAssessmentValidation } from "../../modules/assessments/validation.js";
import { createDoctorValidation } from "../../modules/doctors/validation.js";
import { createPatientValidation } from "../../modules/patients/validation.js";
import { createReferralValidation } from "../../modules/referrals/validation.js";

const uuid = "11111111-1111-4111-8111-111111111111";
test("doctor creation normalizes email and rejects unknown fields", () => {
  assert.equal(
    createDoctorValidation.parse({
      email: " DR@EXAMPLE.COM ",
      fullName: "Dr Rao",
      specialization: "General Medicine",
    }).email,
    "dr@example.com",
  );
  assert.equal(
    createDoctorValidation.safeParse({
      email: "dr@example.com",
      fullName: "Dr Rao",
      specialization: "General Medicine",
      status: "ACTIVE",
    }).success,
    false,
  );
});
test("patient validation preserves offline UUID and parses dates", () => {
  const value = createPatientValidation.parse({
    id: uuid,
    fullName: "Rahul Das",
    dateOfBirth: "1970-05-10",
    gender: "MALE",
    villageId: uuid,
    clientCreatedAt: new Date().toISOString(),
  });
  assert.equal(value.id, uuid);
  assert.ok(value.dateOfBirth instanceof Date);
});
test("assessment validation constrains clinical ranges", () => {
  assert.equal(
    createAssessmentValidation.safeParse({
      patientId: uuid,
      age: 56,
      oxygenSaturation: 101,
      clientCreatedAt: new Date(),
    }).success,
    false,
  );
});
test("referral requires linked clinical context", () => {
  assert.equal(
    createReferralValidation.safeParse({
      patientId: uuid,
      assessmentId: uuid,
      predictionId: uuid,
      phcId: uuid,
      reason: "High risk",
    }).success,
    true,
  );
});
test("appointments must be scheduled in the future", () => {
  assert.equal(
    createAppointmentValidation.safeParse({
      patientId: uuid,
      phcId: uuid,
      doctorId: uuid,
      scheduledAt: new Date(0),
    }).success,
    false,
  );
});
