# Book one available seat — pending integration

> Historical Render API contract. Seat selection, booking creation, history, and cancellation now use the local [Spring Boot API](../../../../Temp_BE/SEP_FA26SE310_BE/docs/API.md). The pending notes below describe the earlier remote API only.

Recorded from the user-provided contract on 2026-10-20. The example token is not stored, and no live booking request has been sent.

## Request

```http
POST /api/student/bookings
Accept: */*
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Supplied example body:

```json
{
  "tripId": 1,
  "boardingTripStopId": 101,
  "alightingTripStopId": 103,
  "seatId": 25,
  "idempotencyKey": "8bd3e61d-753a-4c8a-b42f-1b67273b25c6"
}
```

## Identifier sources and booking flow

| Field | Source / intended use |
| --- | --- |
| `tripId` | Selected trip from trip search |
| `boardingTripStopId` | Boarding stop from that trip's stops |
| `alightingTripStopId` | Alighting stop from that same trip's stops |
| `seatId` | A seat returned as `AVAILABLE` for the same trip and boarding/alighting interval |
| `idempotencyKey` | A unique key for one booking attempt; retain it when retrying that same logical attempt |

Do not substitute a route-level `stopId` for a trip stop ID. Do not choose a seat from another trip or another interval. The sample numeric IDs and UUID must not become runtime defaults. Use a new idempotency key for a new booking intent or changed trip, interval, or seat.

## Supplied error response

```json
{
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "data": null
}
```

This response reports a server error. It does not identify a cause or establish whether a booking was committed before the error. A retry should preserve the original attempt's idempotency key; reconciliation behavior needs a booking lookup/list contract.

## Pending information

- A nonempty trip response with trip-specific stops, or an endpoint to retrieve those stops.
- The endpoint and response shape for available seats for a selected interval.
- A successful booking response, including the booking identifier and status.
- Booking lookup/idempotency semantics to reconcile an uncertain outcome. `GET /student/bookings/my` has now been supplied and integrated; see [student-my-bookings.md](student-my-bookings.md). It lists existing bookings but does not document how an uncertain create result relates to an idempotency key.

The endpoint is documented for later integration. The existing local booking demo is not wired to this API while those dependencies remain unavailable.

The user subsequently confirmed that successful responses for the failing APIs are not currently obtainable. The supplied `/student/stops?routeId=1` response contains route-level `stopId`, `stopCode`, `name`, and `address`; it does not add trip-stop IDs or available seat information. Integration remains pending backend data rather than reusing route stop IDs or sample seat IDs.
