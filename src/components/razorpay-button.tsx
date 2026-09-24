"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function RazorpayCheckoutButton({
  bookingId,
  isFree,
  amount,
  attendeeEmail,
  attendeeName,
}: {
  bookingId: string;
  isFree: boolean;
  amount: number;
  attendeeEmail: string;
  attendeeName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const payFree = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/confirm-free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not confirm booking.");
        return;
      }
      router.push(`/checkout/${bookingId}/success`);
    } finally {
      setLoading(false);
    }
  };

  const payWithRazorpay = async () => {
    setLoading(true);
    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) {
        toast.error(order.error ?? "Could not start payment.");
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "EVENTRA",
        description: `Booking ${order.bookingRef}`,
        order_id: order.orderId,
        prefill: { name: attendeeName, email: attendeeEmail },
        theme: { color: "#7C3AED" },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            toast.error(verifyData.error ?? "Payment verification failed.");
            router.push(`/checkout/${bookingId}/failed`);
            return;
          }
          router.push(`/checkout/${bookingId}/success`);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on("payment.failed", () => {
        toast.error("Payment failed. You can try again.");
        setLoading(false);
      });

      rzp.open();
    } catch {
      toast.error("Something went wrong starting payment.");
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onReady={() => setScriptReady(true)} strategy="afterInteractive" />
      <Button
        size="lg"
        className="w-full"
        disabled={loading || (!isFree && !scriptReady)}
        onClick={isFree ? payFree : payWithRazorpay}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {isFree ? "Confirm free booking" : "Pay securely with Razorpay"}
      </Button>
    </>
  );
}
