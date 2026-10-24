# My student bookings API

Recorded from the user-provided contract on 2026-10-20. Runtime requests use the current student session; the example bearer token is not saved.

```http
GET /api/student/bookings/my
Accept: */*
Authorization: Bearer <accessToken>
```

No query parameters or request body were supplied. The endpoint returns an array, not a paginated object.

## Supplied response

```json
{
  "statusCode": 200,
  "message": "Student bookings retrieved successfully",
  "data": [
    {
      "bookingId": 1,
      "bookingCode": "171b8add-16fb-426d-8961-71105fd668b9",
      "tripId": 3,
      "tripCode": "CAMPUS-CENTER-20261017-1000",
      "boardingStopId": 1,
      "boardingStop": "Ký túc xá",
      "alightingStopId": 3,
      "alightingStop": "Bến xe trung tâm",
      "seatId": 3,
      "seatCode": "1C",
      "status": "CANCELLED",
      "reservedAt": "2026-10-17T07:50:37.407569",
      "checkedInAt": null,
      "cancelledAt": "2026-10-17T07:51:31.586885"
    }
  ]
}
```

## Application behavior

- After student password login, **Chỗ của tôi** requests this endpoint using the shared authenticated API client.
- Cards display booking ID/code, trip code, boarding/alighting stop names, seat code, status, reservation time, and check-in/cancellation times when present.
- `CANCELLED` appears as **Đã hủy** and remains visible in the booking history. Other statuses remain visible using their server values until the full status contract is supplied.
- The summary counts all returned bookings and separately notes cancellations. It does not label canceled bookings as upcoming trips or occupied seats.
- The timestamps in the supplied response lack a timezone. The app formats that wall-clock date/time without assuming UTC. It does not infer a departure date or time from `tripCode` or `reservedAt`.
- Pull to refresh, manual reload, loading, empty responses, access/session errors, and retry are supported. Leaving the screen cancels the request. A `401` triggers the shared client's single token-refresh retry.
- A failed request does not display an empty success state or demo bookings. Demo sign-in retains the existing local booking flow.
- Live booking cards have no cancel or check-in action until those API contracts are supplied.

`boardingStopId` and `alightingStopId` in this list must not be treated as the trip-specific boarding/alighting IDs required by the create-booking endpoint.

The read endpoint provides a future way to inspect booking results, but successful create-booking responses, trip stops, and available seats are still needed for complete booking integration.
