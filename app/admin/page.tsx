"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { slotLabel } from "@/lib/rooms";

interface BookingRow {
  id: number;
  room_code: string;
  booking_date: string;
  booking_time: string;
  event_title: string;
  pax: number;
  first_name: string;
  last_name: string;
  email: string;
  telephone: string;
  organisation: string;
  country: string;
  comment: string | null;
  created_at: string;
}

function formatDate(raw: string) {
  const isoDay = raw.slice(0, 10);
  const d = new Date(`${isoDay}T00:00:00`);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const ROOM_STYLES: Record<string, string> = {
  AD7: "bg-forest/10 text-forest",
  AD9: "bg-harvest/15 text-harvest",
};

export default function AdminPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadBookings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error("Could not load bookings");
      const json = await res.json();
      setBookings(json.bookings ?? []);
      setAuthed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
      setCheckingSession(false);
    }
  }

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Login failed");
      }
      setPassword("");
      await loadBookings();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setBookings([]);
  }

  async function handleDelete(booking: BookingRow) {
    const confirmed = window.confirm(
      `Delete booking for ${booking.organisation} (${booking.room_code}, ${formatDate(booking.booking_date)} ${booking.booking_time.slice(0, 5)})? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(booking.id);
    try {
      const res = await fetch(`/api/admin/bookings?id=${booking.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Delete failed");
      }
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  function handleExport() {
    const rows = bookings.map((b) => ({
      Date: formatDate(b.booking_date),
      Time: slotLabel(b.booking_time.slice(0, 5)),
      Room: b.room_code,
      "Event / Meeting title": b.event_title,
      Pax: b.pax,
      "First name": b.first_name,
      "Last name": b.last_name,
      Email: b.email,
      Telephone: b.telephone,
      Organisation: b.organisation,
      Country: b.country,
      Comment: b.comment ?? "",
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = [
      { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 24 }, { wch: 6 },
      { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 28 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Bookings");

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `afsf-bilat-bookings-${stamp}.xlsx`);
  }

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: bookings.length,
      ad7: bookings.filter((b) => b.room_code === "AD7").length,
      ad9: bookings.filter((b) => b.room_code === "AD9").length,
      today: bookings.filter((b) => b.booking_date.slice(0, 10) === today).length,
    };
  }, [bookings]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f5f0] text-stone-500">
        Loading…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f5f0] px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white shadow-lg p-7 flex flex-col gap-4"
        >
          <div className="relative w-full h-14 mx-auto">
            <Image src="/images/afsf-logo.png" alt="AFSF 2026" fill className="object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-forest">Admin sign in</h1>
            <p className="text-xs text-stone-500 mt-1">Bilateral room bookings dashboard</p>
          </div>
          {loginError && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-ember text-sm px-3 py-2">
              {loginError}
            </div>
          )}
          <input
            type="password"
            required
            autoFocus
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          <button
            type="submit"
            disabled={loggingIn}
            className="rounded-lg bg-forest px-4 py-2.5 text-white font-semibold hover:bg-forest/90 disabled:opacity-50 transition-colors"
          >
            {loggingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <header className="bg-gradient-to-br from-forest to-[#1f4029] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl bg-white/95 p-1.5 shrink-0">
              <Image src="/images/afsf-logo.png" alt="AFSF 2026" fill className="object-contain p-0.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Bookings dashboard</h1>
              <p className="text-xs text-white/70">AFSF 2026 &middot; AD7 &amp; AD9</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={bookings.length === 0}
              className="rounded-lg bg-harvest hover:bg-harvest/90 px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              Export to Excel
            </button>
            <button
              type="button"
              onClick={loadBookings}
              className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-medium transition-colors"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-white/10 hover:bg-ember px-4 py-2 text-sm font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total bookings" value={stats.total} accent="text-stone-800" />
          <StatCard label="Today" value={stats.today} accent="text-forest" />
          <StatCard label="AD7" value={stats.ad7} accent="text-forest" />
          <StatCard label="AD9" value={stats.ad9} accent="text-harvest" />
        </div>

        {loading && <div className="text-sm text-stone-400">Loading bookings…</div>}
        {error && <div className="text-sm text-ember">{error}</div>}

        {!loading && !error && bookings.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 py-16 text-center text-stone-400">
            No bookings yet.
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-stone-500 bg-stone-50 border-b border-stone-200">
                    <th className="py-3 px-4 font-medium">Date &amp; time</th>
                    <th className="py-3 px-4 font-medium">Room</th>
                    <th className="py-3 px-4 font-medium">Event</th>
                    <th className="py-3 px-4 font-medium">Pax</th>
                    <th className="py-3 px-4 font-medium">Contact</th>
                    <th className="py-3 px-4 font-medium">Organisation</th>
                    <th className="py-3 px-4 font-medium">Country</th>
                    <th className="py-3 px-4 font-medium">Comment</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b, i) => (
                    <tr
                      key={b.id}
                      className={[
                        "border-b border-stone-100 last:border-0 align-top hover:bg-stone-50/80 transition-colors",
                        i % 2 === 1 ? "bg-stone-50/40" : "",
                      ].join(" ")}
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-stone-800">{formatDate(b.booking_date)}</div>
                        <div className="text-stone-500">{b.booking_time.slice(0, 5)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            ROOM_STYLES[b.room_code] ?? "bg-stone-100 text-stone-600",
                          ].join(" ")}
                        >
                          {b.room_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700 max-w-[10rem]">{b.event_title}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center justify-center rounded-full bg-stone-100 text-stone-700 text-xs font-semibold w-7 h-7">
                          {b.pax}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2.5">
                          <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-forest/10 text-forest text-xs font-bold w-8 h-8">
                            {initials(b.first_name, b.last_name)}
                          </span>
                          <div className="min-w-0">
                            <div className="text-stone-800 font-medium truncate">
                              {b.first_name} {b.last_name}
                            </div>
                            <div className="text-stone-500 truncate">{b.email}</div>
                            <div className="text-stone-500">{b.telephone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">{b.organisation}</td>
                      <td className="py-3.5 px-4 text-stone-600 whitespace-nowrap">{b.country}</td>
                      <td className="py-3.5 px-4 text-stone-500 max-w-[12rem]">{b.comment || "—"}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(b)}
                          disabled={deletingId === b.id}
                          className="rounded-lg border border-ember/30 text-ember px-3 py-1.5 text-xs font-semibold hover:bg-ember hover:text-white transition-colors disabled:opacity-50"
                        >
                          {deletingId === b.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4">
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
      <div className="text-xs text-stone-500 mt-1">{label}</div>
    </div>
  );
}
