import { db } from "@/lib/db";
import { generateRef } from "@/lib/utils";
import type { CreateOrderInput } from "@/lib/validation/schemas";

export class BookingError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const HOLD_MINUTES = 15;

/**
 * Creates a PENDING booking and atomically reserves inventory so two
 * simultaneous buyers can never both confirm the last ticket.
 *
 * How the "no overselling" guarantee works:
 *   For each ticket type we run an `UPDATE ... WHERE quantitySold <= total - qty`
 *   inside a single transaction. Postgres takes a row lock for the duration
 *   of that UPDATE, so if two requests race for the last seat, the second
 *   one's WHERE clause simply matches zero rows (because the first request's
 *   write already landed) and we roll the whole transaction back with a
 *   SOLD_OUT error — no read-then-write gap for a race to slip through.
 *
 * The reservation is a *hold*, not a confirmation: `expiresAt` gives the
 * buyer 15 minutes to pay. A scheduled job (see
 * `lib/bookings/expire-bookings.ts`) releases holds that time out, putting
 * the inventory back for the next buyer.
 */
export async function createPendingBooking(userId: string, input: CreateOrderInput) {
  return db.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: input.eventId },
      include: { ticketTypes: true },
    });
    if (!event || event.status !== "PUBLISHED") {
      throw new BookingError("EVENT_UNAVAILABLE", "This event isn't open for booking.");
    }

    let subtotal = 0;
    const bookingItems: { ticketTypeId: string; quantity: number; unitPrice: number }[] = [];

    for (const item of input.items) {
      const ticketType = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
      if (!ticketType) throw new BookingError("INVALID_TICKET_TYPE", "That ticket type doesn't exist.");

      const now = new Date();
      if (ticketType.saleStart && now < ticketType.saleStart) {
        throw new BookingError("SALE_NOT_STARTED", `${ticketType.name} tickets aren't on sale yet.`);
      }
      if (ticketType.saleEnd && now > ticketType.saleEnd) {
        throw new BookingError("SALE_ENDED", `${ticketType.name} ticket sales have closed.`);
      }
      if (item.quantity > ticketType.maxPerOrder) {
        throw new BookingError("MAX_PER_ORDER", `You can book at most ${ticketType.maxPerOrder} ${ticketType.name} tickets per order.`);
      }

      // Atomic, race-safe inventory hold — see docstring above.
      const result = await tx.ticketType.updateMany({
        where: { id: ticketType.id, quantitySold: { lte: ticketType.quantityTotal - item.quantity } },
        data: { quantitySold: { increment: item.quantity } },
      });
      if (result.count === 0) {
        throw new BookingError("SOLD_OUT", `Only a few ${ticketType.name} tickets were left and they just sold out.`);
      }

      subtotal += ticketType.price * item.quantity;
      bookingItems.push({ ticketTypeId: ticketType.id, quantity: item.quantity, unitPrice: ticketType.price });
    }

    // Seat-based events: hold the specific seats the buyer selected. We'll
    // backfill heldByBookingId with the real booking id right after create()
    // below, since the booking doesn't exist yet at this point.
    const heldSeatIds: string[] = [];
    if (event.ticketMode === "SEAT_BASED" && input.seatIds?.length) {
      for (const seatId of input.seatIds) {
        const result = await tx.seat.updateMany({
          where: { id: seatId, eventId: event.id, status: "AVAILABLE" },
          data: { status: "SELECTED" },
        });
        if (result.count === 0) {
          throw new BookingError("SEAT_UNAVAILABLE", "One of the seats you picked was just taken. Please choose another.");
        }
        heldSeatIds.push(seatId);
      }
    }

    let discount = 0;
    let couponId: string | undefined;
    if (input.couponCode) {
      const coupon = await tx.coupon.findUnique({ where: { eventId_code: { eventId: event.id, code: input.couponCode.toUpperCase() } } });
      if (coupon && (!coupon.maxRedemptions || coupon.timesRedeemed < coupon.maxRedemptions) && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        discount = coupon.percentOff ? Math.round((subtotal * coupon.percentOff) / 100) : coupon.amountOff ?? 0;
        couponId = coupon.id;
      }
    }

    const total = Math.max(0, subtotal - discount);

    const booking = await tx.booking.create({
      data: {
        bookingRef: generateRef("EVT"),
        userId,
        eventId: event.id,
        attendeeName: input.attendeeName,
        status: "PENDING",
        subtotal,
        discount,
        total,
        couponId,
        expiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000),
        items: { create: bookingItems },
      },
      include: { items: { include: { ticketType: true } }, event: true },
    });

    if (heldSeatIds.length) {
      await tx.seat.updateMany({
        where: { id: { in: heldSeatIds } },
        data: { heldByBookingId: booking.id },
      });
    }

    return booking;
  });
}
