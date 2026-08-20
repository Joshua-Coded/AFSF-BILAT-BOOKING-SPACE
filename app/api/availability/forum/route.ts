import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getRoom, SLOT_TIMES, FORUM_DATES } from "@/lib/rooms";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomCode = searchParams.get("room");

  if (!roomCode) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }

  const room = getRoom(roomCode);
  if (!room) {
    return NextResponse.json({ error: "unknown room" }, { status: 404 });
  }

  const rows = (await sql(
    `SELECT booking_date::text AS date, booking_time
     FROM bookings
     WHERE room_code = $1 AND booking_date = ANY($2::date[])`,
    [roomCode, FORUM_DATES]
  )) as { date: string; booking_time: string }[];

  const bookedByDate = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = bookedByDate.get(row.date) ?? new Set<string>();
    set.add(row.booking_time.slice(0, 5));
    bookedByDate.set(row.date, set);
  }

  const days = FORUM_DATES.map((date) => {
    const bookedTimes = bookedByDate.get(date) ?? new Set<string>();
    const slots = SLOT_TIMES.map((time) => ({ time, free: !bookedTimes.has(time) }));
    return {
      date,
      slots,
      freeSlots: slots.filter((s) => s.free).length,
      totalSlots: SLOT_TIMES.length,
    };
  });

  return NextResponse.json({ room: room.code, days });
}
