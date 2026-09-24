import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutFailedPage({ params }: { params: { bookingId: string } }) {
  return (
    <div className="container max-w-lg py-20 text-center">
      <div className="h-16 w-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
        <XCircle className="h-8 w-8 text-red-400" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-white">Payment didn&rsquo;t go through</h1>
      <p className="text-white/55 mt-2">Your card wasn&rsquo;t charged. You can try again with the same tickets held for a few more minutes.</p>
      <div className="flex flex-col gap-3 mt-8">
        <Button size="lg" asChild>
          <Link href={`/checkout/${params.bookingId}`}>Try again</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/events">Back to events</Link>
        </Button>
      </div>
    </div>
  );
}
