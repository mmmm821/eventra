"use client";

import { Printer, Share2, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function TicketActions({ eventSlug, title }: { eventSlug: string; title: string }) {
  const share = async () => {
    const url = `${window.location.origin}/events/${eventSlug}`;
    if ("share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // ignore — fall back to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center print:hidden">
      <Button variant="outline" size="sm" asChild>
        <a href={`/api/events/${eventSlug}/calendar.ics`} download>
          <CalendarPlus className="h-4 w-4" /> Add to Calendar
        </a>
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Download Ticket
      </Button>
      <Button variant="outline" size="sm" onClick={share}>
        <Share2 className="h-4 w-4" /> Share
      </Button>
    </div>
  );
}
