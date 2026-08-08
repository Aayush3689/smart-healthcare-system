import assert from "node:assert/strict";
import test from "node:test";
import { AppointmentStatus, ClinicalNoteStatus } from "@prisma/client";
import { ClinicalNoteService } from "../../modules/clinical-notes/service.js";
import {
  createClinicalNoteValidation,
  updateClinicalNoteValidation,
} from "../../modules/clinical-notes/validation.js";

const appointmentId = "77777777-7777-4777-8777-777777777777";
const patientId = "11111111-1111-4111-8111-111111111111";
const doctorId = "66666666-6666-4666-8666-666666666666";
const noteId = "88888888-8888-4888-8888-888888888888";

const input = {
  appointmentId,
  patientId,
  observations: "Patient reports increased thirst.",
  clinicalImpression: "Diabetes suspected.",
  diagnosis: "Type 2 diabetes mellitus",
  treatmentPlan: "Lifestyle modification and laboratory evaluation.",
  medications: [
    {
      name: "Metformin",
      dosage: "500 mg",
      frequency: "TWICE_DAILY",
      duration: "30 days",
      route: "ORAL",
    },
  ],
  followUpRequired: true,
  followUpAfterDays: 14,
};

test("clinical note validation accepts structured medication and follow-up data", () => {
  assert.equal(createClinicalNoteValidation.safeParse(input).success, true);
  assert.equal(createClinicalNoteValidation.safeParse({ ...input, doctorId }).success, false);
  assert.equal(
    createClinicalNoteValidation.safeParse({
      ...input,
      followUpRequired: true,
      followUpAfterDays: undefined,
    }).success,
    false,
  );
  assert.equal(updateClinicalNoteValidation.safeParse({}).success, false);
});

test("doctor cannot create a note for another doctor's appointment", async () => {
  const service = new ClinicalNoteService(
    {
      appointment: async () => ({
        patientId,
        doctorId: "another-doctor",
        status: AppointmentStatus.IN_PROGRESS,
        clinicalNotes: [],
      }),
    } as never,
    {
      requireDoctor: async () => ({ id: doctorId }),
      forbidden: () => new Error("Forbidden"),
    } as never,
  );
  await assert.rejects(() => service.create("doctor-user", input), /Forbidden/);
});

test("clinical note requires an appointment in progress", async () => {
  const service = new ClinicalNoteService(
    {
      appointment: async () => ({
        patientId,
        doctorId,
        status: AppointmentStatus.CONFIRMED,
        clinicalNotes: [],
      }),
    } as never,
    { requireDoctor: async () => ({ id: doctorId }) } as never,
  );
  await assert.rejects(() => service.create("doctor-user", input), /only during an appointment/);
});

test("only one clinical note can be created for an appointment", async () => {
  const service = new ClinicalNoteService(
    {
      appointment: async () => ({
        patientId,
        doctorId,
        status: AppointmentStatus.IN_PROGRESS,
        clinicalNotes: [{ id: noteId }],
      }),
    } as never,
    { requireDoctor: async () => ({ id: doctorId }) } as never,
  );
  await assert.rejects(() => service.create("doctor-user", input), /already exists/);
});

test("final clinical notes are immutable", async () => {
  const service = new ClinicalNoteService(
    { find: async () => ({ status: ClinicalNoteStatus.FINAL }) } as never,
    { requireDoctor: async () => ({ id: doctorId }) } as never,
  );
  await assert.rejects(
    () => service.update("doctor-user", noteId, { advice: "Updated advice" }),
    /cannot be modified/,
  );
});

test("incomplete draft cannot be finalized", async () => {
  const service = new ClinicalNoteService(
    {
      find: async () => ({
        status: ClinicalNoteStatus.DRAFT,
        clinicalImpression: "Diabetes suspected",
        diagnosis: null,
        treatmentPlan: null,
      }),
    } as never,
    { requireDoctor: async () => ({ id: doctorId }) } as never,
  );
  await assert.rejects(
    () => service.finalize("doctor-user", noteId),
    /required before finalization/,
  );
});

test("ASHA clinical summary is limited to their registered patient", async () => {
  const service = new ClinicalNoteService(
    { clinicalSummary: async () => null } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
  );
  await assert.rejects(() => service.clinicalSummary("asha-user", patientId), /not found/);
});
