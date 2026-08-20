import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await sql(
    `SELECT id, room_code, booking_date, booking_time, event_title, pax,
            first_name, last_name, email, telephone, organisation, country, comment, created_at
     FROM bookings
     ORDER BY booking_date DESC, booking_time ASC`
  );

  return NextResponse.json({ bookings: rows });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "valid id is required" }, { status: 400 });
  }

  const rows = (await sql(`DELETE FROM bookings WHERE id = $1 RETURNING id`, [Number(id)])) as {
    id: number;
  }[];

  if (rows.length === 0) {
    return NextResponse.json({ error: "booking not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, deletedId: rows[0].id });
}
