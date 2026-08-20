"use client";

import Image from "next/image";
import { useState } from "react";
import RoomCard from "@/components/RoomCard";
import BookingForm from "@/components/BookingForm";
import BookingModal from "@/components/BookingModal";
import Splash from "@/components/Splash";
import { ROOMS, FORUM_START, FORUM_END } from "@/lib/rooms";

export default function Home() {
  const [date, setDate] = useState(FORUM_START);
  const [roomCode, setRoomCode] = useState<string>(ROOMS[0].code);
  const [time, setTime] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  function openBookingModal(selectedRoomCode: string, selectedDate: string, selectedTime: string | null) {
    setRoomCode(selectedRoomCode);
    setDate(selectedDate);
    setTime(selectedTime);
    setModalOpen(true);
  }

  function handleSelectSlot(selectedRoomCode: string, selectedDate: string, selectedTime: string) {
    openBookingModal(selectedRoomCode, selectedDate, selectedTime);
  }

  function handleRoomChange(newRoom: string) {
    setRoomCode(newRoom);
    setTime(null);
  }

  function handleDateChange(newDate: string) {
    setDate(newDate);
    setTime(null);
  }

  function handleBooked() {
    setTime(null);
    setRefreshKey((k) => k + 1);
    setModalOpen(false);
  }

  return (
    <>
      <Splash />

      <main className="min-h-screen flex flex-col">
        <header className="bg-gradient-to-br from-forest via-forest to-[#1f4029] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col items-center text-center gap-5">
            <div className="relative w-full max-w-lg h-20 bg-white/95 rounded-xl p-3">
              <Image
                src="/images/afsf-logo.png"
                alt="Africa Food Systems Forum 2026"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
                Bilateral Meeting Room Booking
              </h1>
              <p className="text-white/80 mt-2 max-w-xl mx-auto">
                Reserve room AD7 or AD9 for your bilateral meetings during the forum,
                31 August &ndash; 4 September 2026, from 08:00 to 21:00 daily.
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 bg-[#f7f5f0]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-10">
            <section className="flex flex-col gap-5">
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <h2 className="text-xl font-semibold text-stone-800">Rooms</h2>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-stone-600">Default date for booking</span>
                  <input
                    type="date"
                    min={FORUM_START}
                    max={FORUM_END}
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="input"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {ROOMS.map((room) => (
                  <RoomCard
                    key={room.code}
                    room={room}
                    refreshKey={refreshKey}
                    selectedDate={roomCode === room.code ? date : null}
                    selectedTime={roomCode === room.code ? time : null}
                    isSelectedRoom={roomCode === room.code}
                    onSelectSlot={handleSelectSlot}
                    onBookRoom={() => openBookingModal(room.code, date, null)}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <BookingModal open={modalOpen} onClose={() => setModalOpen(false)}>
        <BookingForm
          roomCode={roomCode}
          date={date}
          time={time}
          onRoomChange={handleRoomChange}
          onDateChange={handleDateChange}
          onTimeChange={setTime}
          onBooked={handleBooked}
        />
      </BookingModal>
    </>
  );
}
