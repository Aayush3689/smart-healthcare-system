import assert from "node:assert/strict";
import test from "node:test";
import { ClinicalNoteStatus, FollowUpStatus, Role } from "@prisma/client";
import { FollowUpService } from "../../modules/follow-ups/service.js";
import {
  completeFollowUpValidation,
  createFollowUpValidation,
} from "../../modules/follow-ups/validation.js";

const patientId = "11111111-1111-4111-8111-111111111111";
const noteId = "88888888-8888-4888-8888-888888888888";
const appointmentId = "77777777-7777-4777-8777-777777777777";
const followUpId = "99999999-9999-4999-8999-999999999999";
const assessmentId = "22222222-2222-4222-8222-222222222222";
const doctorId = "66666666-6666-4666-8666-666666666666";

const input = {
  patientId,
  clinicalNoteId: noteId,
  appointmentId,
  scheduledFor: new Date(Date.now() + 86_400_000),
  reason: "Review treatment response.",
  priority: "HIGH" as const,
};

test("follow-up validation requires future scheduling and linked assessment completion", () => {
  assert.equal(createFollowUpValidation.safeParse(input).success, true);
  assert.equal(
    createFollowUpValidation.safeParse({ ...input, ashaWorkerId: "asha-1" }).success,
    false,
  );
  assert.equal(
    completeFollowUpValidation.safeParse({
      visited: true,
      notes: "Patient is improving.",
      assessmentId,
    }).success,
    true,
  );
  assert.equal(
    completeFollowUpValidation.safeParse({ visited: true, notes: "No assessment" }).success,
    false,
  );
});

test("doctor cannot create follow-up when clinical note does not recommend it", async () => {
  const service = new FollowUpService(
    {
      clinicalContext: async () => ({
        id: noteId,
        patientId,
        appointmentId,
        doctorId,
        status: ClinicalNoteStatus.FINAL,
        followUpRequired: false,
        patient: {
          registeredBy: { id: "asha-1" },
          village: { phcId: "phc-1" },
        },
      }),
    } as never,
    { requireDoctor: async () => ({ id: doctorId }) } as never,
  );
  await assert.rejects(
    () => service.create("doctor-user", Role.DOCTOR, input),
    /does not recommend/,
  );
});

test("ASHA can start only their scheduled follow-up", async () => {
  const service = new FollowUpService(
    { find: async () => ({ status: FollowUpStatus.PENDING }) } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
  );
  await assert.rejects(() => service.start("asha-user", followUpId), /Cannot start/);
});

test("follow-up completion requires a completed owned assessment", async () => {
  const service = new FollowUpService(
    {
      find: async () => ({ status: FollowUpStatus.IN_PROGRESS, patientId }),
      assessment: async () => ({ id: assessmentId, followUpId: null, completedAt: null }),
    } as never,
    { requireAsha: async () => ({ id: "asha-1" }) } as never,
  );
  await assert.rejects(
    () =>
      service.complete("asha-user", followUpId, {
        visited: true,
        notes: "Patient visited.",
        assessmentId,
      }),
    /completed assessment/,
  );
});

test("doctor cannot reschedule a completed follow-up", async () => {
  const service = new FollowUpService(
    { find: async () => ({ status: FollowUpStatus.COMPLETED }) } as never,
    { requireDoctor: async () => ({ id: doctorId }) } as never,
  );
  await assert.rejects(
    () =>
      service.reschedule("doctor-user", Role.DOCTOR, followUpId, {
        scheduledFor: new Date(Date.now() + 172_800_000),
        reason: "Patient requested another date.",
      }),
    /Cannot reschedule/,
  );
});

test("PHC follow-up scope is derived from the authenticated admin", async () => {
  let where: unknown;
  const service = new FollowUpService(
    {
      list: async (filter: unknown) => {
        where = filter;
        return [[], 0];
      },
    } as never,
    { requireAdminPhc: async () => ({ phcId: "phc-1" }) } as never,
  );
  await service.phcList("admin-user", { page: 1, limit: 20 });
  assert.match(JSON.stringify(where), /phc-1/);
});
