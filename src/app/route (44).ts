import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyScannedPayload } from "@/lib/qr/ticket-token";

type VerifyResult =
  | { ok: true; ticket: any }
  | { ok: false; reason: "INVALID_TICKET" | "TICKET_ALREADY_USED" | "TICKET_CANCELLED" | "WRONG_EVENT" | "TICKET_EXPIRED" | "UNAUTHORIZED" };

/**
 * Verifies and checks in a ticket. Trust nothing from the client except the
 * raw QR string: we re-derive the ticket id + token from the signed
 * payload, then require BOTH the payload signature (fast, no DB hit) AND
 * the token to match the ticket row's `secureToken` in the database before
 * doing anything. Marking a ticket USED happens inside a transaction with a
 * conditional update (`WHERE status = 'CONFIRMED'`), so two scanners
 * scanning the same QR in the same instant can never both succeed — the
 * second one simply finds zero rows to update and reports "already used".
 */
export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || !["EVENT_STAFF", "ORGANIZER", "ADMIN"].includes(role)) {
    return NextResponse.json({ ok: false, reason: "UNAUTHORIZED" satisfies VerifyResult["reason"] }, { status: 403 });
  }

  const { payload, eventId } = await req.json();
  if (!payload || !eventId) {
    return NextResponse.json({ ok: false, reason: "INVALID_TICKET" }, { status: 400 });
  }

  const decoded = verifyScannedPayload(payload);
  if (!decoded) {
    return NextResponse.json({ ok: false, reason: "INVALID_TICKET" }, { status: 400 });
  }

  // Staff must be authorized for this specific event: the organizer who
  // owns it, an admin, or explicitly added as EventStaff on it.
  if (role !== "ADMIN") {
    const event = await db.event.findUnique({ where: { id: eventId }, select: { organizerId: true } });
    const isOrganizerOwner = event?.organizerId === (session.user as any).id;
    const isAssignedStaff = isOrganizerOwner
      ? true
      : !!(await db.eventStaff.findUnique({ where: { userId_eventId: { userId: (session.user as any).id, eventId } } }));
    if (!isOrganizerOwner && !isAssignedStaff) {
      return NextResponse.json({ ok: false, reason: "UNAUTHORIZED" }, { status: 403 });
    }
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: decoded.ticketId },
        include: { event: true, ticketType: true, seat: true },
      });

      if (!ticket || ticket.secureToken !== decoded.token) {
        return { ok: false, reason: "INVALID_TICKET" } as VerifyResult;
      }
      if (ticket.eventId !== eventId) {
        return { ok: false, reason: "WRONG_EVENT" } as VerifyResult;
      }
      if (ticket.status === "CANCELLED") return { ok: false, reason: "TICKET_CANCELLED" } as VerifyResult;
      if (ticket.status === "REFUNDED") return { ok: false, reason: "TICKET_CANCELLED" } as VerifyResult;
      if (ticket.status === "EXPIRED") return { ok: false, reason: "TICKET_EXPIRED" } as VerifyResult;
      if (ticket.status === "USED") return { ok: false, reason: "TICKET_ALREADY_USED" } as VerifyResult;

      // Conditional update — see docstring above for why this prevents a
      // double check-in race between two scanners.
      const updateResult = await tx.ticket.updateMany({
        where: { id: ticket.id, status: "CONFIRMED" },
        data: { status: "USED", usedAt: new Date() },
      });
      if (updateResult.count === 0) {
        return { ok: false, reason: "TICKET_ALREADY_USED" } as VerifyResult;
      }

      const checkIn = await tx.checkIn.create({
        data: { ticketId: ticket.id, eventId: ticket.eventId, staffId: (session.user as any).id },
      });

      await tx.eventPassportStamp.upsert({
        where: { userId_eventId: { userId: ticket.userId, eventId: ticket.eventId } },
        create: { userId: ticket.userId, eventId: ticket.eventId, category: ticket.event.category },
        update: {},
      });

      return {
        ok: true,
        ticket: {
          attendeeName: ticket.attendeeName,
          ticketType: ticket.ticketType.name,
          eventTitle: ticket.event.title,
          seat: ticket.seat ? `${ticket.seat.row}${ticket.seat.number}` : null,
          entryTime: checkIn.scannedAt,
        },
      } as VerifyResult;
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch (err) {
    console.error("[POST /api/tickets/verify]", err);
    return NextResponse.json({ ok: false, reason: "INVALID_TICKET" }, { status: 500 });
  }
}
