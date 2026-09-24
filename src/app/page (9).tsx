import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Pencil, Users, QrCode, Ticket, IndianRupee, RotateCcw, Percent } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ManageEventPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session!.user as any).role;
  const userId = (session!.user as any).id;

  const event = await db.event.findUnique({
    where: { id: params.id },
    include: { ticketTypes: true, venue: true },
  });
  if (!event || (event.organizerId !== userId && role !== "ADMIN")) notFound();

  const [ticketsSold, checkIns, refunds, revenueAgg] = await Promise.all([
    db.ticket.count({ where: { eventId: event.id, status: { in: ["CONFIRMED", "USED"] } } }),
    db.checkIn.count({ where: { eventId: event.id } }),
    db.ticket.count({ where: { eventId: event.id, status: "REFUNDED" } }),
    db.payment.aggregate({ where: { booking: { eventId: event.id }, status: "PAID" }, _sum: { amount: true } }),
  ]);

  const totalCapacity = event.ticketTypes.reduce((s, t) => s + t.quantityTotal, 0);
  const remaining = totalCapacity - ticketsSold;
  const attendancePct = ticketsSold > 0 ? Math.round((checkIns / ticketsSold) * 100) : 0;

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-white">{event.title}</h1>
            <Badge variant="outline">{event.status.replace("_", " ")}</Badge>
          </div>
          <p className="text-white/50 text-sm mt-1">{event.category} · {event.venue ? `${event.venue.name}, ${event.venue.city}` : "Online"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild><Link href={`/events/${event.slug}`}><Eye className="h-4 w-4" /> View</Link></Button>
          <Button variant="outline" size="sm" asChild><Link href={`/organizer/events/${event.id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button>
          <Button variant="outline" size="sm" asChild><Link href={`/organizer/events/${event.id}/attendees`}><Users className="h-4 w-4" /> Attendees</Link></Button>
          <Button size="sm" asChild><Link href="/scanner"><QrCode className="h-4 w-4" /> Scan Tickets</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat icon={Ticket} label="Tickets Sold" value={ticketsSold} />
        <Stat icon={Ticket} label="Remaining" value={totalCapacity ? remaining : "∞"} />
        <Stat icon={IndianRupee} label="Revenue" value={formatINR(revenueAgg._sum.amount ?? 0)} isText />
        <Stat icon={RotateCcw} label="Refunds" value={refunds} />
        <Stat icon={Percent} label="Attendance" value={`${attendancePct}%`} isText />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-white mb-3">Ticket types</h2>
        <div className="space-y-2.5">
          {event.ticketTypes.map((t) => (
            <Card key={t.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">{t.name}</p>
                <p className="text-xs text-white/45">{t.price === 0 ? "Free" : formatINR(t.price)}</p>
              </div>
              <p className="text-sm text-white/60">{t.quantitySold} / {t.quantityTotal} sold</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, isText }: { icon: any; label: string; value: number | string; isText?: boolean }) {
  return (
    <Card className="p-4">
      <Icon className="h-4 w-4 text-violet-400 mb-2" />
      <p className={`font-display font-semibold text-white ${isText ? "text-lg" : "text-2xl"}`}>{value}</p>
      <p className="text-xs text-white/45 mt-0.5">{label}</p>
    </Card>
  );
}
