"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function HoldTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const expired = remaining <= 0;

  return (
    <div className={`flex items-center gap-2 text-sm rounded-lg px-3.5 py-2 border ${expired ? "text-red-300 bg-red-500/10 border-red-500/20" : "text-amber-300 bg-amber-500/10 border-amber-500/20"}`}>
      <Clock className="h-4 w-4" />
      {expired ? "Your reservation has expired — go back and book again." : `Your tickets are held for ${minutes}:${String(seconds).padStart(2, "0")}`}
    </div>
  );
}
