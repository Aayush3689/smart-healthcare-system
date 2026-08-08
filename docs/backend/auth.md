# Authentication API

Authentication uses email OTPs, short-lived access tokens, and rotating refresh tokens. It also provides PHC-admin account provisioning for invited doctors and ASHA workers.

All endpoints use the common `{ success, message, data }` response envelope. Request bodies are strict, so unknown fields return `400 VALIDATION_ERROR`.

## Endpoints

| Method | Endpoint                        | Access    | Purpose                                     |
| ------ | ------------------------------- | --------- | ------------------------------------------- |
| POST   | `/api/v1/auth/request-otp`      | Public    | Send a login OTP to an existing account     |
| POST   | `/api/v1/auth/verify-otp`       | Public    | Verify OTP and issue tokens                 |
| POST   | `/api/v1/auth/refresh`          | Public    | Rotate a valid refresh token                |
| POST   | `/api/v1/auth/logout`           | Public    | Revoke a refresh token                      |
| GET    | `/api/v1/auth/me`               | Bearer    | Fetch the authenticated user                |
| PATCH  | `/api/v1/auth/me/login-details` | Bearer    | Change the authenticated user's email       |
| POST   | `/api/v1/auth/accounts`         | PHC admin | Provision an invited doctor or ASHA account |

## Request OTP

```http
POST /api/v1/auth/request-otp
Content-Type: application/json
```

```json
{
  "email": "doctor@example.com"
}
```

The email is trimmed and normalized to lowercase. The account must exist and must not be inactive. A six-digit OTP is sent to the registered email address.

## Verify OTP

```json
{
  "email": "doctor@example.com",
  "otp": "123456",
  "platform": "DOCTOR_DASHBOARD",
  "deviceId": "optional-device-id"
}
```

Supported platforms are `MOBILE_APP`, `DOCTOR_DASHBOARD`, and `ADMIN_DASHBOARD`; the default is `MOBILE_APP`.

Successful verification activates an invited account and returns:

```json
{
  "user": {
    "id": "user-uuid",
    "email": "doctor@example.com",
    "role": "DOCTOR",
    "status": "ACTIVE",
    "isEmailVerified": true
  },
  "accessToken": "access-token",
  "refreshToken": "refresh-token"
}
```

Access tokens expire after 15 minutes. Refresh tokens expire after 30 days.

## Refresh tokens

Refresh and logout use the same body:

```json
{
  "refreshToken": "refresh-token"
}
```

`POST /api/v1/auth/refresh` revokes the submitted token and returns a new access-token and refresh-token pair. A revoked, expired, malformed, or inactive-account token returns `401 INVALID_REFRESH_TOKEN`.

`POST /api/v1/auth/logout` revokes the submitted token and returns a successful empty response. No bearer access token is required for either endpoint.

## Current user

```http
GET /api/v1/auth/me
Authorization: Bearer <access-token>
```

The response contains `id`, `email`, `role`, `status`, and `isEmailVerified`.

## Change login email

```http
PATCH /api/v1/auth/me/login-details
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "email": "new-email@example.com"
}
```

The new email is marked unverified. The user must request and verify another OTP. An existing email returns `409 EMAIL_ALREADY_IN_USE`.

## Provision an ASHA worker

```http
POST /api/v1/auth/accounts
Authorization: Bearer <PHC_ADMIN_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "email": "asha@example.com",
  "role": "ASHA_WORKER",
  "fullName": "Asha Devi",
  "villageId": "11111111-1111-4111-8111-111111111111",
  "employeeCode": "ASHA-001"
}
```

The village must be active and belong to the authenticated administrator's PHC. Fetch valid IDs from `GET /api/v1/phc/me/villages`. Missing, inactive, or cross-PHC villages return `404 VILLAGE_NOT_FOUND`.

Provisioning transactionally creates an `INVITED` user and its ASHA worker profile.

## Provision a doctor

The preferred doctor-management endpoint is `POST /api/v1/phc/me/doctors`, which derives the PHC from the authenticated administrator.

The authentication provisioning endpoint also accepts:

```json
{
  "email": "doctor@example.com",
  "role": "DOCTOR",
  "fullName": "Dr Ada Rao",
  "phcId": "44444444-4444-4444-8444-444444444444"
}
```

The supplied PHC must match the authenticated administrator's PHC or the request returns `403 PHC_SCOPE_VIOLATION`. `PHC_ADMIN` accounts cannot be created through this endpoint.

## Common errors

| Status | Code                    | Meaning                                    |
| ------ | ----------------------- | ------------------------------------------ |
| 400    | `VALIDATION_ERROR`      | Request body failed strict validation      |
| 401    | `INVALID_OTP`           | OTP is invalid, expired, or already used   |
| 401    | `INVALID_ACCESS_TOKEN`  | Bearer token is invalid or expired         |
| 401    | `INVALID_REFRESH_TOKEN` | Refresh token cannot be used               |
| 403    | `FORBIDDEN`             | Authenticated role is not permitted        |
| 404    | `ACCOUNT_NOT_FOUND`     | No usable account exists for the email     |
| 404    | `VILLAGE_NOT_FOUND`     | ASHA village is unavailable or outside PHC |
| 409    | `EMAIL_ALREADY_IN_USE`  | Email is already assigned                  |
| 409    | `RESOURCE_CONFLICT`     | Provisioned unique data already exists     |
