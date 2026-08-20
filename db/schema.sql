CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  room_code TEXT NOT NULL CHECK (room_code IN ('AD7', 'AD9')),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  event_title TEXT NOT NULL,
  pax INTEGER NOT NULL CHECK (pax > 0),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  telephone TEXT NOT NULL,
  organisation TEXT NOT NULL,
  country TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_code, booking_date, booking_time)
);

CREATE INDEX IF NOT EXISTS bookings_room_date_idx ON bookings (room_code, booking_date);
