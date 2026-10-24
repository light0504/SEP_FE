# Student trips API — pending integration

> Historical Render API contract. The app now uses the local Spring Boot backend; live trip search is implemented against [its API contract](../../../../Temp_BE/SEP_FA26SE310_BE/docs/API.md). The pending notes below describe the earlier remote API only.

Recorded from the user-provided API contract on 2026-10-20. No live request was made to verify this response.

## Request

`GET https://capstoneproject-be-6cn5.onrender.com/api/student/trips`

Headers:

```http
Accept: application/json
Authorization: Bearer <accessToken>
```

| Query parameter | Required | Format / purpose |
| --- | --- | --- |
| `date` | Yes | Date in `YYYY-MM-DD` format, for example `2026-10-20` |
| `routeId` | No | Route identifier |
| `boardingTripStopId` | No | Boarding trip-stop identifier |
| `alightingTripStopId` | No | Alighting trip-stop identifier |

Minimum request:

```http
GET /api/student/trips?date=2026-10-20
```

Example provided by the user:

```http
GET /api/student/trips?date=2026-10-20&routeId=1&boardingTripStopId=1&alightingTripStopId=1
```

## Supplied response

```json
{
  "statusCode": 200,
  "message": "Student trips retrieved successfully",
  "data": []
}
```

The supplied response contains no trips. An empty `data` array is a successful empty result, not a request failure. The schema of individual trip objects is not yet known.

## Integration notes

- Saved for later integration; the search screen does not call this endpoint yet.
- Only `date` is required by this API. Route and stop filters must be omitted when unselected.
- The current screen requires route, origin, destination, and date; align validation with the API when implementing live search.
- The booking contract clarifies that boarding/alighting trip-stop IDs must come from that trip's stops; they are not interchangeable with route-level `stopId` values. A mapping for the search filters is still needed. See [student-bookings.md](student-bookings.md).
- A `slot` query parameter has not been provided for this endpoint.
- Await a nonempty response or a documented trip-object schema before mapping results to trip cards and booking actions.
