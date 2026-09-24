import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function assertOwnerOrAdmin(eventId: string, userId: string, role: string) {
  if (role === "ADMIN") return true;
  const event = await db.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
  return event?.organizerId === userId;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const event = await db.event.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
    include: {
      venue: true,
      ticketTypes: true,
      organizer: { select: { id: true, name: true, image: true, organizerProfile: true } },
      _count: { select: { favorites: true, tickets: true, reviews: true } },
    },
  });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (!(await assertOwnerOrAdmin(params.id, userId, role))) {
    return NextResponse.json({ error: "You don't manage this event." }, { status: 403 });
  }

  const body = await req.json();
  const allowedStatusTransitions = ["DRAFT", "PENDING_APPROVAL", "PUBLISHED", "CANCELLED"];
  const data: any = {};

  if (body.status && allowedStatusTransitions.includes(body.status)) data.status = body.status;
  if (body.title) data.title = body.title;
  if (body.description) data.description = body.description;
  if (body.bannerUrl !== undefined) data.bannerUrl = body.bannerUrl;
  if (body.cancellationPolicy !== undefined) data.cancellationPolicy = body.cancellationPolicy;

  const event = await db.event.update({ where: { id: params.id }, data });

  if (body.status === "CANCELLED") {
    // Cancelling an event cancels every confirmed ticket for it too.
    await db.ticket.updateMany({ where: { eventId: params.id, status: "CONFIRMED" }, data: { status: "CANCELLED" } });
    await db.booking.updateMany({ where: { eventId: params.id, status: "CONFIRMED" }, data: { status: "CANCELLED" } });
  }

  return NextResponse.json({ event });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (!(await assertOwnerOrAdmin(params.id, userId, role))) {
    return NextResponse.json({ error: "You don't manage this event." }, { status: 403 });
  }

  // Only draft events with no sales can be hard-deleted; anything else
  // should be cancelled instead so bookings/tickets stay auditable.
  const event = await db.event.findUnique({ where: { id: params.id }, include: { _count: { select: { tickets: true } } } });
  if (event && event._count.tickets > 0) {
    return NextResponse.json({ error: "This event has bookings — cancel it instead of deleting." }, { status: 409 });
  }

  await db.event.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
