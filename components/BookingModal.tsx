"use client";

import { useEffect } from "react";

export default function BookingModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-6">
      <div
        className="fixed inset-0 bg-stone-900/50 animate-fadeIn"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-2xl my-6 animate-scaleIn">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-600 shadow-lg hover:text-ember transition-colors"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
