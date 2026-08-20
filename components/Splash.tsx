"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Splash() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 1300);
    const removeTimer = setTimeout(() => setVisible(false), 1900);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={[
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 overflow-hidden bg-forest",
        leaving ? "animate-fadeOut" : "",
      ].join(" ")}
    >
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:24px_24px]" />

      <div className="relative flex flex-col items-center gap-6 animate-scaleIn">
        <div className="relative">
          <span className="absolute inset-0 -m-8 rounded-full bg-white/10 animate-pulseRing" />
          <span className="absolute inset-0 -m-4 rounded-full bg-white/10 animate-pulseRing [animation-delay:0.4s]" />
          <div className="relative w-72 h-28 sm:w-96 sm:h-32 rounded-2xl bg-white shadow-2xl p-4 flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src="/images/afsf-logo.png"
                alt="Africa Food Systems Forum 2026"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 animate-fadeIn [animation-delay:0.2s] [animation-fill-mode:backwards]">
          <p className="text-xs sm:text-sm tracking-[0.3em] uppercase text-harvest font-semibold">
            Bilateral Meeting Room Booking
          </p>
          <div className="h-0.5 w-16 rounded-full bg-gradient-to-r from-ember via-harvest to-gold" />
        </div>
      </div>
    </div>
  );
}
