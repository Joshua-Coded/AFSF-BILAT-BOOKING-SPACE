import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getRoom, SLOT_TIMES } from "@/lib/rooms";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomCode = searchParams.get("room");
  const date = searchParams.get("date");

  if (!roomCode || !date) {
    return NextResponse.json({ error: "room and date are required" }, { status: 400 });
  }

  const room = getRoom(roomCode);
  if (!room) {
    return NextResponse.json({ error: "unknown room" }, { status: 404 });
  }

  const rows = (await sql(
    `SELECT booking_time FROM bookings WHERE room_code = $1 AND booking_date = $2`,
    [roomCode, date]
  )) as { booking_time: string }[];

  const bookedTimes = new Set(rows.map((r) => r.booking_time.slice(0, 5)));

  const slots = SLOT_TIMES.map((time) => ({
    time,
    free: !bookedTimes.has(time),
  }));

  const freeCount = slots.filter((s) => s.free).length;

  return NextResponse.json({
    room: room.code,
    date,
    totalSlots: SLOT_TIMES.length,
    freeSlots: freeCount,
    bookedSlots: SLOT_TIMES.length - freeCount,
    slots,
  });
}
