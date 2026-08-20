"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { slotLabel, type Room } from "@/lib/rooms";

const POLL_INTERVAL_MS = 15000;

interface Slot {
  time: string;
  free: boolean;
}

interface AvailabilityResponse {
  totalSlots: number;
  freeSlots: number;
  bookedSlots: number;
  slots: Slot[];
}

interface RoomCardProps {
  room: Room;
  date: string;
  refreshKey: number;
  selectedTime: string | null;
  isSelectedRoom: boolean;
  onSelectSlot: (roomCode: string, time: string) => void;
  onBookRoom: () => void;
}

export default function RoomCard({
  room,
  date,
  refreshKey,
  selectedTime,
  isSelectedRoom,
  onSelectSlot,
  onBookRoom,
}: RoomCardProps) {
  const [data, setData] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(
    (showSpinner: boolean, signal?: AbortSignal) => {
      if (showSpinner) setLoading(true);
      setError(null);

      return fetch(`/api/availability?room=${room.code}&date=${date}`, { signal })
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
    [room.code, date]
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

  const freeSlots = data?.freeSlots ?? 0;
  const totalSlots = data?.totalSlots ?? 0;
  const pct = totalSlots > 0 ? Math.round((freeSlots / totalSlots) * 100) : 0;
  const isFull = !loading && !error && freeSlots === 0;

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
            {isFull ? "Fully booked" : `${freeSlots}/${totalSlots} free`}
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
            <span className="text-stone-600">Availability on {date}</span>
            {!loading && !error && (
              <span className="font-semibold text-forest">
                {freeSlots}/{totalSlots} slots free
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.slots.map((slot) => {
              const isChosen = isSelectedRoom && selectedTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.free}
                  onClick={() => onSelectSlot(room.code, slot.time)}
                  className={[
                    "rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                    !slot.free
                      ? "cursor-not-allowed border-stone-100 bg-stone-50 text-stone-300 line-through"
                      : isChosen
                        ? "border-forest bg-forest text-white"
                        : "border-stone-200 text-stone-700 hover:border-forest hover:text-forest",
                  ].join(" ")}
                >
                  {slotLabel(slot.time)}
                </button>
              );
            })}
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
