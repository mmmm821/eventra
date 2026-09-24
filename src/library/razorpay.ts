import Razorpay from "razorpay";
import crypto from "crypto";

// Server-side only. Never import this file from a Client Component —
// it reads the Razorpay secret key.
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

/** Amount must be in the smallest currency unit (paise) — e.g. ₹299 = 29900. */
export async function createRazorpayOrder(params: {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  return razorpay.orders.create({
    amount: params.amount,
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes,
  });
}

/**
 * Verifies the checkout callback signature. This is a NECESSARY but not
 * SUFFICIENT condition for confirming a booking — always also rely on the
 * webhook (see /api/payments/webhook) as the durable source of truth, since
 * the client-side callback can be skipped entirely (closed tab, network
 * drop, malicious client).
 */
export function verifyCheckoutSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(body)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(params.signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Verifies the `X-Razorpay-Signature` header on incoming webhook requests. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
    .update(rawBody)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
