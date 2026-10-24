# Session logout API

Recorded from the user-provided endpoint on 2026-10-20:

```text
https://capstoneproject-be-6cn5.onrender.com/api/session/logout
```

## Request contract

| Detail | Status |
| --- | --- |
| Path | `/api/session/logout` |
| HTTP method | `POST` |
| Authorization | `Authorization: Bearer <accessToken>` from the current session |
| Request body | Empty string; no refresh token in the logout body |
| Success response | HTTP/envelope status `201`, `data: null` |
| Error responses | Not provided |
| Revocation scope | Current device, according to the supplied success message |

```http
POST /api/session/logout
Accept: */*
Authorization: Bearer <accessToken>
```

```json
{
  "statusCode": 201,
  "message": "Logged out from current device successfully",
  "data": null
}
```

## Current application behavior

Student Profile, the driver header, and the web admin header call this endpoint using their signed-in session. Demo mobile sessions clear local state without a server call.

Logout waits for an ongoing token refresh before sending the request. A `401` triggers one token refresh and one retry. Duplicate clicks are blocked while logout is running. Local session and account-specific demo state are cleared after success or failure; if the server cannot confirm logout, the user sees a warning. Outstanding refresh responses cannot restore a signed-out session.

The supplied bearer token is intentionally not stored in project files or used for live logout checks. Runtime requests use the app's session token.
