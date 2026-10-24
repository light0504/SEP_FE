# Student preferred stop API

Recorded from the user-provided contract on 2026-10-20. Requests use the current app session; no example bearer token is saved or used for live writes.

```http
PUT /api/student/profile/preferred-stop
Accept: */*
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "stopId": 1
}
```

`stopId` is the identifier of the selected stop from the student stops list, not a trip-specific `tripStopId`.

Supplied success response:

```json
{
  "statusCode": 200,
  "message": "Preferred stop updated successfully",
  "data": 1
}
```

## Application behavior

- Student **Profile → Cài đặt → Điểm đón ưu tiên** opens route/stop selection.
- Stops are loaded for the selected route. Save sends the selected `stopId` and checks that the server confirms the same numeric ID.
- The displayed preference changes only after success. Loading, retry, save errors, and a disabled save button prevent incomplete or repeated submissions.
- A `401` refreshes the token and retries the same PUT once. A failed request preserves the previous local preference.
- Demo sign-in saves locally without an API call.
- No endpoint for reading the student's existing preference has been supplied. Real sign-in starts with an unset local preference; the app does not claim to have loaded the server's current value. Reading a saved preference after a new login remains pending a profile/read endpoint.
