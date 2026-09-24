import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildQrPayload, renderQrDataUrl } from "@/lib/qr/ticket-token";
import { formatEventDate, formatEventTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TicketActions } from "@/components/tickets/ticket-actions";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, any> = {
  CONFIRMED: "green",
  USED: "outline",
  CANCELLED: "red",
  REFUNDED: "amber",
  EXPIRED: "outline",
};

export default async function DigitalTicketPage({ params }: { params: { ticketId: string } }) {
  const session = await auth();
  if (!session?.user) notFound();

  const ticket = await db.ticket.findUnique({
    where: { id: params.ticketId },
    include: { event: { include: { venue: true } }, ticketType: true, booking: true, seat: true },
  });

  if (!ticket) notFound();
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const isOwner = ticket.userId === userId;
  const isAdmin = role === "ADMIN";
  const isEventOrganizer = role === "ORGANIZER" && ticket.event.organizerId === userId;
  const isAssignedStaff =
    role === "EVENT_STAFF" && !!(await db.eventStaff.findUnique({ where: { userId_eventId: { userId, eventId: ticket.eventId } } }));
  if (!isOwner && !isAdmin && !isEventOrganizer && !isAssignedStaff) notFound();

  const qrPayload = buildQrPayload(ticket.id, ticket.secureToken);
  const qrDataUrl = await renderQrDataUrl(qrPayload);

  return (
    <div className="container max-w-md py-10">
      <div className="rounded-3xl overflow-hidden border border-white/10 bg-[#12131F]">
        <div className="relative h-40">
          {ticket.event.bannerUrl ? (
            <Image src={ticket.event.bannerUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-800 to-blue-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#12131F] via-black/20 to-transparent" />
          <span className="absolute top-4 left-5 font-display font-bold text-white tracking-tight">EVENTRA</span>
          <Badge variant={STATUS_VARIANT[ticket.status]} className="absolute top-4 right-5">{ticket.status}</Badge>
        </div>

        <div className="px-6 pt-5">
          <h1 className="font-display text-xl font-semibold text-white">{ticket.event.title}</h1>
          <p className="text-sm text-white/50 mt-1">
            {formatEventDate(ticket.event.startDate)} · {formatEventTime(ticket.event.startDate)}
          </p>
          {ticket.event.venue && <p className="text-sm text-white/50">{ticket.event.venue.name}, {ticket.event.venue.city}</p>}
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-4 text-sm">
          <Field label="Attendee" value={ticket.attendeeName} />
          <Field label="Ticket" value={ticket.seat ? `${ticket.ticketType.name} · Seat ${ticket.seat.row}${ticket.seat.number}` : ticket.ticketType.name} />
          <Field label="Booking ID" value={ticket.ticketCode} />
          <Field label="Booked" value={new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(ticket.createdAt)} />
        </div>

        <div className="relative py-3">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-[#0A0B14]" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-6 w-6 rounded-full bg-[#0A0B14]" />
          <div className="border-t border-dashed border-white/15" />
        </div>

        <div className="flex flex-col items-center px-6 pb-8">
          {ticket.status === "CONFIRMED" ? (
            <div className="bg-white p-3 rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Ticket QR code" width={220} height={220} />
            </div>
          ) : (
            <div className="h-[220px] w-[220px] rounded-2xl bg-white/5 flex items-center justify-center text-white/30 text-sm text-center px-6">
              QR not available — ticket is {ticket.status.toLowerCase()}
            </div>
          )}
          <p className="text-xs text-white/35 mt-4 text-center">Show this QR code at entry. Each ticket can only be scanned once.</p>
        </div>
      </div>

      <div className="mt-5">
        <TicketActions eventSlug={ticket.event.slug} title={ticket.event.title} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-white/40">{label}</p>
      <p className="text-white mt-0.5">{value}</p>
    </div>
  );
}
