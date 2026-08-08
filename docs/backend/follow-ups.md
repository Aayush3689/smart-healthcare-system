# Follow-ups API

Follow-ups connect a finalized clinical recommendation back to the patient's ASHA worker. All endpoints require authentication and an active account.

## Endpoints

| Method | Endpoint                                          | Role                             |
| ------ | ------------------------------------------------- | -------------------------------- |
| POST   | `/api/v1/follow-ups`                              | Doctor or PHC admin              |
| GET    | `/api/v1/follow-ups/:followUpId`                  | Scoped doctor, ASHA or PHC admin |
| GET    | `/api/v1/follow-ups/:followUpId/history`          | Scoped doctor, ASHA or PHC admin |
| PATCH  | `/api/v1/follow-ups/:followUpId/reschedule`       | Doctor or PHC admin              |
| GET    | `/api/v1/asha/me/follow-ups`                      | ASHA                             |
| GET    | `/api/v1/asha/me/patients/:patientId/follow-ups`  | ASHA                             |
| PATCH  | `/api/v1/asha/me/follow-ups/:followUpId/start`    | Assigned ASHA                    |
| POST   | `/api/v1/asha/me/follow-ups/:followUpId/complete` | Assigned ASHA                    |
| PATCH  | `/api/v1/asha/me/follow-ups/:followUpId/missed`   | Assigned ASHA                    |
| GET    | `/api/v1/doctors/me/follow-ups`                   | Doctor                           |
| GET    | `/api/v1/doctors/me/follow-ups/:followUpId`       | Doctor                           |
| GET    | `/api/v1/phc/me/follow-ups`                       | PHC admin                        |

List filters include `status`, `priority`, `patientId`, `date`, `from`, `to`, `page`, and `limit`. The PHC queue additionally supports `villageId`, `ashaWorkerId`, and `doctorId`.

## Create

```json
{
  "patientId": "11111111-1111-4111-8111-111111111111",
  "clinicalNoteId": "88888888-8888-4888-8888-888888888888",
  "appointmentId": "77777777-7777-4777-8777-777777777777",
  "scheduledFor": "2026-08-24T10:00:00+05:30",
  "reason": "Review blood sugar and treatment response.",
  "priority": "HIGH"
}
```

The clinical note must be final and match the patient and appointment. Doctors may create only recommendations they authored with `followUpRequired=true`; a PHC admin may create an additional follow-up within their PHC. The ASHA worker is derived from the patient's registration and receives a notification.

Creation records `PENDING` and automatic assignment history, then returns the actionable `SCHEDULED` follow-up.

## ASHA visit and assessment

1. Start the scheduled follow-up.
2. Create an assessment through `POST /api/v1/assessments` with the follow-up's `followUpId`.
3. Complete the assessment and upload its predictions normally.
4. Complete the follow-up:

```json
{
  "visited": true,
  "notes": "Patient reports improvement and is taking medication regularly.",
  "assessmentId": "22222222-2222-4222-8222-222222222222"
}
```

The assessment must be completed, belong to the same patient, and have been conducted by the assigned ASHA worker. Vitals, symptoms, and predictions remain in the assessment rather than being duplicated in the follow-up.

Lifecycle transitions and reschedules are written to follow-up history and all mutations are audit logged.
