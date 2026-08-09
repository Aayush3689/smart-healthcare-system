# Villages API

Villages are seeded master-location data. With the current roles, ASHA workers, doctors, and PHC admins have read-only access. No village create, update, delete, activate, or deactivate API is exposed. Those operations are reserved for a future super-admin module.

## Endpoints

| Method | Endpoint                                         | Access                             |
| ------ | ------------------------------------------------ | ---------------------------------- |
| GET    | `/api/v1/villages/:villageId`                    | Scoped ASHA, doctor, or PHC admin  |
| GET    | `/api/v1/villages/:villageId/asha-workers`       | Scoped ASHA, doctor, or PHC admin  |
| GET    | `/api/v1/villages/:villageId/patients`           | Scoped ASHA, doctor, or PHC admin  |
| GET    | `/api/v1/villages/:villageId/statistics`         | Scoped ASHA, doctor, or PHC admin  |
| GET    | `/api/v1/villages/:villageId/disease-statistics` | Scoped ASHA, doctor, or PHC admin  |
| GET    | `/api/v1/villages/:villageId/high-risk-patients` | Scoped ASHA, doctor, or PHC admin  |
| GET    | `/api/v1/villages/:villageId/referrals`          | Scoped ASHA, doctor, or PHC admin  |
| GET    | `/api/v1/villages/:villageId/follow-ups`         | Scoped ASHA, doctor, or PHC admin  |
| GET    | `/api/v1/phc/me/villages`                        | PHC admin; own PHC only            |
| GET    | `/api/v1/phc/me/villages/:villageId`             | PHC admin; own PHC only            |
| GET    | `/api/v1/asha/me/village`                        | ASHA; village derived from profile |

The PHC list supports `search`, `page`, and `limit`. Patient filters are `search`, `riskLevel`, `ashaWorkerId`, `page`, and `limit`. Referral and follow-up lists support `status`, `priority`, `page`, and `limit`. High-risk patients support `disease`, `page`, and `limit`.

## Access rules

- An ASHA worker can access only their assigned village.
- A doctor can access villages belonging to their PHC.
- A PHC admin can access only villages belonging to their PHC.
- Cross-PHC access returns `403 FORBIDDEN`.
- Village IDs used while provisioning an ASHA must reference an active village in the admin's PHC.

## Seed data

`npm run prisma:seed` idempotently creates ten villages for the seeded PHC: Rampur, Shyampur, Chandipur, Krishnapur, Madhabpur, Gopalpur, Haripur, Sonapur, Lakshmipur, and Rajapur. District and state are inherited from the PHC seed configuration.
