import { db } from "@/lib/db";
import { generateTicketsForBooking } from "@/lib/tickets/generate-tickets";
import { sendMail } from "@/lib/email/mailer";
import { bookingConfirmedEmail } from "@/lib/email/templates";

/**
 * Marks a booking's payment as PAID and confirms it, generating tickets.
 *
 * Idempotent by design: this is called from BOTH the client-side verify
 * route (POST /api/payments/verify, right after Razorpay Checkout succeeds)
 * AND the webhook (POST /api/payments/webhook, which Razorpay retries and
 * which can also legitimately fire twice for the same event). If the
 * payment is already PAID when this runs, we return the existing tickets
 * instead of creating duplicates.
 */
export async function confirmBookingPayment(params: {
  bookingId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}) {
  return db.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: params.bookingId },
      include: { items: true, event: { include: { venue: true } }, payment: true, user: true, tickets: true },
    });
    if (!booking) throw new Error("Booking not found");

    if (booking.payment?.status === "PAID") {
      // Already processed (webhook + client callback both fired, or a retry).
      return { booking, tickets: booking.tickets, alreadyProcessed: true };
    }

    await tx.payment.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        amount: booking.total,
        provider: booking.total === 0 ? "free" : "razorpay",
        status: "PAID",
        razorpayOrderId: params.razorpayOrderId,
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.razorpaySignature,
      },
      update: {
        status: "PAID",
        razorpayPaymentId: params.razorpayPaymentId,
        razorpaySignature: params.razorpaySignature,
      },
    });

    const confirmed = await tx.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED" },
      include: { items: true, event: true },
    });

    const tickets = await generateTicketsForBooking(tx, confirmed);

    // Notify anyone on the waitlist that inventory is now fully accounted
    // for is out of scope here (nothing freed up) — waitlist notifications
    // are triggered from the cancellation flow instead.

    await tx.notification.create({
      data: {
        userId: booking.userId,
        type: "BOOKING_CONFIRMED",
        title: "Booking confirmed",
        body: `Your booking for ${booking.event.title} is confirmed. ${tickets.length} ticket(s) generated.`,
      },
    });

    return { booking: confirmed, tickets, alreadyProcessed: false, user: booking.user, event: booking.event };
  }).then(async (result) => {
    // Email is sent outside the DB transaction (network I/O shouldn't hold
    // a transaction open) and never blocks the booking from succeeding.
    if (!result.alreadyProcessed && "user" in result && result.user && "event" in result) {
      const { subject, html } = bookingConfirmedEmail({
        attendeeName: result.booking.attendeeName,
        eventTitle: (result.event as any).title,
        startDate: (result.event as any).startDate,
        bookingRef: result.booking.bookingRef,
        total: result.booking.total,
      });
      await sendMail({ to: result.user.email, subject, html });
    }
    return result;
  });
}
