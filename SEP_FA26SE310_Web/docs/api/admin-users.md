# Admin users API

Recorded from the user-provided contract on 2026-10-20. Runtime requests use the signed-in administrator's access token; example tokens are not stored.

```http
GET /api/admin/users?page=0&size=20
Accept: */*
Authorization: Bearer <accessToken>
```

The supplied example uses a zero-based `page` index and `size=20`. The web page starts with those values, supports sizes 10/20/50, and displays one-based page numbers to users.

## Success response

```json
{
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": {
    "content": [
      {
        "userId": 1,
        "username": "admin",
        "email": "admin@example.com",
        "studentCode": null,
        "fullName": "System Administrator",
        "phone": "0123456789",
        "preferredStopId": null,
        "status": "ACTIVE",
        "emailVerified": true,
        "locked": false,
        "role": "ADMIN"
      }
    ],
    "page": {
      "size": 20,
      "number": 0,
      "totalElements": 1,
      "totalPages": 1
    }
  }
}
```

This shortened example keeps one item from the supplied response and adjusts the total accordingly. The application displays server results rather than these example rows.

## Permission error

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "data": null
}
```

The backend decides access. A role claim in a token does not override a `403`; the UI displays an access-denied message and does not replace the result with demo users. A `401` triggers one token refresh and one retry. Page changes and navigation cancel stale requests. Loading, empty responses, invalid response data, network failures, and retries have separate UI states.

Only listing users is integrated. No create/update/delete, role change, lock/unlock, or Excel import endpoint has been supplied for this page.
