import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { razorpay } from "@/lib/payments/razorpay";
import { sendMail } from "@/lib/email/mailer";
import { cancellationEmail } from "@/lib/email/templates";

/**
 * Cancels a confirmed booking: releases its tickets/seats, issues a
 * Razorpay refund (test mode), and — per the WAITLIST feature — notifies
 * the next eligible person that a spot just opened up.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const booking = await db.booking.findUnique({
    where: { id: params.id },
    include: { payment: true, event: true, tickets: { include: { seat: true } } },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (booking.userId !== userId && role !== "ADMIN" && role !== "ORGANIZER") {
    return NextResponse.json({ error: "You can't cancel this booking." }, { status: 403 });
  }
  if (booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Only confirmed bookings can be cancelled." }, { status: 409 });
  }

  // Refund in Razorpay test mode (no-op safe: if it fails, we still cancel
  // locally and log — a real deployment would reconcile via webhook/retry).
  if (booking.payment?.razorpayPaymentId) {
    try {
      await razorpay.payments.refund(booking.payment.razorpayPaymentId, { amount: booking.total });
    } catch (err) {
      console.error("[booking cancel] Razorpay refund failed, continuing with local cancellation:", err);
    }
  }

  await db.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: booking.id }, data: { status: "REFUNDED" } });
    await tx.ticket.updateMany({ where: { bookingId: booking.id }, data: { status: "REFUNDED" } });
    if (booking.payment) await tx.payment.update({ where: { id: booking.payment.id }, data: { status: "REFUNDED" } });

    for (const ticket of booking.tickets) {
      if (ticket.seat) {
        await tx.seat.update({ where: { id: ticket.seat.id }, data: { status: "AVAILABLE", ticketId: null } });
      }
    }
  });

  await sendMail({
    to: session.user.email!,
    ...cancellationEmail({ attendeeName: booking.attendeeName, eventTitle: booking.event.title, refundAmount: booking.total }),
  });

  // Notify the next person on the waitlist, if any.
  const nextInLine = await db.waitlist.findFirst({
    where: { eventId: booking.eventId, notified: false },
    orderBy: { createdAt: "asc" },
  });
  if (nextInLine) {
    await db.waitlist.update({ where: { id: nextInLine.id }, data: { notified: true } });
    await db.notification.create({
      data: {
        userId: nextInLine.userId,
        type: "WAITLIST_AVAILABLE",
        title: "A spot just opened up",
        body: `${booking.event.title} has availability again — book now before it's gone.`,
      },
    });
  }

  return NextResponse.json({ cancelled: true });
}
