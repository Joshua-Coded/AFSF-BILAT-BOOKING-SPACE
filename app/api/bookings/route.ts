import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getRoom, SLOT_TIMES, MAX_SLOTS_PER_PARTNER_PER_DAY, MAX_HOURS_PER_PARTNER_PER_DAY } from "@/lib/rooms";

interface BookingPayload {
  roomCode: string;
  date: string;
  time: string;
  eventTitle: string;
  pax: number;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  organisation: string;
  country: string;
  comment?: string;
}

const REQUIRED_FIELDS: (keyof BookingPayload)[] = [
  "roomCode",
  "date",
  "time",
  "eventTitle",
  "pax",
  "firstName",
  "lastName",
  "email",
  "telephone",
  "organisation",
  "country",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const rows = await sql(
    `SELECT room_code, booking_time
     FROM bookings
     WHERE booking_date = $1
     ORDER BY booking_time ASC, room_code ASC`,
    [date]
  );

  return NextResponse.json({ date, bookings: rows });
}

export async function POST(req: NextRequest) {
  let body: BookingPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  for (const field of REQUIRED_FIELDS) {
    const value = body[field];
    if (value === undefined || value === null || value === "") {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const room = getRoom(body.roomCode);
  if (!room) {
    return NextResponse.json({ error: "unknown room" }, { status: 400 });
  }

  if (!SLOT_TIMES.includes(body.time)) {
    return NextResponse.json({ error: "invalid time slot" }, { status: 400 });
  }

  const pax = Number(body.pax);
  if (!Number.isInteger(pax) || pax <= 0) {
    return NextResponse.json({ error: "pax must be a positive whole number" }, { status: 400 });
  }
  if (pax > room.extendedCapacity) {
    return NextResponse.json(
      { error: `${room.code} holds a maximum of ${room.extendedCapacity} pax` },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: "invalid email address" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (body.date < today) {
    return NextResponse.json({ error: "date cannot be in the past" }, { status: 400 });
  }

  const normalizedEmail = body.email.trim().toLowerCase();
  const existing = (await sql(
    `SELECT COUNT(*)::int AS count FROM bookings WHERE lower(email) = $1 AND booking_date = $2`,
    [normalizedEmail, body.date]
  )) as { count: number }[];

  if (existing[0].count >= MAX_SLOTS_PER_PARTNER_PER_DAY) {
    return NextResponse.json(
      {
        error: `Each partner is allowed a maximum of ${MAX_HOURS_PER_PARTNER_PER_DAY} hours per day. This email has already booked ${existing[0].count} slot(s) on ${body.date}.`,
      },
      { status: 400 }
    );
  }

  try {
    const rows = (await sql(
      `INSERT INTO bookings
        (room_code, booking_date, booking_time, event_title, pax, first_name, last_name, email, telephone, organisation, country, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, room_code, booking_date, booking_time, event_title, pax`,
      [
        room.code,
        body.date,
        body.time,
        body.eventTitle,
        pax,
        body.firstName,
        body.lastName,
        body.email,
        body.telephone,
        body.organisation,
        body.country,
        body.comment ?? null,
      ]
    )) as unknown[];

    return NextResponse.json({ booking: rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("duplicate key") || message.includes("bookings_room_code_booking_date_booking_time")) {
      return NextResponse.json(
        { error: "That time slot was just booked by someone else. Please pick another." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "failed to create booking" }, { status: 500 });
  }
}
