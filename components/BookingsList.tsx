"use client";

import { useCallback, useEffect, useState } from "react";
import { slotLabel } from "@/lib/rooms";

const POLL_INTERVAL_MS = 15000;

interface BookingRow {
  room_code: string;
  booking_time: string;
}

export default function BookingsList({ date, refreshKey }: { date: string; refreshKey: number }) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(
    (showSpinner: boolean, signal?: AbortSignal) => {
      if (showSpinner) setLoading(true);
      setError(null);

      return fetch(`/api/bookings?date=${date}`, { signal })
        .then((res) => {
          if (!res.ok) throw new Error("Could not load bookings");
          return res.json();
        })
        .then((json) => setBookings(json.bookings ?? []))
        .catch((err) => {
          if (err.name !== "AbortError") setError(err.message);
        })
        .finally(() => {
          if (showSpinner) setLoading(false);
        });
    },
    [date]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchBookings(true, controller.signal);

    const interval = setInterval(() => {
      fetchBookings(false);
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchBookings, refreshKey]);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white shadow-sm p-6">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-stone-800">Booked slots on {date}</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            Meeting details are private to each partner &mdash; only room and time are shown.
          </p>
        </div>
        {!loading && !error && (
          <span className="text-sm font-medium text-stone-500">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {loading && <div className="text-sm text-stone-400">Loading bookings…</div>}
      {error && <div className="text-sm text-ember">{error}</div>}

      {!loading && !error && bookings.length === 0 && (
        <div className="text-sm text-stone-500">No bookings yet for this date.</div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {bookings.map((b, i) => (
            <span
              key={`${b.room_code}-${b.booking_time}-${i}`}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm"
            >
              <span className="rounded-full bg-forest/10 text-forest px-2 py-0.5 text-xs font-semibold">
                {b.room_code}
              </span>
              <span className="font-medium text-stone-700">{slotLabel(b.booking_time.slice(0, 5))}</span>
              <span className="text-stone-400">&middot; Booked</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
