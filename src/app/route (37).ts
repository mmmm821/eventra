import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments/razorpay";
import { confirmBookingPayment } from "@/lib/payments/confirm-booking";

/**
 * Razorpay webhook. This — not the client-side callback — is the source of
 * truth for payment state, because Razorpay retries webhooks until they get
 * a 2xx, whereas the client callback can simply never fire. Configure this
 * URL (https://yourdomain.com/api/payments/webhook) in the Razorpay
 * dashboard with events: payment.captured, payment.failed, refund.processed.
 *
 * We verify the raw body against RAZORPAY_WEBHOOK_SECRET before touching
 * anything, and confirmBookingPayment() is idempotent, so a webhook that
 * Razorpay resends after a timeout is safe to process again.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  try {
    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const bookingId = payment.notes?.bookingId;
        if (bookingId) {
          await confirmBookingPayment({
            bookingId,
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
          });
        }
        break;
      }
      case "payment.failed": {
        const payment = event.payload.payment.entity;
        const bookingId = payment.notes?.bookingId;
        if (bookingId) {
          await db.payment.updateMany({
            where: { bookingId, status: { not: "PAID" } },
            data: { status: "FAILED", failureReason: payment.error_description ?? "Payment failed" },
          });
        }
        break;
      }
      case "refund.processed": {
        const refund = event.payload.refund.entity;
        const paymentRecord = await db.payment.findFirst({ where: { razorpayPaymentId: refund.payment_id } });
        if (paymentRecord) {
          await db.$transaction([
            db.payment.update({ where: { id: paymentRecord.id }, data: { status: "REFUNDED" } }),
            db.booking.update({ where: { id: paymentRecord.bookingId }, data: { status: "REFUNDED" } }),
            db.ticket.updateMany({ where: { bookingId: paymentRecord.bookingId }, data: { status: "REFUNDED" } }),
          ]);
        }
        break;
      }
      default:
        break; // Unhandled event types are safely ignored.
    }
    // Always 200 on successfully-processed (or intentionally-ignored) events
    // so Razorpay stops retrying.
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[POST /api/payments/webhook]", err);
    // Return 500 so Razorpay retries — something on our end failed, not the
    // payload itself.
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
