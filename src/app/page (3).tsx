import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Calendar, Clock, Users, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TicketSelector } from "@/components/events/ticket-selector";
import { SaveButton } from "@/components/events/save-button";
import { ShareButton } from "@/components/events/share-button";
import { AddToCalendarButton } from "@/components/events/calendar-button";
import { ReportEventDialog } from "@/components/events/report-dialog";
import { EventLocationMap } from "@/components/events/location-map";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { trackEventView, getRecentViewerCount } from "@/lib/events-query";
import { formatEventDate, formatEventTime, formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EventDetailsPage({ params }: { params: { eventId: string } }) {
  const session = await auth();

  const event = await db.event.findFirst({
    where: { OR: [{ id: params.eventId }, { slug: params.eventId }] },
    include: {
      venue: true,
      ticketTypes: { orderBy: { price: "asc" } },
      seats: true,
      organizer: { select: { id: true, name: true, image: true, organizerProfile: true } },
      _count: { select: { favorites: true, tickets: true, reviews: true } },
      reviews: { take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
    },
  });

  if (!event || (event.status !== "PUBLISHED" && (session?.user as any)?.id !== event.organizerId && (session?.user as any)?.role !== "ADMIN")) {
    notFound();
  }

  const userId = (session?.user as any)?.id;
  let isSaved = false;
  if (userId) {
    await trackEventView(userId, event.id);
    isSaved = !!(await db.favorite.findUnique({ where: { userId_eventId: { userId, eventId: event.id } } }));
  }
  const viewerCount = await getRecentViewerCount(event.id);

  const minPrice = event.ticketTypes.length ? Math.min(...event.ticketTypes.map((t) => t.price)) : null;
  const avgRating = event.reviews.length
    ? (event.reviews.reduce((s, r) => s + r.rating, 0) / event.reviews.length).toFixed(1)
    : null;

  return (
    <div>
      <div className="relative h-[42vh] sm:h-[52vh] w-full overflow-hidden bg-gradient-to-br from-violet-900/50 to-blue-900/40">
        {event.bannerUrl ? (
          <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/15 font-display text-5xl">EVENTRA</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B14] via-[#0A0B14]/40 to-transparent" />
        <div className="container relative h-full flex flex-col justify-end pb-8">
          <div className="flex gap-2 mb-3">
            <Badge variant="violet">{event.category}</Badge>
            <Badge variant="outline">{event.audience === "COLLEGE" ? "College Event" : "Public Event"}</Badge>
            {event.format === "ONLINE" && <Badge variant="outline">Online</Badge>}
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-semibold text-white max-w-3xl leading-tight">{event.title}</h1>
          <p className="text-white/60 text-sm mt-2">
            Hosted by {event.organizer.organizerProfile?.organization ?? event.organizer.name}
          </p>
        </div>
      </div>

      <div className="container py-10 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="flex flex-wrap gap-4">
            <InfoItem icon={Calendar} label="Date" value={formatEventDate(event.startDate)} />
            <InfoItem icon={Clock} label="Time" value={`${formatEventTime(event.startDate)} – ${formatEventTime(event.endDate)}`} />
            {event.venue && <InfoItem icon={MapPin} label="Venue" value={`${event.venue.name}, ${event.venue.city}`} />}
          </div>

          {viewerCount && (
            <div className="flex items-center gap-2 text-sm text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3.5 py-2 w-fit">
              <Users className="h-4 w-4" />
              {viewerCount} people are viewing this event
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <SaveButton eventId={event.id} initiallySaved={isSaved} />
            <ShareButton title={event.title} url={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/events/${event.slug}`} />
            <AddToCalendarButton eventId={event.slug} />
            <ReportEventDialog eventId={event.id} />
          </div>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">About this event</h2>
            <p className="text-white/65 leading-relaxed whitespace-pre-line">{event.description}</p>
            {event.ageRestriction && (
              <div className="flex items-center gap-2 mt-4 text-sm text-white/50">
                <ShieldAlert className="h-4 w-4" /> {event.ageRestriction}
              </div>
            )}
          </section>

          {event.venue && event.format === "OFFLINE" && (
            <section>
              <h2 className="font-display text-xl font-semibold text-white mb-3">Location</h2>
              <EventLocationMap venueName={event.venue.name} city={event.venue.city} address={event.venue.address} lat={event.venue.latitude} lng={event.venue.longitude} />
            </section>
          )}

          {(event.cancellationPolicy || event.terms) && (
            <section className="space-y-4">
              {event.cancellationPolicy && (
                <div>
                  <h3 className="text-sm font-medium text-white/80 mb-1.5">Cancellation policy</h3>
                  <p className="text-sm text-white/50">{event.cancellationPolicy}</p>
                </div>
              )}
              {event.terms && (
                <div>
                  <h3 className="text-sm font-medium text-white/80 mb-1.5">Terms</h3>
                  <p className="text-sm text-white/50">{event.terms}</p>
                </div>
              )}
            </section>
          )}

          {event.reviews.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold text-white mb-3">
                Reviews {avgRating && <span className="text-white/40 font-normal text-base">· {avgRating} avg</span>}
              </h2>
              <div className="space-y-3">
                {event.reviews.map((r) => (
                  <Card key={r.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{r.user.name}</p>
                      <span className="text-xs text-amber-400">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    </div>
                    {r.comment && <p className="text-sm text-white/55 mt-1.5">{r.comment}</p>}
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <p className="text-xs text-white/40 mb-3">
              {minPrice === null || minPrice === 0 ? "Free entry" : `Starting from ${formatINR(minPrice)}`}
            </p>
            <TicketSelector
              eventId={event.id}
              ticketMode={event.ticketMode}
              ticketTypes={event.ticketTypes}
              seats={event.seats as any}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <Icon className="h-4 w-4 text-violet-400" />
      <div>
        <p className="text-[11px] text-white/40">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}
