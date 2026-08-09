# Predictions API

The predictions module receives AI results produced by the mobile application's on-device models. The backend validates and stores those results; it does not recalculate or verify probability, risk level, or classification through FastAPI.

All endpoints require an active authenticated account and return the common `{ success, message, data }` envelope.

## Endpoints

| Method | Endpoint                                             | Roles                   | Purpose                             |
| ------ | ---------------------------------------------------- | ----------------------- | ----------------------------------- |
| POST   | `/api/v1/predictions`                                | ASHA                    | Synchronize one mobile prediction   |
| POST   | `/api/v1/predictions/bulk`                           | ASHA                    | Synchronize up to 100 predictions   |
| GET    | `/api/v1/predictions/:predictionId`                  | ASHA, doctor, PHC admin | Read an authorized prediction       |
| GET    | `/api/v1/assessments/:assessmentId/predictions`      | ASHA, doctor, PHC admin | Read results for one assessment     |
| GET    | `/api/v1/patients/:patientId/predictions`            | ASHA, doctor, PHC admin | Read paginated patient history      |
| GET    | `/api/v1/predictions/high-risk`                      | Doctor, PHC admin       | List high-risk patients in scope    |
| GET    | `/api/v1/predictions/statistics`                     | Doctor, PHC admin       | Get risk and disease aggregates     |
| GET    | `/api/v1/asha/me/patients/:patientId/predictions`    | ASHA                    | ASHA-scoped patient history alias   |
| GET    | `/api/v1/doctors/me/patients/:patientId/predictions` | Doctor                  | Doctor-scoped patient history alias |

## Synchronize a prediction

`POST /api/v1/predictions`

```json
{
  "id": "33333333-3333-4333-8333-333333333333",
  "assessmentId": "22222222-2222-4222-8222-222222222222",
  "disease": "DIABETES",
  "prediction": true,
  "probability": 0.91,
  "riskLevel": "HIGH",
  "triage": "REFER_TO_PHC",
  "reasons": [
    {
      "feature": "glucose",
      "value": 205,
      "message": "Blood sugar is elevated."
    }
  ],
  "modelVersion": "diabetes-v1.0",
  "predictionGeneratedAt": "2026-08-08T10:30:00Z",
  "deviceId": "device-123"
}
```

The assessment must belong to the authenticated ASHA worker. Repeating the same prediction UUID for the same assessment and disease returns the existing record. A different UUID for an existing `assessmentId + disease` pair returns `409 PREDICTION_ALREADY_EXISTS`.

## Bulk synchronization

`POST /api/v1/predictions/bulk` accepts `{ "predictions": [...] }`. The response reports `created`, `alreadyExists`, `failed`, and an item-level status list. One invalid item does not roll back successful independent items.

## Query parameters

Patient history supports `disease`, `riskLevel`, `from`, `to`, `page`, and `limit`.

High-risk results support `disease`, `villageId`, `from`, `to`, `page`, and `limit`. Statistics support the same filters except pagination.

## Authorization

- ASHA workers can create and read predictions only for patients and assessments in their own scope.
- PHC administrators are restricted to patients in villages belonging to their PHC.
- Doctors can read patients connected through their appointments or referral assignments.
- Inaccessible resources are returned as not found to avoid disclosing patient existence.

## Assessment completion

An assessment remains a draft until one prediction for each supported disease—`DIABETES`, `HEART_DISEASE`, and `HYPERTENSION`—has been uploaded. Missing results return `422 INCOMPLETE_PREDICTIONS`.
