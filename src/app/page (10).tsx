import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { AttendeeTable } from "@/components/organizer/attendee-table";

export const dynamic = "force-dynamic";

export default async function AttendeesPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session!.user as any).role;
  const userId = (session!.user as any).id;

  const event = await db.event.findUnique({ where: { id: params.id }, select: { id: true, title: true, organizerId: true } });
  if (!event || (event.organizerId !== userId && role !== "ADMIN")) notFound();

  const tickets = await db.ticket.findMany({
    where: { eventId: event.id },
    include: { user: { select: { email: true } }, ticketType: true, booking: { include: { payment: true } }, checkIn: true },
    orderBy: { createdAt: "desc" },
  });

  const attendees = tickets.map((t) => ({
    id: t.id,
    attendeeName: t.attendeeName,
    userEmail: t.user.email,
    ticketType: t.ticketType.name,
    ticketCode: t.ticketCode,
    paymentStatus: t.booking.payment?.status ?? "N/A",
    ticketStatus: t.status,
    checkedIn: !!t.checkIn,
  }));

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">Attendees</h1>
          <p className="text-white/50 text-sm mt-1">{event.title} · {attendees.length} ticket{attendees.length !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="outline" asChild>
          <a href={`/api/events/${event.id}/attendees?format=csv`} download>
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </Button>
      </div>

      <AttendeeTable attendees={attendees} />
    </div>
  );
}
