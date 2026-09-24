import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPaymentSchema } from "@/lib/validation/schemas";
import { verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { confirmBookingPayment } from "@/lib/payments/confirm-booking";

/**
 * Called by the client right after Razorpay Checkout's success callback
 * fires. IMPORTANT: a successful callback is not, by itself, proof of
 * payment — a malicious client could call this route directly with made-up
 * IDs. We only trust it once `verifyCheckoutSignature` confirms the
 * signature was produced by Razorpay using our secret key. The webhook
 * (/api/payments/webhook) is the durable backstop in case this call never
 * happens at all (tab closed, network drop, etc.).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = parsed.data;

  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const valid = verifyCheckoutSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    await db.payment.update({ where: { bookingId }, data: { status: "FAILED", failureReason: "Signature mismatch" } }).catch(() => {});
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  try {
    const result = await confirmBookingPayment({
      bookingId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });
    return NextResponse.json({ success: true, bookingRef: result.booking.bookingRef, ticketIds: result.tickets.map((t) => t.id) });
  } catch (err) {
    console.error("[POST /api/payments/verify]", err);
    return NextResponse.json({ error: "Could not confirm booking." }, { status: 500 });
  }
}
