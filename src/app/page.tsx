import Link from "next/link";
import Image from "next/image";
import { Ticket, Heart, Compass, Sparkles, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRecommendedEvents } from "@/lib/recommendations/engine";
import { EventCarousel } from "@/components/events/event-carousel";
import { toCardData } from "@/lib/events-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatEventDate, formatEventTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session!.user as any).id;
  const firstName = session!.user!.name?.split(" ")[0];

  const [upcomingTickets, favorites, recentBookings, recommended] = await Promise.all([
    db.ticket.findMany({
      where: { userId, status: "CONFIRMED", event: { startDate: { gte: new Date() } } },
      include: { event: { include: { venue: true } }, ticketType: true },
      orderBy: { event: { startDate: "asc" } },
      take: 5,
    }),
    db.favorite.findMany({
      where: { userId },
      include: { event: { include: { venue: true, ticketTypes: true, _count: { select: { tickets: true, favorites: true } } } } },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    db.booking.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getRecommendedEvents(userId, 8),
  ]);

  const nextTicket = upcomingTickets[0];
  const recommendedCards = recommended.map((e) => toCardData(e as any));
  const favoriteCards = favorites.map((f) => toCardData(f.event as any));

  return (
    <div className="container py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">{greeting()}, {firstName}</h1>
      <p className="text-white/50 mt-1">Here&rsquo;s what&rsquo;s coming up for you.</p>

      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        <QuickAction href="/events" icon={Compass} label="Explore Events" />
        <QuickAction href="/tickets" icon={Ticket} label="My Tickets" />
        <QuickAction href="/dashboard#saved" icon={Heart} label="Saved Events" />
      </div>

      {nextTicket && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold text-white mb-3">Next up</h2>
          <Card className="p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <div className="flex gap-4 items-center">
              <div className="relative h-16 w-24 rounded-lg overflow-hidden bg-white/5 shrink-0">
                {nextTicket.event.bannerUrl && <Image src={nextTicket.event.bannerUrl} alt="" fill className="object-cover" />}
              </div>
              <div>
                <p className="text-white font-medium">{nextTicket.event.title}</p>
                <p className="text-sm text-white/50">
                  {formatEventDate(nextTicket.event.startDate)} · {formatEventTime(nextTicket.event.startDate)}
                  {nextTicket.event.venue ? ` · ${nextTicket.event.venue.name}` : ""}
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href={`/tickets/${nextTicket.id}`}>View ticket <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </Card>
        </section>
      )}

      {upcomingTickets.length > 1 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-white mb-3">Upcoming events</h2>
          <div className="space-y-2.5">
            {upcomingTickets.slice(1).map((t) => (
              <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 hover:border-white/20 transition-colors">
                <div>
                  <p className="text-sm text-white">{t.event.title}</p>
                  <p className="text-xs text-white/45">{formatEventDate(t.event.startDate)}</p>
                </div>
                <span className="text-xs text-white/40">{t.ticketType.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentBookings.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-white mb-3">Recent bookings</h2>
          <div className="space-y-2">
            {recentBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm">
                <span className="text-white/70">{b.event.title}</span>
                <span className="text-white/40">{b.bookingRef} · {b.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendedCards.length > 0 && (
        <div className="-mx-5 mt-6">
          <EventCarousel title="Recommended for you" subtitle="Based on what you've booked and saved" events={recommendedCards} />
        </div>
      )}

      {favoriteCards.length > 0 && (
        <div id="saved" className="-mx-5">
          <EventCarousel title="Saved events" events={favoriteCards} seeAllHref="/tickets" />
        </div>
      )}
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors">
      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5 text-white" />
      </div>
      <span className="text-sm font-medium text-white">{label}</span>
    </Link>
  );
}
