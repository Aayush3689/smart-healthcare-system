# ASHA API

Base path: `/api/v1/asha`. Every endpoint requires an active authenticated
`ASHA_WORKER`. The server derives the ASHA profile from the access token; clients
never send an ASHA ID.

## Endpoints

- `GET|PATCH /me` — profile and permitted name update.
- `GET /me/dashboard` — patient, assessment, risk, referral, follow-up and sync summary.
- `GET /me/statistics?from=&to=` — date-filtered detailed totals.
- `GET|POST /me/patients` — paginated scoped patients and offline-ID registration.
- `GET|PATCH /me/patients/:patientId` — owned patient detail/update.
- `GET /me/patients/:patientId/assessments` — assessment history.
- `GET /me/patients/:patientId/predictions` — explainable prediction history.
- `GET|POST /me/assessments` — history and synchronous AI-backed assessment creation.
- `GET /me/assessments/:assessmentId` — assessment, predictions, reasons and model versions.
- `GET|POST /me/referrals` — scoped referral history and creation.
- `GET /me/referrals/:referralId` — referral, PHC, assignment and appointment detail.
- `GET /me/follow-ups` and `GET /me/follow-ups/:followUpId` — assigned follow-ups.
- `POST /me/follow-ups/:followUpId/complete` — complete a pending assigned follow-up.
- `GET /me/appointments?date=` — appointments for the ASHA's patients.
- `GET /me/notifications`, `PATCH /me/notifications/:notificationId/read`, and
  `POST /me/notifications/read-all` — caller-owned notifications.
- `GET|POST /me/patients/:patientId/documents` — owned patient documents; uploads
  use `multipart/form-data` with `file` and optional `assessmentId` (10 MiB limit).
- `POST|GET /me/documents/:documentId/ocr` — start/read OCR processing.
- `GET|PATCH /me/documents/:documentId/extraction` — review/correct extracted JSON.
- `POST /me/speech/transcribe` — reserved provider-backed audio transcription.

Patient and assessment IDs may be client-generated UUIDs. Unknown or duplicate
IDs are rejected safely. Assessment creation derives age from the patient's date
of birth when omitted, invokes FastAPI, and stores predictions and reasons before
returning.

Speech returns `SPEECH_PROVIDER_UNAVAILABLE` until a provider is configured. OCR
start persists `PROCESSING`; the external OCR worker must later persist the
extraction and terminal status.

## Offline synchronization

The ASHA client uses `POST /api/v1/sync/push`, `GET /api/v1/sync/pull`,
`GET /api/v1/sync/status`, and `POST /api/v1/sync/retry`. The sync module reserves
each `changeId` before applying it, replays stored results for duplicate IDs,
processes changes in request order, and isolates partial failures. Pull uses an
opaque stable cursor and includes scoped patients, assessments, predictions,
follow-ups, appointments, and referrals. See [Offline Sync API](./offline-sync.md).
