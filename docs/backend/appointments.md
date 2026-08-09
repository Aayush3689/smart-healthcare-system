# Appointments API

Appointments turn an accepted, doctor-assigned referral into a concrete PHC visit. The module owns scheduling, duration, doctor conflict prevention, explicit lifecycle actions, role-scoped calendars, notifications, audit events, and status history.

All endpoints require an active authenticated account and return the common `{ success, message, data }` envelope.

## Lifecycle

`SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED`

Scheduled, confirmed, or rescheduled appointments may be cancelled. Scheduled or confirmed appointments may be rescheduled. Confirmed appointments may be marked `NO_SHOW`. Arbitrary status updates are not exposed.

## Endpoints

| Method | Endpoint                                                  | Role                    | Purpose                                         |
| ------ | --------------------------------------------------------- | ----------------------- | ----------------------------------------------- |
| POST   | `/api/v1/appointments`                                    | PHC admin               | Create an appointment from an assigned referral |
| GET    | `/api/v1/appointments/:appointmentId`                     | Scoped                  | Get appointment and clinical context            |
| GET    | `/api/v1/appointments/:appointmentId/history`             | Scoped                  | Get lifecycle history                           |
| PATCH  | `/api/v1/appointments/:appointmentId/confirm`             | PHC admin, doctor       | Confirm appointment                             |
| PATCH  | `/api/v1/appointments/:appointmentId/cancel`              | PHC admin, doctor, ASHA | Cancel when allowed                             |
| PATCH  | `/api/v1/appointments/:appointmentId/reschedule`          | PHC admin, doctor       | Move to another available time                  |
| PATCH  | `/api/v1/appointments/:appointmentId/no-show`             | PHC admin, doctor       | Mark a confirmed visit as no-show               |
| GET    | `/api/v1/asha/me/appointments`                            | ASHA                    | List appointments for owned patients            |
| GET    | `/api/v1/asha/me/patients/:patientId/appointments`        | ASHA                    | List one patient's appointments                 |
| GET    | `/api/v1/doctors/me/appointments`                         | Doctor                  | Get the doctor's schedule                       |
| GET    | `/api/v1/doctors/me/appointments/:appointmentId`          | Doctor                  | Get assigned appointment details                |
| PATCH  | `/api/v1/doctors/me/appointments/:appointmentId/start`    | Doctor                  | Start a confirmed appointment                   |
| PATCH  | `/api/v1/doctors/me/appointments/:appointmentId/complete` | Doctor                  | Complete an in-progress appointment             |
| GET    | `/api/v1/phc/me/appointments`                             | PHC admin               | Get the PHC schedule                            |

## Create appointment

```json
{
  "patientId": "11111111-1111-4111-8111-111111111111",
  "referralId": "55555555-5555-4555-8555-555555555555",
  "doctorId": "66666666-6666-4666-8666-666666666666",
  "scheduledAt": "2026-08-10T10:30:00+05:30",
  "durationMinutes": 30,
  "reason": "High diabetes risk assessment"
}
```

The referral must belong to the authenticated administrator's PHC, reference the same patient, have status `ASSIGNED`, and contain the selected doctor assignment. The doctor must be active and belong to that PHC.

## Conflict prevention

Creation and rescheduling acquire a PostgreSQL transaction-level advisory lock for the doctor. Existing active slots are then checked for interval overlap using both appointments' durations. Conflicts return `409 RESOURCE_CONFLICT` with a `scheduledAt` field error. This prevents concurrent requests from booking the same doctor twice.

## Filters

Lists support `date`, `status`, `patientId`, `from`, `to`, `page`, and `limit`. PHC administrators may also filter by `doctorId`, referral `priority`, and `villageId`.

## Side effects

- Creation writes `SCHEDULED` history and an audit event, then notifies the doctor and patient's ASHA worker.
- Confirm, start, complete, cancel, no-show, and reschedule append history and audit events transactionally.
- Medical consultation notes remain outside this module and belong to clinical notes.
