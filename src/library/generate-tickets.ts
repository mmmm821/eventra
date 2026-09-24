import type { Prisma, PrismaClient } from "@prisma/client";
import { generateRef } from "@/lib/utils";
import { generateSecureToken } from "@/lib/qr/ticket-token";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/**
 * Generates one Ticket row per unit purchased, each with its own unique
 * `ticketCode` (shown to the user) and `secureToken` (embedded, signed, in
 * the QR — see lib/qr/ticket-token.ts). Called only after payment is
 * confirmed, inside the same transaction that flips the booking to
 * CONFIRMED, so a ticket can never exist for an unpaid booking.
 */
export async function generateTicketsForBooking(
  tx: Tx,
  booking: Prisma.BookingGetPayload<{ include: { items: true; event: true } }>
) {
  const tickets = [];

  // Seats reserved by this booking, oldest-selected first, so we can hand
  // them out deterministically alongside whichever ticket type matches
  // their section.
  const seats =
    booking.event.ticketMode === "SEAT_BASED"
      ? await tx.seat.findMany({ where: { heldByBookingId: booking.id, status: "SELECTED" } })
      : [];
  let seatCursor = 0;

  for (const item of booking.items) {
    for (let i = 0; i < item.quantity; i++) {
      const secureToken = generateSecureToken();
      const ticket = await tx.ticket.create({
        data: {
          ticketCode: generateRef("TKT"),
          secureToken,
          userId: booking.userId,
          eventId: booking.eventId,
          bookingId: booking.id,
          ticketTypeId: item.ticketTypeId,
          attendeeName: booking.attendeeName,
          status: "CONFIRMED",
        },
      });

      if (seatCursor < seats.length) {
        const seat = seats[seatCursor++];
        await tx.seat.update({
          where: { id: seat.id },
          data: { status: "BOOKED", ticketId: ticket.id, heldByBookingId: null },
        });
      }

      tickets.push(ticket);
    }
  }

  return tickets;
}
