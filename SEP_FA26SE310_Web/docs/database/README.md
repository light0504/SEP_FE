# SeatChain database design

## Scope

This design covers the current student mobile app, driver screens, and admin web app. It uses PostgreSQL and stores the two route directions as separate route records:

- `FU HCM → FU Tân Uyên`
- `FU Tân Uyên → FU HCM`

Stops, vehicles, drivers, trips, and users are shared across all clients. Admin is a role on a user account, not a second database. The demo screens currently use local sample data; this schema is the proposed backend foundation.

## ER diagram

```mermaid
erDiagram
    USERS ||--o{ AUTH_IDENTITIES : signs_in_with
    USERS ||--o{ USER_ROLES : has
    USERS ||--o{ EMAIL_IMPORT_BATCHES : imports
    USERS ||--o{ EMAIL_ACCESS_ALLOWLIST : provisions
    USERS o|--o| EMAIL_ACCESS_ALLOWLIST : claims
    EMAIL_IMPORT_BATCHES ||--o{ EMAIL_IMPORT_ROWS : contains
    EMAIL_ACCESS_ALLOWLIST o|--o{ EMAIL_IMPORT_ROWS : creates
    USERS ||--o| DRIVERS : driver_profile
    USERS ||--o{ BOOKINGS : makes
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ INCIDENT_REPORTS : reports
    USERS ||--o{ AUDIT_LOGS : performs
    ROUTES ||--o{ ROUTE_STOPS : contains
    STOPS ||--o{ ROUTE_STOPS : serves
    ROUTES ||--o{ TRIPS : scheduled_as
    VEHICLES ||--o{ TRIPS : assigned_to
    DRIVERS ||--o{ TRIPS : drives
    TRIPS ||--o{ BOOKINGS : has
    ROUTE_STOPS ||--o{ BOOKINGS : pickup_at
    ROUTE_STOPS ||--o{ BOOKINGS : dropoff_at
    TRIPS ||--o{ INCIDENT_REPORTS : has
    USERS ||--o{ INCIDENT_REPORTS : resolves
    USERS ||--o{ AUDIT_LOGS : actor

    USERS {
        uuid id PK
        text full_name
        text email UK
        text status
    }
    EMAIL_IMPORT_BATCHES {
        uuid id PK
        uuid imported_by FK
        text original_filename
        text status
        int total_rows
        int accepted_rows
        int rejected_rows
    }
    EMAIL_ACCESS_ALLOWLIST {
        uuid id PK
        text email_normalized UK
        text role
        text status
        uuid user_id FK
        uuid source_batch_id FK
        timestamptz expires_at
    }
    EMAIL_IMPORT_ROWS {
        uuid id PK
        uuid batch_id FK
        int row_number
        text raw_email
        text normalized_email
        text result
        text error_message
    }
    AUTH_IDENTITIES {
        uuid id PK
        uuid user_id FK
        text provider
        text provider_subject UK
    }
    USER_ROLES {
        uuid user_id PK,FK
        text role PK
    }
    DRIVERS {
        uuid user_id PK,FK
        text employee_code UK
        text license_number
    }
    VEHICLES {
        uuid id PK
        text plate_number UK
        int seat_capacity
        text status
    }
    ROUTES {
        uuid id PK
        text code UK
        text origin_name
        text destination_name
        text status
    }
    STOPS {
        uuid id PK
        text name
        text address
    }
    ROUTE_STOPS {
        uuid id PK
        uuid route_id FK
        uuid stop_id FK
        int stop_order
    }
    TRIPS {
        uuid id PK
        uuid route_id FK
        uuid vehicle_id FK
        uuid driver_id FK
        timestamptz departure_at
        smallint slot_no
        int seat_capacity
        text status
    }
    BOOKINGS {
        uuid id PK
        uuid trip_id FK
        uuid student_id FK
        uuid pickup_route_stop_id FK
        uuid dropoff_route_stop_id FK
        int seat_number
        int waitlist_position
        text status
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        text title
        timestamptz read_at
    }
    INCIDENT_REPORTS {
        uuid id PK
        uuid trip_id FK
        uuid reporter_id FK
        uuid resolved_by FK
        text category
        text severity
        text status
    }
    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        text action
        jsonb details
    }
```

## Main rules

1. **Identity and access:** `users` is the common account. `auth_identities` maps Google or FEID provider subjects to the account. `user_roles` grants `student`, `driver`, or `admin`; never trust a role supplied by the mobile/web client without checking it on the server.
2. **Routes and stops:** each travel direction is a separate `routes` record. `route_stops.stop_order` defines its stop sequence. The starter route includes FU HCM, an editable transfer stop, and FU Tân Uyên; confirm actual stop names and addresses before production.
3. **Trips:** one `trips` row is one scheduled departure. `slot_no` supports the app's 1–6 slot filter. `seat_capacity` snapshots the trip's available capacity so a vehicle replacement or later vehicle edit does not silently rewrite an already published trip. A manager can explicitly change this value.
4. **Bookings and waitlist:** one booking links a student, trip, pickup stop, and drop-off stop. `waitlisted` bookings have no seat number. Only booked/boarded records consume a seat; cancellation and no-show release it. A student may have only one active booking/waitlist entry for a trip.
5. **Capacity safety:** booking must run in a database transaction: lock the trip row (`SELECT ... FOR UPDATE`), count booked/boarded bookings, compare with `seat_capacity`, then insert a booked or waitlisted booking. When a seat is released, promote the lowest `waitlist_position` in the same transaction and assign that seat. This prevents two users from taking the final seat concurrently.
6. **Pickup/drop-off validation:** a booking must use stops from the trip's route and pickup must come before drop-off. The SQL trigger enforces both constraints.
7. **Reports and notifications:** driver reports belong to a trip and reporter, and can be assigned/resolved by a manager. Notifications are per-recipient with `read_at` for unread state. Send notifications from backend events such as booking, promotion, trip change, and incident resolution.
8. **Admin reporting:** dashboard totals should be calculated from trips, bookings, and incident reports for a selected time window; do not persist demo KPI totals as independent facts.
9. **Excel email allowlist:** an admin uploads a workbook containing email addresses and optionally a `role` column (`student` or `driver`). Omitted roles default to `student`. The backend normalizes emails (trim whitespace and lowercase), validates every row, then writes accepted entries to `email_access_allowlist` and all row outcomes to `email_import_rows`. Never grant `admin` through an imported spreadsheet; provision admin accounts through a separately controlled process.
10. **Login authorization:** after Google/FEID authentication verifies the identity email, the backend must find a matching, active, unexpired allowlist entry before creating/linking a `users` account or issuing a session. The allowlist role is then granted in `user_roles`. An unlisted, revoked, or expired email is denied access even if the identity provider authentication succeeded. Do not rely on a client-side check.
11. **Safe import behavior:** validate file type/size and required columns; reject malformed addresses and duplicate addresses within the workbook; report row number and reason. Imports should not silently reactivate revoked addresses or overwrite an existing user's role. Require an explicit admin action for those changes. Keep the original workbook out of the database; retain filename/checksum and row-level results for audit and support.

## Files

- `schema.sql` is a PostgreSQL baseline schema. Apply it once to a new development database, then evolve it with numbered migrations.

## Suggested implementation order

1. Create route and stop master data, users/roles, vehicles, and driver accounts.
2. Add trips and admin trip-management endpoints.
3. Add transactional booking, cancellation, check-in/no-show, and waitlist promotion.
4. Add notifications and driver incident-report workflows.
5. Add audit entries for admin changes and connect reports/dashboard queries.
6. Add Excel import preview/commit, row-level results, and allowlist enforcement in the Google/FEID callback.

The schema does not include payments, live GPS, or passenger-by-passenger seat allocation across overlapping route segments because those are not part of the current prototype requirements.

### Login allowlist check

After verifying the identity-provider token on the server, normalize its verified email and require this query to return an entry before issuing an app session:

```sql
SELECT id, role, user_id
FROM email_access_allowlist
WHERE email_normalized = lower(btrim($1))
  AND status = 'active'
  AND (expires_at IS NULL OR expires_at > now());
```

If the account does not exist yet, create `users`, link `auth_identities`, set `email_access_allowlist.user_id`, and grant the allowlist role in `user_roles` in one transaction. If it already exists, do not replace its profile or roles from an import row; use the allowlist to authorize access and require a separate audited admin action to change roles.
