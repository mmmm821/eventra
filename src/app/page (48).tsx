import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Ticket as TicketIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

export default async function CheckoutSuccessPage({ params }: { params: { bookingId: string } }) {
  const session = await auth();
  if (!session?.user) notFound();

  const booking = await db.booking.findUnique({
    where: { id: params.bookingId },
    include: { event: true, tickets: true },
  });
  if (!booking || booking.userId !== (session.user as any).id) notFound();

  return (
    <div className="container max-w-lg py-20 text-center">
      <div className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-white">You&rsquo;re going!</h1>
      <p className="text-white/55 mt-2">
        {booking.status === "CONFIRMED" ? `Your booking for ${booking.event.title} is confirmed.` : "We're finalizing your booking — this can take a few seconds."}
      </p>
      <p className="text-sm text-white/40 mt-1">Booking ID: {booking.bookingRef}</p>

      <div className="flex flex-col gap-3 mt-8">
        <Button size="lg" asChild>
          <Link href="/tickets"><TicketIcon className="h-4 w-4" /> View my tickets</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/events">Keep exploring</Link>
        </Button>
      </div>
    </div>
  );
}
