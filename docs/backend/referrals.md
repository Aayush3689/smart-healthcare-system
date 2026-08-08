# Referrals API

Referrals connect high-risk predictions to PHC review and doctor care. The module enforces patient/assessment/prediction relationships, derives priority from AI risk and triage, records every status transition, and restricts each role to its permitted scope.

All endpoints require an active authenticated account and use the common `{ success, message, data }` response envelope.

## State machine

`PENDING → ACCEPTED → ASSIGNED → IN_PROGRESS → COMPLETED`

`PENDING` or `RECEIVED` may become `REJECTED`. ASHA workers may cancel only before PHC processing. PHC administrators may cancel before the referral enters progress. Terminal states cannot transition again.

## Endpoints

| Method | Endpoint                                             | Role            | Purpose                              |
| ------ | ---------------------------------------------------- | --------------- | ------------------------------------ |
| POST   | `/api/v1/referrals`                                  | ASHA            | Create a referral                    |
| GET    | `/api/v1/referrals/:referralId`                      | Scoped          | Get referral details                 |
| GET    | `/api/v1/referrals/:referralId/history`              | Scoped          | Get status history                   |
| PATCH  | `/api/v1/referrals/:referralId/cancel`               | ASHA, PHC admin | Cancel when allowed                  |
| GET    | `/api/v1/asha/me/referrals`                          | ASHA            | List referrals created by the caller |
| GET    | `/api/v1/asha/me/patients/:patientId/referrals`      | ASHA            | List one owned patient's referrals   |
| GET    | `/api/v1/phc/me/referrals`                           | PHC admin       | List the PHC referral queue          |
| GET    | `/api/v1/phc/me/referrals/:referralId`               | PHC admin       | Get a PHC referral                   |
| PATCH  | `/api/v1/phc/me/referrals/:referralId/accept`        | PHC admin       | Accept a pending referral            |
| PATCH  | `/api/v1/phc/me/referrals/:referralId/reject`        | PHC admin       | Reject with a reason                 |
| PATCH  | `/api/v1/phc/me/referrals/:referralId/assign-doctor` | PHC admin       | Assign an active same-PHC doctor     |
| GET    | `/api/v1/doctors/me/referrals`                       | Doctor          | List assigned referrals              |
| GET    | `/api/v1/doctors/me/referrals/:referralId`           | Doctor          | Get an assigned referral             |
| PATCH  | `/api/v1/doctors/me/referrals/:referralId/start`     | Doctor          | Start an assigned referral           |
| PATCH  | `/api/v1/doctors/me/referrals/:referralId/complete`  | Doctor          | Complete with clinical notes         |

## Create referral

```json
{
  "patientId": "11111111-1111-4111-8111-111111111111",
  "assessmentId": "22222222-2222-4222-8222-222222222222",
  "predictionId": "33333333-3333-4333-8333-333333333333",
  "phcId": "44444444-4444-4444-8444-444444444444",
  "reason": "AI detected high diabetes risk.",
  "notes": "Patient advised to visit PHC."
}
```

The authenticated ASHA must own the patient. The assessment must belong to that patient, the prediction must belong to that assessment, and the PHC must serve the patient's village. A second referral for the same assessment/prediction is rejected.

Priority is derived by the service: urgent/emergency/immediate triage becomes `URGENT`; otherwise the prediction risk maps to `HIGH`, `MEDIUM`, or `LOW`. If a client supplies `priority`, it must match the derived value.

## Filters

Lists support `status`, `priority`, `patientId`, `disease`, `from`, `to`, `page`, and `limit`. PHC queues additionally support `villageId`, `ashaWorkerId`, and `doctorId`.

## Side effects

- Creation records `PENDING` history, writes an audit event, and notifies active PHC administrators.
- Assignment records history, writes an audit event, and notifies the doctor.
- Accept, reject, start, complete, and cancel are transactional status changes with history and audit records.
