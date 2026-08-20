"use client";

import { useState, FormEvent } from "react";
import { ROOMS, SLOT_TIMES, slotLabel, getRoom, FORUM_START, FORUM_END } from "@/lib/rooms";
import { COUNTRIES } from "@/lib/countries";

interface BookingFormProps {
  roomCode: string;
  date: string;
  time: string | null;
  onRoomChange: (roomCode: string) => void;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onBooked: () => void;
}

export default function BookingForm({
  roomCode,
  date,
  time,
  onRoomChange,
  onDateChange,
  onTimeChange,
  onBooked,
}: BookingFormProps) {
  const [eventTitle, setEventTitle] = useState("");
  const [pax, setPax] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+221");
  const [telephone, setTelephone] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [country, setCountry] = useState("");
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const room = getRoom(roomCode);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!time) {
      setError("Please select a time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          date,
          time,
          eventTitle,
          pax: Number(pax),
          firstName,
          lastName,
          email,
          telephone: telephone ? `${countryCode} ${telephone}` : "",
          organisation,
          country,
          comment,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Booking failed");
      }

      setSuccess(
        `Booked room ${roomCode} on ${date} at ${time}. A confirmation will follow to ${email}.`
      );
      setEventTitle("");
      setPax("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setCountryCode("+221");
      setTelephone("");
      setOrganisation("");
      setCountry("");
      setComment("");
      onBooked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-200 bg-white shadow-sm p-6 flex flex-col gap-5"
    >
      <div>
        <h2 className="text-lg font-semibold text-forest">Book a bilateral meeting room</h2>
        <p className="text-sm text-stone-500 mt-1">All * fields are mandatory</p>
        <p className="text-sm text-harvest mt-1">
          Each partner is allowed a maximum of 2 hours per day (across both rooms).
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-ember text-sm px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-forest text-sm px-3 py-2">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Meeting room *">
          <select
            required
            value={roomCode}
            onChange={(e) => onRoomChange(e.target.value)}
            className="input"
          >
            {ROOMS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name} ({r.baseCapacity} pax / {r.extendedCapacity} pax max)
              </option>
            ))}
          </select>
        </Field>

        <Field label="Date *">
          <input
            required
            type="date"
            min={FORUM_START}
            max={FORUM_END}
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Time *">
          <select
            required
            value={time ?? ""}
            onChange={(e) => onTimeChange(e.target.value)}
            className="input"
          >
            <option value="" disabled>
              Select time
            </option>
            {SLOT_TIMES.map((t) => (
              <option key={t} value={t}>
                {slotLabel(t)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Number of pax *">
          <input
            required
            type="number"
            min={1}
            max={room?.extendedCapacity}
            placeholder="Number of pax"
            value={pax}
            onChange={(e) => setPax(e.target.value)}
            className="input"
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Event/Meeting title *">
            <input
              required
              type="text"
              placeholder="Event title"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="First name *">
          <input
            required
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Last name *">
          <input
            required
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Email *">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Telephone *">
          <div className="flex gap-2">
            <input
              required
              type="text"
              inputMode="tel"
              aria-label="Country calling code"
              placeholder="+221"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="input w-20 text-center"
            />
            <input
              required
              type="tel"
              placeholder="70 123 45 67"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="input flex-1"
            />
          </div>
        </Field>

        <Field label="Organisation *">
          <input
            required
            type="text"
            placeholder="Organisation name"
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Country *">
          <select
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="input"
          >
            <option value="" disabled>
              Select country
            </option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Special request or comment">
            <textarea
              placeholder="Additional comments"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="input resize-none"
            />
          </Field>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 self-start rounded-lg bg-forest px-6 py-2.5 text-white font-semibold hover:bg-forest/90 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Submitting…" : "SUBMIT"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}
