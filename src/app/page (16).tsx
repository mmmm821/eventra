import Link from "next/link";
import Image from "next/image";
import { Ticket as TicketIcon, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import { EventPassport } from "@/components/tickets/event-passport";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, any> = {
  CONFIRMED: "green",
  USED: "outline",
  CANCELLED: "red",
  REFUNDED: "amber",
  EXPIRED: "outline",
};

export default async function TicketsPage() {
  const session = await auth();
  const userId = (session!.user as any).id;

  const [tickets, stamps] = await Promise.all([
    db.ticket.findMany({
      where: { userId },
      include: { event: { include: { venue: true } }, ticketType: true },
      orderBy: { event: { startDate: "desc" } },
    }),
    db.eventPassportStamp.findMany({ where: { userId } }),
  ]);

  return (
    <div className="container py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">My Tickets</h1>
      <p className="text-white/50 mt-1">Everything you&rsquo;ve booked, in one wallet.</p>

      <EventPassport stamps={stamps} />

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <TicketIcon className="h-10 w-10 text-white/20 mb-4" />
          <p className="text-white font-medium">No tickets yet</p>
          <p className="text-sm text-white/50 mt-1">Book your first event to see it here.</p>
          <Link href="/events" className="mt-4 text-sm text-violet-300 hover:text-violet-200">Explore events</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/tickets/${t.id}`}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-white/20 transition-colors"
            >
              <div className="relative h-20 w-24 rounded-lg overflow-hidden bg-white/5 shrink-0">
                {t.event.bannerUrl && <Image src={t.event.bannerUrl} alt="" fill className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white font-medium truncate">{t.event.title}</p>
                  <Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  {formatEventDate(t.event.startDate)} · {formatEventTime(t.event.startDate)}
                </p>
                {t.event.venue && <p className="text-xs text-white/40 truncate">{t.event.venue.name}, {t.event.venue.city}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-white/40">{t.ticketType.name} · {t.ticketCode}</span>
                  <ChevronRight className="h-4 w-4 text-white/30" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
