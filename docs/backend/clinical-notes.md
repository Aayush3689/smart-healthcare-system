# Clinical Notes API

Clinical notes store the doctor's diagnosis and treatment separately from AI predictions. All endpoints require authentication and an active account.

## Endpoints

| Method | Endpoint                                               | Role          | Purpose                                                  |
| ------ | ------------------------------------------------------ | ------------- | -------------------------------------------------------- |
| POST   | `/api/v1/clinical-notes`                               | Doctor        | Create a draft note for an in-progress owned appointment |
| GET    | `/api/v1/clinical-notes/:clinicalNoteId`               | Doctor        | Fetch an accessible note                                 |
| PATCH  | `/api/v1/clinical-notes/:clinicalNoteId`               | Author doctor | Update a draft note                                      |
| PATCH  | `/api/v1/clinical-notes/:clinicalNoteId/finalize`      | Author doctor | Finalize a complete draft                                |
| GET    | `/api/v1/patients/:patientId/clinical-notes`           | Doctor        | List notes for a patient under their care                |
| GET    | `/api/v1/doctors/me/clinical-notes`                    | Doctor        | List the doctor's notes                                  |
| GET    | `/api/v1/asha/me/patients/:patientId/clinical-summary` | ASHA          | Fetch a limited final clinical summary for their patient |

List endpoints accept `patientId` where applicable, `status`, `from`, `to`, `page`, and `limit`.

## Create request

```json
{
  "appointmentId": "77777777-7777-4777-8777-777777777777",
  "patientId": "11111111-1111-4111-8111-111111111111",
  "observations": "Patient reports increased thirst.",
  "clinicalImpression": "Diabetes suspected.",
  "diagnosis": "Type 2 diabetes mellitus",
  "treatmentPlan": "Lifestyle modification and laboratory evaluation.",
  "advice": "Reduce sugar intake.",
  "medications": [
    {
      "name": "Metformin",
      "dosage": "500 mg",
      "frequency": "TWICE_DAILY",
      "duration": "30 days",
      "route": "ORAL",
      "instructions": "Take after meals."
    }
  ],
  "followUpRequired": true,
  "followUpAfterDays": 14
}
```

`doctorId`, status, and finalization timestamps are server-controlled. The appointment must belong to the patient and authenticated doctor, be `IN_PROGRESS`, and have no existing clinical note.

Medication creation and note creation occur in one transaction. Updating the medication array replaces the draft's medication list atomically.

## Lifecycle

Notes begin as `DRAFT`. Only the author may edit them. Finalization requires `clinicalImpression`, `diagnosis`, and `treatmentPlan`; a `FINAL` note is immutable. All mutations are audit logged.
