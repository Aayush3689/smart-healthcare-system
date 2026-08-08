# Authentication API

Base URL: `/api/v1/auth`  
Content type: `application/json`

## Response envelope

Every endpoint uses the same envelope:

```json
{ "success": true, "message": "...", "data": {} }
```

Errors use:

```json
{
  "success": false,
  "message": "...",
  "error": { "code": "ERROR_CODE", "details": [] }
}
```

`details` is included for validation errors outside production. Request bodies are strict: unknown fields return `400 VALIDATION_ERROR`.

## POST `/request-otp`

Sends a six-digit login code to an existing non-inactive account.

| Field   | Required | Rules                                                                                |
| ------- | -------- | ------------------------------------------------------------------------------------ |
| `email` | Yes      | Valid email, maximum 320 characters. Whitespace is trimmed and the value lowercased. |

```json
{ "email": "doctor@example.com" }
```

Success: `200`, `data: null`, message: `If the account is active, a verification code has been sent.`

Errors: `400 VALIDATION_ERROR`; `404 ACCOUNT_NOT_FOUND` when no active account exists.

## POST `/verify-otp`

Verifies a login code, activates the account, and returns an access/refresh token pair.

| Field      | Required | Rules                                                             |
| ---------- | -------- | ----------------------------------------------------------------- |
| `email`    | Yes      | Valid email; normalized as above.                                 |
| `otp`      | Yes      | String containing exactly six digits.                             |
| `platform` | No       | `MOBILE_APP` (default), `DOCTOR_DASHBOARD`, or `ADMIN_DASHBOARD`. |
| `deviceId` | No       | Trimmed string, maximum 200 characters.                           |

```json
{
  "email": "doctor@example.com",
  "otp": "123456",
  "platform": "DOCTOR_DASHBOARD"
}
```

Success: `200`; `data` contains `user`, `accessToken`, and `refreshToken`. Access tokens last 15 minutes; refresh tokens last 30 days.

Errors: `400 VALIDATION_ERROR`; `401 INVALID_OTP` for an invalid, used, or expired code; `404 ACCOUNT_NOT_FOUND` if the linked account no longer exists.

## POST `/refresh`

Rotates an active refresh token; the submitted token is revoked.

```json
{ "refreshToken": "<40-300 character refresh token>" }
```

`refreshToken` is required and must be 40–300 characters. Success: `200` with `data.accessToken` and `data.refreshToken`.

Errors: `400 VALIDATION_ERROR`; `401 INVALID_REFRESH_TOKEN` if the token is expired, revoked, malformed, or belongs to an inactive account.

## POST `/logout`

Revokes the supplied refresh token. The required body is identical to `/refresh`.

Success: `200`, `data: null`, message: `Logged out successfully.`  
Errors: `400 VALIDATION_ERROR`; `401 INVALID_REFRESH_TOKEN`.

## GET `/me`

Returns the authenticated user. Send `Authorization: Bearer <accessToken>`. No request body is required.

Success: `200` with:

```json
{
  "id": "uuid",
  "email": "doctor@example.com",
  "role": "DOCTOR",
  "status": "ACTIVE",
  "isEmailVerified": true
}
```

Errors: `401 UNAUTHENTICATED` without a bearer token; `401 INVALID_ACCESS_TOKEN` for a bad or expired token; `404 ACCOUNT_NOT_FOUND` if the account was removed.

## PATCH `/me/login-details`

Changes the authenticated user’s email and marks it unverified.

Header: `Authorization: Bearer <accessToken>`

```json
{ "email": "new-email@example.com" }
```

Success: `200` with the updated user. Request and verify a new OTP for the updated email.

Errors: `400 VALIDATION_ERROR`; `401 UNAUTHENTICATED` or `INVALID_ACCESS_TOKEN`; `409 EMAIL_ALREADY_IN_USE`.

## POST `/accounts`

Creates an invited Doctor or ASHA Worker account. A `PHC_ADMIN` access token is required.

Doctor body:

```json
{
  "email": "doctor@example.com",
  "role": "DOCTOR",
  "fullName": "Dr. Ada Rao",
  "phcId": "uuid"
}
```

ASHA Worker body:

```json
{
  "email": "asha@example.com",
  "role": "ASHA_WORKER",
  "fullName": "Asha Devi",
  "villageId": "uuid",
  "employeeCode": "ASHA-01"
}
```

All bodies require `email`, `role`, and `fullName` (2–150 characters). Doctors require UUID `phcId`; ASHA workers require UUID `villageId` and `employeeCode` (2–100 characters). `PHC_ADMIN` is not accepted.

The ASHA `villageId` must identify an active village belonging to the authenticated admin's PHC. Fetch valid IDs with `GET /api/v1/phc/me/villages`; arbitrary UUIDs return `404 VILLAGE_NOT_FOUND`. Doctors may likewise only be provisioned into the authenticated admin's PHC.

Success: `201` with the new invited user in `data`.

Errors: `400 VALIDATION_ERROR` or `ACCOUNT_PROVISION_FAILED`; `401 UNAUTHENTICATED` or `INVALID_ACCESS_TOKEN`; `403 FORBIDDEN`; `409 RESOURCE_CONFLICT` for duplicate unique data.
