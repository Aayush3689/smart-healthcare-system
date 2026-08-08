# PHC Dashboard API

Base path: `/api/v1/phc-dashboard`. All endpoints require an active authenticated
`PHC_ADMIN`. The PHC is derived from `AdminProfile.phcId`; clients must never send
a PHC ID. This module is read-only and does not replace any domain mutation API.

## Endpoints

| Method | Endpoint                                   | Query parameters                                          |
| ------ | ------------------------------------------ | --------------------------------------------------------- |
| GET    | `/api/v1/phc-dashboard`                    | None                                                      |
| GET    | `/api/v1/phc-dashboard/referrals`          | `status`, `priority`, `doctorId`, `villageId`, pagination |
| GET    | `/api/v1/phc-dashboard/high-risk-patients` | `disease`, `villageId`, `ashaWorkerId`, pagination        |
| GET    | `/api/v1/phc-dashboard/appointments`       | `date`, `status`, `doctorId`, `villageId`, pagination     |
| GET    | `/api/v1/phc-dashboard/follow-ups`         | `status`, `villageId`, `ashaWorkerId`, `from`, `to`       |
| GET    | `/api/v1/phc-dashboard/villages`           | `search`, pagination                                      |
| GET    | `/api/v1/phc-dashboard/doctors`            | `status`, pagination                                      |
| GET    | `/api/v1/phc-dashboard/asha-workers`       | `villageId`, `status`, pagination                         |
| GET    | `/api/v1/phc-dashboard/trends?period=30D`  | `period`: `7D`, `30D`, or `90D`                           |

Pagination uses `page` (default `1`) and `limit` (default `20`, maximum `100`).
Unknown query parameters are rejected.

## Main dashboard

`GET /api/v1/phc-dashboard` returns:

- summary counts for patients, workers, doctors, assessments, distinct high-risk
  patients, pending referrals, today's appointments, due follow-ups, and missed follow-ups;
- the five most recent referrals;
- the first five appointments scheduled today;
- the five newest stored high-risk predictions;
- the first five pending or scheduled follow-ups due through today.

High-risk information always comes from stored `Prediction` records. Opening the
dashboard never calls the AI model.

## Filtering examples

```http
GET /api/v1/phc-dashboard/referrals?status=PENDING&priority=HIGH&page=1&limit=20
GET /api/v1/phc-dashboard/high-risk-patients?disease=DIABETES&villageId=<uuid>
GET /api/v1/phc-dashboard/appointments?date=2026-08-09&status=SCHEDULED
GET /api/v1/phc-dashboard/follow-ups?status=MISSED&from=2026-08-01&to=2026-08-09
GET /api/v1/phc-dashboard/villages?search=Rampur
GET /api/v1/phc-dashboard/doctors?status=ACTIVE
GET /api/v1/phc-dashboard/asha-workers?villageId=<uuid>&status=ACTIVE
GET /api/v1/phc-dashboard/trends?period=30D
```

Send the PHC admin access token on every request:

```http
Authorization: Bearer <phc-admin-access-token>
```

Referral scope includes referrals recommended to or assigned to the authenticated
PHC. Appointment scope uses `Appointment.phcId`; all patient-related aggregations
require the patient's village to belong to that PHC. Cross-PHC records are never returned.

## Trends

Trends return one point for every UTC calendar day in the selected period,
including days with a zero count. Series include assessments, stored high-risk
predictions, referrals, and completed appointments.

Doctor, ASHA, referral, appointment, and follow-up changes must continue through
their respective modules. The dashboard exposes no `POST`, `PATCH`, `PUT`, or
`DELETE` endpoint.
