import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { confirmBookingPayment } from "@/lib/payments/confirm-booking";

/** Confirms a zero-cost booking (total === 0) without touching Razorpay at all. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId } = await req.json();
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (booking.total !== 0) {
    return NextResponse.json({ error: "This booking requires payment." }, { status: 400 });
  }

  try {
    const result = await confirmBookingPayment({ bookingId });
    return NextResponse.json({ success: true, bookingRef: result.booking.bookingRef, ticketIds: result.tickets.map((t) => t.id) });
  } catch (err) {
    console.error("[POST /api/payments/confirm-free]", err);
    return NextResponse.json({ error: "Could not confirm booking." }, { status: 500 });
  }
}
