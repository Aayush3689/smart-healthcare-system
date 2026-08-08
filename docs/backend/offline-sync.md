# Offline Sync API

Base path: `/api/v1/sync`. Every endpoint requires an active authenticated `ASHA_WORKER`.
Changes are scoped to the ASHA profile derived from the access token.

## Endpoints

| Method | Endpoint              | Purpose                                      |
| ------ | --------------------- | -------------------------------------------- |
| POST   | `/api/v1/sync/push`   | Apply ordered changes collected offline      |
| GET    | `/api/v1/sync/pull`   | Fetch scoped server changes using a cursor   |
| GET    | `/api/v1/sync/status` | Fetch pending, failed, and conflict state    |
| POST   | `/api/v1/sync/retry`  | Retry previously failed or conflicting items |

No register-device, acknowledgement, or conflict-resolution endpoint is exposed in v1.

## Push offline changes

```http
POST /api/v1/sync/push
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "deviceId": "device-123",
  "changes": [
    {
      "changeId": "change-001",
      "entity": "PATIENT",
      "operation": "CREATE",
      "clientCreatedAt": "2026-08-09T08:00:00.000Z",
      "data": {
        "id": "11111111-1111-4111-8111-111111111111",
        "fullName": "Rahul Das",
        "dateOfBirth": "1970-05-14",
        "gender": "MALE",
        "villageId": "22222222-2222-4222-8222-222222222222"
      }
    }
  ]
}
```

Supported queue entities are `PATIENT`, `ASSESSMENT`, `PREDICTION`, and `FOLLOW_UP`.
Each item requires a client-generated UUID in `data.id`. Patient create/update,
assessment create, and prediction create reuse their domain DTOs and validation.
Follow-up updates additionally require `data.action` equal to `START`, `COMPLETE`,
or `MISSED`, plus the matching follow-up action payload.

The response separates `accepted`, `conflicts`, and `failed` entries. Items are
processed in request order and one failure does not roll back other changes.
`changeId` is idempotent per authenticated user: replaying the same change returns
its stored result without executing the domain mutation again. Clinical deletes
and immutable entity mutations are reported as conflicts.

## Pull server changes

```http
GET /api/v1/sync/pull?cursor=<opaque-cursor>&limit=100
Authorization: Bearer <access-token>
```

Omit `cursor` for the first pull. `limit` defaults to 100 and may not exceed 100.
The result contains `changes`, `nextCursor`, and `hasMore`. A change contains
`entity`, `operation`, `id`, `updatedAt`, and `data`. Pull may return patients,
assessments, predictions, follow-ups, appointments, and referrals visible to the
ASHA worker. Clients must store `nextCursor` unchanged and send it on the next pull.

## Sync status

```http
GET /api/v1/sync/status
Authorization: Bearer <access-token>
```

```json
{
  "success": true,
  "message": "Sync status fetched.",
  "data": {
    "lastSyncedAt": "2026-08-09T10:30:00.000Z",
    "pendingChanges": 0,
    "failedChanges": 1,
    "hasConflicts": false
  }
}
```

## Retry failed changes

```http
POST /api/v1/sync/retry
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "changeIds": ["change-001", "change-002"]
}
```

Only changes owned by the caller with `FAILED` or `CONFLICT` status are retried.
Unknown, already-synced, and pending IDs return `CHANGE_NOT_RETRYABLE` without
affecting other requested retries.

## Validation and errors

- A push or retry batch contains 1 to 100 unique change IDs.
- A client timestamp cannot be more than five minutes in the future.
- Invalid domain payloads are stored as `FAILED` with `VALIDATION_ERROR`.
- Invalid cursors return `400 INVALID_SYNC_CURSOR`.
- Non-ASHA roles receive `403 FORBIDDEN`.
