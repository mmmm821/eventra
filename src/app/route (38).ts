import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createRazorpayOrder } from "@/lib/payments/razorpay";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId } = await req.json();
  if (!bookingId) return NextResponse.json({ error: "bookingId is required." }, { status: 400 });

  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { event: true, payment: true } });
  if (!booking || booking.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (booking.status !== "PENDING") {
    return NextResponse.json({ error: "This booking is no longer pending." }, { status: 409 });
  }
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    return NextResponse.json({ error: "Your reservation expired. Please book again." }, { status: 410 });
  }

  try {
    // Free events (total 0) skip Razorpay entirely and confirm immediately.
    if (booking.total === 0) {
      return NextResponse.json({ free: true, bookingId: booking.id });
    }

    let order;
    if (booking.payment?.razorpayOrderId) {
      // Reuse the existing order if the buyer re-opens checkout.
      order = { id: booking.payment.razorpayOrderId, amount: booking.total, currency: "INR" };
    } else {
      order = await createRazorpayOrder({
        amount: booking.total,
        receipt: booking.bookingRef,
        notes: { bookingId: booking.id, eventTitle: booking.event.title },
      });
      await db.payment.upsert({
        where: { bookingId: booking.id },
        create: { bookingId: booking.id, amount: booking.total, razorpayOrderId: order.id, status: "CREATED" },
        update: { razorpayOrderId: order.id, status: "CREATED" },
      });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: booking.total,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      bookingRef: booking.bookingRef,
    });
  } catch (err) {
    console.error("[POST /api/payments/create-order]", err);
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
