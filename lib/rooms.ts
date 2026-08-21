export type RoomCode = "AD7" | "AD9";

export interface Room {
  code: RoomCode;
  name: string;
  image: string;
  baseCapacity: number;
  extendedCapacity: number;
  note: string;
}

export const ROOMS: Room[] = [
  {
    code: "AD7",
    name: "AD7",
    image: "/images/ad7.jpeg",
    baseCapacity: 15,
    extendedCapacity: 30,
    note: "15 pax around the fixed table, up to 30 pax with an extra layer of chairs. The table is fixed and does not allow a different layout.",
  },
  {
    code: "AD9",
    name: "AD9",
    image: "/images/ad9.jpeg",
    baseCapacity: 10,
    extendedCapacity: 20,
    note: "10 pax around the fixed table, up to 20 pax with an extra layer of chairs on both sides. The table is fixed and does not allow a different layout.",
  },
];

export function getRoom(code: string): Room | undefined {
  return ROOMS.find((r) => r.code === code);
}

// Bilateral meeting slot grid: 2-hour blocks, 08:00 - 20:00 start times (venue open 8am-9pm).
// The last slot (20:00) is capped at closing time, 21:00, so the full 8am-9pm window is bookable.
export const SLOT_TIMES = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];

export const SLOT_DURATION_HOURS = 2;
export const VENUE_CLOSE_HOUR = 21;
export const MAX_HOURS_PER_PARTNER_PER_DAY = 2;
export const MAX_SLOTS_PER_PARTNER_PER_DAY =
  MAX_HOURS_PER_PARTNER_PER_DAY / SLOT_DURATION_HOURS;

export function slotEndTime(start: string): string {
  const [h] = start.split(":").map(Number);
  const endHour = Math.min(h + SLOT_DURATION_HOURS, VENUE_CLOSE_HOUR);
  return `${String(endHour).padStart(2, "0")}:00`;
}

export function slotLabel(start: string): string {
  return `${start}–${slotEndTime(start)}`;
}

// Africa Food Systems Forum 2026 runs 31 August - 4 September 2026.
export const FORUM_DATES = [
  "2026-08-31",
  "2026-09-01",
  "2026-09-02",
  "2026-09-03",
  "2026-09-04",
];

export const FORUM_START = FORUM_DATES[0];
export const FORUM_END = FORUM_DATES[FORUM_DATES.length - 1];
