# PHC API

The PHC module owns facility information, served villages, staff views and PHC-level aggregation. Doctor CRUD, referrals, appointments and follow-ups remain in their respective modules.

All endpoints require an authenticated, active `PHC_ADMIN`. The PHC ID always comes from the admin profile and is never accepted from the client.

## Endpoints

| Method | Endpoint                             | Purpose                                           |
| ------ | ------------------------------------ | ------------------------------------------------- |
| GET    | `/api/v1/phc/me`                     | Fetch the admin's PHC profile                     |
| PATCH  | `/api/v1/phc/me`                     | Update permitted facility fields                  |
| GET    | `/api/v1/phc/me/villages`            | List served villages                              |
| GET    | `/api/v1/phc/me/villages/:villageId` | Fetch a same-PHC village                          |
| GET    | `/api/v1/phc/me/overview`            | Dashboard totals                                  |
| GET    | `/api/v1/phc/me/statistics`          | Detailed healthcare statistics                    |
| GET    | `/api/v1/phc/me/disease-statistics`  | Disease and high-risk distribution                |
| GET    | `/api/v1/phc/me/villages/statistics` | Village-level operational statistics              |
| GET    | `/api/v1/phc/me/asha-workers`        | List ASHA workers serving PHC villages            |
| GET    | `/api/v1/phc/me/operations`          | Current referral, appointment and follow-up queue |

## Update profile

```json
{
  "name": "Village Primary Health Centre",
  "address": "New Main Road",
  "district": "North 24 Parganas",
  "state": "West Bengal",
  "phone": "+919876543210"
}
```

`id`, `code`, and `status` are server-controlled. PHC admins cannot deactivate their own facility.

## Analytics filters

`statistics` and `disease-statistics` accept optional `from`, `to`, and `villageId`. The village must belong to the authenticated admin's PHC. Dates are ISO timestamps and `from` cannot be after `to`.

The overview includes patient, ASHA, doctor, referral, high-risk patient, appointment and follow-up counts. Disease statistics return assessed and high-risk counts by disease. Village statistics return patient, assessment, high-risk, pending-referral and missed-follow-up counts.

Aggregations use scoped database counts; medical records are not loaded into application memory. Profile mutations are audit logged.
