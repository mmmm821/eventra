import { db } from "@/lib/db";

/**
 * Releases inventory holds from PENDING bookings whose 15-minute payment
 * window has passed. Intended to run on a schedule (e.g. a Vercel Cron or
 * any periodic job hitting POST /api/bookings/cleanup-expired every few
 * minutes) — see vercel.json.
 */
export async function releaseExpiredBookings() {
  const expired = await db.booking.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    include: { items: true },
  });

  let released = 0;
  for (const booking of expired) {
    await db.$transaction(async (tx) => {
      for (const item of booking.items) {
        await tx.ticketType.update({
          where: { id: item.ticketTypeId },
          data: { quantitySold: { decrement: item.quantity } },
        });
      }
      await tx.seat.updateMany({
        where: { heldByBookingId: booking.id, status: "SELECTED" },
        data: { status: "AVAILABLE", heldByBookingId: null },
      });
      await tx.booking.update({ where: { id: booking.id }, data: { status: "EXPIRED" } });
    });
    released++;
  }
  return released;
}
