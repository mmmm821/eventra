"use client";

import { useMemo, useState } from "react";
import { cn, formatINR } from "@/lib/utils";

export type SeatData = {
  id: string;
  row: string;
  number: number;
  section: string;
  status: "AVAILABLE" | "SELECTED" | "BOOKED" | "BLOCKED" | "VIP";
  price: number;
};

export function SeatMap({
  seats,
  maxSeats = 8,
  onChange,
}: {
  seats: SeatData[];
  maxSeats?: number;
  onChange: (selected: SeatData[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    const byRow = new Map<string, SeatData[]>();
    for (const seat of seats) {
      if (!byRow.has(seat.row)) byRow.set(seat.row, []);
      byRow.get(seat.row)!.push(seat);
    }
    return Array.from(byRow.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([row, list]) => [row, list.sort((a, b) => a.number - b.number)] as const);
  }, [seats]);

  const toggle = (seat: SeatData) => {
    if (seat.status === "BOOKED" || seat.status === "BLOCKED") return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) {
        next.delete(seat.id);
      } else {
        if (next.size >= maxSeats) return prev;
        next.add(seat.id);
      }
      const selectedSeats = seats.filter((s) => next.has(s.id));
      onChange(selectedSeats);
      return next;
    });
  };

  const seatState = (seat: SeatData) => (selectedIds.has(seat.id) ? "SELECTED" : seat.status);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-8">
      <div className="mx-auto mb-8 w-full max-w-md">
        <div className="h-2 rounded-full bg-gradient-to-r from-violet-600/60 via-blue-600/60 to-violet-600/60" />
        <p className="text-center text-xs tracking-wide text-white/40 mt-2">Stage</p>
      </div>

      <div className="flex flex-col items-center gap-2 overflow-x-auto pb-2">
        {rows.map(([row, rowSeats]) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-5 text-xs text-white/40 text-right">{row}</span>
            <div className="flex gap-1.5">
              {rowSeats.map((seat) => (
                <button
                  key={seat.id}
                  type="button"
                  disabled={seat.status === "BOOKED" || seat.status === "BLOCKED"}
                  onClick={() => toggle(seat)}
                  title={`${seat.row}${seat.number} · ${formatINR(seat.price)}`}
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 rounded-md text-[10px] flex items-center justify-center border transition-colors",
                    seatState(seat) === "AVAILABLE" && "border-white/15 bg-white/[0.04] text-white/50 hover:border-violet-400 hover:text-white",
                    seatState(seat) === "VIP" && "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400",
                    seatState(seat) === "SELECTED" && "border-violet-500 bg-violet-600 text-white",
                    (seatState(seat) === "BOOKED" || seatState(seat) === "BLOCKED") && "border-white/5 bg-white/[0.02] text-white/15 cursor-not-allowed"
                  )}
                >
                  {seat.number}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs text-white/50">
        <LegendItem className="border-white/15 bg-white/[0.04]" label="Available" />
        <LegendItem className="border-violet-500 bg-violet-600" label="Selected" />
        <LegendItem className="border-white/5 bg-white/[0.02]" label="Booked" />
        <LegendItem className="border-amber-500/40 bg-amber-500/10" label="VIP" />
      </div>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-3.5 w-3.5 rounded border", className)} />
      {label}
    </div>
  );
}
