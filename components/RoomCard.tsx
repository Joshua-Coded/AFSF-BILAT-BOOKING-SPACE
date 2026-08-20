"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { FORUM_DATES, SLOT_TIMES, slotLabel, type Room } from "@/lib/rooms";

const POLL_INTERVAL_MS = 15000;

interface DaySlots {
  date: string;
  slots: { time: string; free: boolean }[];
  freeSlots: number;
  totalSlots: number;
}

interface ForumAvailabilityResponse {
  room: string;
  days: DaySlots[];
}

interface RoomCardProps {
  room: Room;
  refreshKey: number;
  selectedDate: string | null;
  selectedTime: string | null;
  isSelectedRoom: boolean;
  onSelectSlot: (roomCode: string, date: string, time: string) => void;
  onBookRoom: () => void;
}

function formatDayHeader(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return {
    day: d.getDate(),
    month: d.toLocaleDateString(undefined, { month: "short" }),
  };
}

export default function RoomCard({
  room,
  refreshKey,
  selectedDate,
  selectedTime,
  isSelectedRoom,
  onSelectSlot,
  onBookRoom,
}: RoomCardProps) {
  const [data, setData] = useState<ForumAvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(
    (showSpinner: boolean, signal?: AbortSignal) => {
      if (showSpinner) setLoading(true);
      setError(null);

      return fetch(`/api/availability/forum?room=${room.code}`, { signal })
        .then((res) => {
          if (!res.ok) throw new Error("Could not load availability");
          return res.json();
        })
        .then((json) => setData(json))
        .catch((err) => {
          if (err.name !== "AbortError") setError(err.message);
        })
        .finally(() => {
          if (showSpinner) setLoading(false);
        });
    },
    [room.code]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchAvailability(true, controller.signal);

    const interval = setInterval(() => {
      fetchAvailability(false);
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchAvailability, refreshKey]);

  const totalFree = data?.days.reduce((sum, d) => sum + d.freeSlots, 0) ?? 0;
  const totalSlots = data?.days.reduce((sum, d) => sum + d.totalSlots, 0) ?? 0;
  const pct = totalSlots > 0 ? Math.round((totalFree / totalSlots) * 100) : 0;
  const isFull = !loading && !error && totalFree === 0;

  return (
    <div className="group rounded-2xl border border-stone-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative w-full aspect-[3/2] overflow-hidden">
        <Image
          src={room.image}
          alt={`Room ${room.name}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
        <div className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-forest shadow">
          Room {room.name}
        </div>
        {!loading && !error && (
          <div
            className={[
              "absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold shadow",
              isFull ? "bg-ember text-white" : "bg-harvest text-white",
            ].join(" ")}
          >
            {isFull ? "Fully booked" : `${totalFree}/${totalSlots} free`}
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 text-white text-sm font-medium drop-shadow">
          {room.baseCapacity} pax standard &middot; {room.extendedCapacity} pax max
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        <p className="text-sm text-stone-600 leading-snug">{room.note}</p>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-stone-600">Availability, 31 Aug &ndash; 4 Sep</span>
            {!loading && !error && (
              <span className="font-semibold text-forest">
                {totalFree}/{totalSlots} slots free
              </span>
            )}
          </div>
          <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full bg-forest transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {loading && <div className="text-sm text-stone-400">Loading availability…</div>}
        {error && <div className="text-sm text-ember">{error}</div>}

        {data && (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-xs border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="text-left text-stone-400 font-medium pr-1 w-16">Time</th>
                  {data.days.map((d) => {
                    const { day, month } = formatDayHeader(d.date);
                    return (
                      <th key={d.date} className="text-stone-500 font-medium">
                        <div className="leading-none">{day}</div>
                        <div className="text-[10px] text-stone-400 font-normal">{month}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {SLOT_TIMES.map((time) => (
                  <tr key={time}>
                    <td className="text-stone-500 whitespace-nowrap pr-1">{slotLabel(time)}</td>
                    {FORUM_DATES.map((date) => {
                      const day = data.days.find((d) => d.date === date);
                      const slot = day?.slots.find((s) => s.time === time);
                      const free = slot?.free ?? false;
                      const isChosen =
                        isSelectedRoom && selectedDate === date && selectedTime === time;
                      return (
                        <td key={date}>
                          <button
                            type="button"
                            disabled={!free}
                            onClick={() => onSelectSlot(room.code, date, time)}
                            className={[
                              "w-full h-7 rounded-md border flex items-center justify-center transition-colors",
                              !free
                                ? "cursor-not-allowed border-ember/20 bg-ember/10"
                                : isChosen
                                  ? "border-forest bg-forest"
                                  : "border-forest/25 bg-forest/5 hover:border-forest hover:bg-forest/10",
                            ].join(" ")}
                            aria-label={`${date} ${slotLabel(time)} ${free ? "available" : "booked"}`}
                            title={`${date} ${slotLabel(time)} ${free ? "available" : "booked"}`}
                          >
                            {!free && <span className="text-ember text-xs leading-none">&times;</span>}
                            {free && isChosen && <span className="text-white text-xs leading-none">&#10003;</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-stone-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-forest/25 bg-forest/5" /> Free
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-forest" /> Selected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-ember/20 bg-ember/10 text-ember text-[8px] flex items-center justify-center leading-none">&times;</span> Booked
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onBookRoom}
          className="mt-auto rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest/90 transition-colors"
        >
          Book this room
        </button>
      </div>
    </div>
  );
}
