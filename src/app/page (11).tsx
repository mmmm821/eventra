import Link from "next/link";
import { Plus, CalendarX } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventRowActions } from "@/components/organizer/event-row-actions";
import { formatEventDate, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, any> = {
  DRAFT: "outline",
  PENDING_APPROVAL: "amber",
  PUBLISHED: "green",
  REJECTED: "red",
  CANCELLED: "red",
  COMPLETED: "outline",
};

export default async function OrganizerEventsPage() {
  const session = await auth();
  const organizerId = (session!.user as any).id;

  const events = await db.event.findMany({
    where: { organizerId },
    include: { ticketTypes: true, _count: { select: { tickets: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">Your events</h1>
          <p className="text-white/50 mt-1">{events.length} event{events.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/organizer/events/new"><Plus className="h-4 w-4" /> Create Event</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CalendarX className="h-10 w-10 text-white/20 mb-4" />
          <p className="text-white font-medium">No events yet</p>
          <p className="text-sm text-white/50 mt-1">Create your first event to start selling tickets.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const revenue = event.ticketTypes.reduce((s, t) => s + t.price * t.quantitySold, 0);
            const totalCapacity = event.ticketTypes.reduce((s, t) => s + t.quantityTotal, 0);
            return (
              <div key={event.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium truncate">{event.title}</p>
                    <Badge variant={STATUS_VARIANT[event.status]}>{event.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-white/45 mt-1">
                    {formatEventDate(event.startDate)} · {event._count.tickets}/{totalCapacity || "∞"} sold · {formatINR(revenue)} revenue
                  </p>
                </div>
                <EventRowActions eventId={event.id} slug={event.slug} status={event.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
