import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModerationActions } from "@/components/admin/moderation-actions";
import { formatEventDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, any> = {
  DRAFT: "outline",
  PENDING_APPROVAL: "amber",
  PUBLISHED: "green",
  REJECTED: "red",
  CANCELLED: "red",
  COMPLETED: "outline",
};

export default async function AdminEventsPage({ searchParams }: { searchParams: { status?: string } }) {
  const events = await db.event.findMany({
    where: searchParams.status ? { status: searchParams.status as any } : {},
    include: { organizer: { select: { name: true, email: true } }, _count: { select: { tickets: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusFilters = ["PENDING_APPROVAL", "PUBLISHED", "REJECTED", "CANCELLED", "DRAFT"];

  return (
    <div className="container py-10">
      <h1 className="font-display text-2xl font-semibold text-white mb-1">Events</h1>
      <p className="text-white/50 text-sm mb-6">{events.length} event{events.length !== 1 ? "s" : ""}</p>

      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        <Link href="/admin/events">
          <Badge variant={!searchParams.status ? "violet" : "outline"} className="px-3 py-1.5 cursor-pointer">All</Badge>
        </Link>
        {statusFilters.map((s) => (
          <Link key={s} href={`/admin/events?status=${s}`}>
            <Badge variant={searchParams.status === s ? "violet" : "outline"} className="px-3 py-1.5 cursor-pointer whitespace-nowrap">
              {s.replace("_", " ")}
            </Badge>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{event.title}</p>
                <Badge variant={STATUS_VARIANT[event.status]}>{event.status.replace("_", " ")}</Badge>
              </div>
              <p className="text-xs text-white/45 mt-1">
                {event.organizer.name} · {formatEventDate(event.startDate)} · {event._count.tickets} tickets sold
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild><Link href={`/events/${event.slug}`}>View</Link></Button>
              {event.status === "PENDING_APPROVAL" && <ModerationActions eventId={event.id} />}
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-center text-white/40 py-16">No events match this filter.</p>}
      </div>
    </div>
  );
}
