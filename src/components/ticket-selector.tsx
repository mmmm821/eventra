"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Minus, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeatMap, type SeatData } from "@/components/events/seat-map";
import { formatINR } from "@/lib/utils";

type TicketType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantityTotal: number;
  quantitySold: number;
};

export function TicketSelector({
  eventId,
  ticketMode,
  ticketTypes,
  seats,
}: {
  eventId: string;
  ticketMode: "GENERAL_ADMISSION" | "SEAT_BASED";
  ticketTypes: TicketType[];
  seats: SeatData[];
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedSeats, setSelectedSeats] = useState<SeatData[]>([]);
  const [attendeeName, setAttendeeName] = useState(session?.user?.name ?? "");
  const [loading, setLoading] = useState(false);

  const total =
    ticketMode === "SEAT_BASED"
      ? selectedSeats.reduce((sum, s) => sum + s.price, 0)
      : ticketTypes.reduce((sum, t) => sum + (quantities[t.id] ?? 0) * t.price, 0);

  const itemCount =
    ticketMode === "SEAT_BASED" ? selectedSeats.length : Object.values(quantities).reduce((a, b) => a + b, 0);

  const setQty = (ticketTypeId: string, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[ticketTypeId] ?? 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [ticketTypeId]: next };
    });
  };

  const seatTicketTypeFor = (section: string) =>
    ticketTypes.find((t) => t.name.toLowerCase().includes(section === "VIP" ? "vip" : "general")) ?? ticketTypes[0];

  const bookNow = async () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=/events/${eventId}`);
      return;
    }
    if (itemCount === 0) {
      toast.error("Select at least one ticket.");
      return;
    }
    if (!attendeeName.trim()) {
      toast.error("Enter the attendee name for this booking.");
      return;
    }

    setLoading(true);
    try {
      const items =
        ticketMode === "SEAT_BASED"
          ? Object.entries(
              selectedSeats.reduce<Record<string, number>>((acc, s) => {
                const tt = seatTicketTypeFor(s.section);
                if (tt) acc[tt.id] = (acc[tt.id] ?? 0) + 1;
                return acc;
              }, {})
            ).map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }))
          : Object.entries(quantities)
              .filter(([, qty]) => qty > 0)
              .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          items,
          seatIds: ticketMode === "SEAT_BASED" ? selectedSeats.map((s) => s.id) : undefined,
          attendeeName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not create booking.");
        return;
      }
      router.push(`/checkout/${data.booking.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {ticketMode === "SEAT_BASED" ? (
        <SeatMap seats={seats} onChange={setSelectedSeats} />
      ) : (
        <div className="space-y-3">
          {ticketTypes.map((t) => {
            const remaining = t.quantityTotal - t.quantitySold;
            const soldOut = remaining <= 0;
            return (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {t.price === 0 ? "Free" : formatINR(t.price)}
                    {soldOut ? " · Sold out" : remaining <= 15 ? ` · Only ${remaining} left` : " · Available"}
                  </p>
                </div>
                {soldOut ? (
                  <span className="text-xs text-white/30">Sold out</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQty(t.id, -1, remaining)}
                      className="h-8 w-8 rounded-lg border border-white/15 text-white/70 hover:bg-white/5 flex items-center justify-center disabled:opacity-30"
                      disabled={!quantities[t.id]}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm text-white">{quantities[t.id] ?? 0}</span>
                    <button
                      onClick={() => setQty(t.id, 1, remaining)}
                      className="h-8 w-8 rounded-lg border border-white/15 text-white/70 hover:bg-white/5 flex items-center justify-center"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {itemCount > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="attendeeName">Attendee name</Label>
          <Input id="attendeeName" value={attendeeName} onChange={(e) => setAttendeeName(e.target.value)} placeholder="Name on the ticket" />
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div>
          <p className="text-xs text-white/50">{itemCount} ticket{itemCount !== 1 ? "s" : ""}</p>
          <p className="text-xl font-semibold text-white">{formatINR(total)}</p>
        </div>
        <Button size="lg" onClick={bookNow} disabled={loading || itemCount === 0}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Book Now
        </Button>
      </div>
    </div>
  );
}
