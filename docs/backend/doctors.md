# Doctors API

All endpoints require authentication and an active account. Doctor endpoints require `DOCTOR`; PHC management endpoints require `PHC_ADMIN`. PHC admins can access only doctors belonging to their own PHC.

## Doctor self-service

| Method | Endpoint                                 | Purpose                                      |
| ------ | ---------------------------------------- | -------------------------------------------- |
| GET    | `/api/v1/doctors/me`                     | Fetch own profile                            |
| PATCH  | `/api/v1/doctors/me`                     | Update `fullName` or `specialization`        |
| GET    | `/api/v1/doctors/me/availability`        | Fetch weekly availability                    |
| PATCH  | `/api/v1/doctors/me/availability`        | Merge weekday availability                   |
| GET    | `/api/v1/doctors/me/summary`             | Fetch lightweight care summary               |
| GET    | `/api/v1/doctors/me/patients`            | List patients under the doctor's care        |
| GET    | `/api/v1/doctors/me/patients/:patientId` | Fetch an accessible patient and care history |

Patient list filters are `search`, `riskLevel`, `referralStatus`, `page`, and `limit`. Access requires an appointment or assigned referral linking the doctor to the patient.

Availability body:

```json
{
  "schedule": {
    "monday": { "available": true, "start": "09:00", "end": "16:00" },
    "tuesday": { "available": false }
  }
}
```

## PHC doctor management

| Method | Endpoint                                        | Purpose                                              |
| ------ | ----------------------------------------------- | ---------------------------------------------------- |
| GET    | `/api/v1/phc/me/doctors`                        | List doctors in the admin's PHC                      |
| POST   | `/api/v1/phc/me/doctors`                        | Atomically create an invited user and doctor profile |
| GET    | `/api/v1/phc/me/doctors/:doctorId`              | Fetch doctor details                                 |
| PATCH  | `/api/v1/phc/me/doctors/:doctorId`              | Update allowed profile fields                        |
| PATCH  | `/api/v1/phc/me/doctors/:doctorId/activate`     | Change `INACTIVE` to `ACTIVE`                        |
| PATCH  | `/api/v1/phc/me/doctors/:doctorId/deactivate`   | Soft-deactivate an active doctor                     |
| GET    | `/api/v1/phc/me/doctors/:doctorId/availability` | Fetch doctor availability                            |

Create body:

```json
{
  "email": "amit@example.com",
  "fullName": "Dr Amit Roy",
  "specialization": "General Medicine"
}
```

The backend derives `phcId`, role, and initial `INVITED` status. It rejects duplicate emails and unknown fields such as `role`, `userId`, or `phcId`. Deactivation preserves all history and is rejected while future appointments or open doctor assignments exist.

List filters are `status`, `specialization`, `search`, `page`, and `limit`. API responses use the standard `{ success, message, data }` envelope.
