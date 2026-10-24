-- SeatChain baseline schema for PostgreSQL 13+
-- Apply to a new database. Use versioned migrations for later changes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       text NOT NULL,
    email           text NOT NULL,
    phone           text,
    status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_uk ON users (lower(email));

CREATE TABLE auth_identities (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider            text NOT NULL CHECK (provider IN ('google', 'feid')),
    provider_subject    text NOT NULL,
    provider_email      text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_subject),
    UNIQUE (user_id, provider)
);

CREATE TABLE user_roles (
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        text NOT NULL CHECK (role IN ('student', 'driver', 'admin')),
    created_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, role)
);

CREATE TABLE drivers (
    user_id         uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
    employee_code  text NOT NULL UNIQUE,
    license_number text,
    hired_at        date,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number    text NOT NULL UNIQUE,
    display_name    text NOT NULL,
    seat_capacity   integer NOT NULL CHECK (seat_capacity > 0),
    status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'maintenance', 'retired')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE routes (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code                text NOT NULL UNIQUE,
    origin_name         text NOT NULL,
    destination_name    text NOT NULL,
    status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive')),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CHECK (origin_name <> destination_name)
);

CREATE TABLE stops (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    address         text,
    latitude        numeric(9, 6),
    longitude       numeric(9, 6),
    status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive')),
    created_at      timestamptz NOT NULL DEFAULT now(),
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE route_stops (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id        uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    stop_id         uuid NOT NULL REFERENCES stops(id) ON DELETE RESTRICT,
    stop_order      smallint NOT NULL CHECK (stop_order > 0),
    pickup_allowed  boolean NOT NULL DEFAULT true,
    dropoff_allowed boolean NOT NULL DEFAULT true,
    planned_offset_minutes integer CHECK (planned_offset_minutes IS NULL OR planned_offset_minutes >= 0),
    UNIQUE (route_id, stop_order),
    UNIQUE (route_id, stop_id),
    UNIQUE (id, route_id)
);

CREATE TABLE trips (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id            uuid NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
    vehicle_id          uuid NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id           uuid NOT NULL REFERENCES drivers(user_id) ON DELETE RESTRICT,
    departure_at        timestamptz NOT NULL,
    estimated_arrival_at timestamptz,
    slot_no             smallint NOT NULL CHECK (slot_no BETWEEN 1 AND 6),
    seat_capacity       integer NOT NULL CHECK (seat_capacity > 0),
    status              text NOT NULL DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled', 'boarding', 'in_progress', 'completed', 'cancelled')),
    notes               text,
    created_by          uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    CHECK (estimated_arrival_at IS NULL OR estimated_arrival_at > departure_at)
);
CREATE INDEX trips_departure_idx ON trips (departure_at);
CREATE INDEX trips_route_departure_idx ON trips (route_id, departure_at);
CREATE INDEX trips_driver_departure_idx ON trips (driver_id, departure_at);

CREATE TABLE bookings (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id                 uuid NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    student_id              uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    pickup_route_stop_id    uuid NOT NULL REFERENCES route_stops(id) ON DELETE RESTRICT,
    dropoff_route_stop_id   uuid NOT NULL REFERENCES route_stops(id) ON DELETE RESTRICT,
    status                  text NOT NULL DEFAULT 'booked'
                            CHECK (status IN ('booked', 'waitlisted', 'boarded', 'no_show', 'cancelled')),
    seat_number             smallint,
    waitlist_position       integer,
    booked_at               timestamptz NOT NULL DEFAULT now(),
    cancelled_at            timestamptz,
    checked_in_at           timestamptz,
    updated_at              timestamptz NOT NULL DEFAULT now(),
    CHECK ((status IN ('booked', 'boarded') AND seat_number IS NOT NULL)
        OR (status IN ('waitlisted', 'no_show', 'cancelled') AND seat_number IS NULL)),
    CHECK ((status = 'waitlisted' AND waitlist_position IS NOT NULL AND waitlist_position > 0)
        OR (status <> 'waitlisted' AND waitlist_position IS NULL))
);
CREATE UNIQUE INDEX bookings_one_active_per_student_trip
    ON bookings (trip_id, student_id)
    WHERE status IN ('booked', 'waitlisted', 'boarded');
CREATE UNIQUE INDEX bookings_seat_once_per_trip
    ON bookings (trip_id, seat_number)
    WHERE status IN ('booked', 'boarded');
CREATE UNIQUE INDEX bookings_waitlist_position_once_per_trip
    ON bookings (trip_id, waitlist_position)
    WHERE status = 'waitlisted';
CREATE INDEX bookings_student_status_idx ON bookings (student_id, status);
CREATE INDEX bookings_trip_status_idx ON bookings (trip_id, status);

CREATE FUNCTION validate_booking_route_stops() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    trip_route_id uuid;
    pickup_route_id uuid;
    dropoff_route_id uuid;
    pickup_order smallint;
    dropoff_order smallint;
    pickup_enabled boolean;
    dropoff_enabled boolean;
BEGIN
    SELECT route_id INTO trip_route_id FROM trips WHERE id = NEW.trip_id;
    SELECT route_id, stop_order, pickup_allowed
      INTO pickup_route_id, pickup_order, pickup_enabled
      FROM route_stops WHERE id = NEW.pickup_route_stop_id;
    SELECT route_id, stop_order, dropoff_allowed
      INTO dropoff_route_id, dropoff_order, dropoff_enabled
      FROM route_stops WHERE id = NEW.dropoff_route_stop_id;

    IF trip_route_id IS NULL OR pickup_route_id IS NULL OR dropoff_route_id IS NULL THEN
        RAISE EXCEPTION 'Trip or route stop does not exist';
    END IF;
    IF pickup_route_id <> trip_route_id OR dropoff_route_id <> trip_route_id THEN
        RAISE EXCEPTION 'Booking pickup and drop-off must belong to the trip route';
    END IF;
    IF pickup_order >= dropoff_order THEN
        RAISE EXCEPTION 'Pickup stop must occur before drop-off stop';
    END IF;
    IF NOT pickup_enabled OR NOT dropoff_enabled THEN
        RAISE EXCEPTION 'Selected route stop does not allow this pickup/drop-off action';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_validate_route_stops
BEFORE INSERT OR UPDATE OF trip_id, pickup_route_stop_id, dropoff_route_stop_id
ON bookings FOR EACH ROW EXECUTE FUNCTION validate_booking_route_stops();

CREATE TABLE notifications (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            text NOT NULL,
    title           text NOT NULL,
    body            text NOT NULL,
    related_type    text,
    related_id      uuid,
    created_at      timestamptz NOT NULL DEFAULT now(),
    read_at         timestamptz
);
CREATE INDEX notifications_user_unread_idx ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;

CREATE TABLE incident_reports (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id         uuid NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
    reporter_id     uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category        text NOT NULL CHECK (category IN ('vehicle', 'capacity', 'delay_route', 'passenger', 'other')),
    severity        text NOT NULL DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'urgent')),
    status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
    location_text   text,
    description     text NOT NULL,
    requested_capacity integer CHECK (requested_capacity IS NULL OR requested_capacity > 0),
    resolved_by     uuid REFERENCES users(id) ON DELETE SET NULL,
    resolution_note text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    resolved_at     timestamptz,
    CHECK ((status IN ('resolved', 'dismissed') AND resolved_at IS NOT NULL)
        OR (status IN ('open', 'in_review') AND resolved_at IS NULL))
);
CREATE INDEX incident_reports_status_created_idx ON incident_reports (status, created_at DESC);
CREATE INDEX incident_reports_trip_idx ON incident_reports (trip_id, created_at DESC);

CREATE TABLE audit_logs (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id        uuid REFERENCES users(id) ON DELETE SET NULL,
    action          text NOT NULL,
    entity_type     text NOT NULL,
    entity_id       uuid,
    details         jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_id, created_at DESC);

-- Admin-managed email allowlist and Excel import history.
-- Store the original workbook outside PostgreSQL if retention is required;
-- this schema stores import metadata and per-row outcomes only.
CREATE TABLE email_import_batches (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    imported_by         uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    original_filename   text NOT NULL,
    file_sha256         char(64),
    status              text NOT NULL DEFAULT 'processing'
                        CHECK (status IN ('processing', 'completed', 'completed_with_errors', 'failed')),
    total_rows          integer NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
    accepted_rows       integer NOT NULL DEFAULT 0 CHECK (accepted_rows >= 0),
    rejected_rows       integer NOT NULL DEFAULT 0 CHECK (rejected_rows >= 0),
    created_at          timestamptz NOT NULL DEFAULT now(),
    completed_at        timestamptz,
    CHECK (accepted_rows + rejected_rows <= total_rows)
);
CREATE INDEX email_import_batches_created_idx ON email_import_batches (created_at DESC);

CREATE TABLE email_access_allowlist (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email_normalized    text NOT NULL,
    role                text NOT NULL DEFAULT 'student'
                        CHECK (role IN ('student', 'driver')),
    status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'revoked')),
    user_id             uuid UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    source_batch_id     uuid REFERENCES email_import_batches(id) ON DELETE SET NULL,
    created_by          uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    expires_at          timestamptz,
    CHECK (email_normalized = lower(btrim(email_normalized))),
    CHECK (position('@' IN email_normalized) > 1),
    CHECK (expires_at IS NULL OR expires_at > created_at)
);
CREATE UNIQUE INDEX email_access_allowlist_email_uk ON email_access_allowlist (email_normalized);
CREATE INDEX email_access_allowlist_active_idx ON email_access_allowlist (email_normalized)
    WHERE status = 'active';

CREATE TABLE email_import_rows (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id            uuid NOT NULL REFERENCES email_import_batches(id) ON DELETE CASCADE,
    row_number          integer NOT NULL CHECK (row_number > 0),
    raw_email           text,
    normalized_email    text,
    requested_role      text NOT NULL DEFAULT 'student'
                        CHECK (requested_role IN ('student', 'driver')),
    result              text NOT NULL CHECK (result IN ('accepted', 'rejected')),
    error_code          text,
    error_message       text,
    allowlist_id        uuid REFERENCES email_access_allowlist(id) ON DELETE RESTRICT,
    created_at          timestamptz NOT NULL DEFAULT now(),
    UNIQUE (batch_id, row_number),
    CHECK ((result = 'accepted' AND allowlist_id IS NOT NULL AND error_code IS NULL)
        OR (result = 'rejected' AND error_code IS NOT NULL))
);
CREATE INDEX email_import_rows_batch_result_idx ON email_import_rows (batch_id, result, row_number);

-- Capacity and waitlist changes must be performed in one application transaction.
-- Lock the trip row with SELECT id, seat_capacity FROM trips WHERE id = $1 FOR UPDATE,
-- then count bookings in ('booked', 'boarded') before assigning a seat.
-- When a seat is released, promote the earliest waitlisted booking before commit.
