import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatEventDate, formatEventTime, formatINR } from "@/lib/utils";
import { RazorpayCheckoutButton } from "@/components/checkout/razorpay-button";
import { HoldTimer } from "@/components/checkout/hold-timer";
import { Card } from "@/components/ui/card";

export default async function CheckoutPage({ params }: { params: { bookingId: string } }) {
  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/checkout/${params.bookingId}`);

  const booking = await db.booking.findUnique({
    where: { id: params.bookingId },
    include: { event: { include: { venue: true } }, items: { include: { ticketType: true } } },
  });

  if (!booking || booking.userId !== (session.user as any).id) notFound();

  if (booking.status === "CONFIRMED") redirect(`/checkout/${booking.id}/success`);
  if (booking.status !== "PENDING") {
    return (
      <div className="container py-20 text-center">
        <p className="text-white">This booking is no longer available.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="font-display text-2xl font-semibold text-white mb-6">Checkout</h1>

      {booking.expiresAt && <div className="mb-5"><HoldTimer expiresAt={booking.expiresAt.toISOString()} /></div>}

      <Card className="p-5 mb-5">
        <div className="flex gap-4">
          <div className="relative h-20 w-28 rounded-lg overflow-hidden bg-white/5 shrink-0">
            {booking.event.bannerUrl && <Image src={booking.event.bannerUrl} alt="" fill className="object-cover" />}
          </div>
          <div>
            <p className="text-white font-medium">{booking.event.title}</p>
            <p className="text-sm text-white/50 mt-1">
              {formatEventDate(booking.event.startDate)} · {formatEventTime(booking.event.startDate)}
            </p>
            {booking.event.venue && <p className="text-sm text-white/50">{booking.event.venue.name}, {booking.event.venue.city}</p>}
          </div>
        </div>
      </Card>

      <Card className="p-5 mb-5 space-y-2.5">
        <p className="text-sm font-medium text-white/80 mb-1">Order summary</p>
        {booking.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm text-white/60">
            <span>{item.ticketType.name} × {item.quantity}</span>
            <span>{formatINR(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
        {booking.discount > 0 && (
          <div className="flex justify-between text-sm text-emerald-400">
            <span>Discount</span>
            <span>-{formatINR(booking.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold text-white pt-2 border-t border-white/10">
          <span>Total</span>
          <span>{formatINR(booking.total)}</span>
        </div>
      </Card>

      <RazorpayCheckoutButton
        bookingId={booking.id}
        isFree={booking.total === 0}
        amount={booking.total}
        attendeeEmail={session.user.email!}
        attendeeName={booking.attendeeName}
      />

      <p className="text-xs text-white/35 text-center mt-4">
        Payments are processed by Razorpay in test mode. No real money is charged.
      </p>
    </div>
  );
}
