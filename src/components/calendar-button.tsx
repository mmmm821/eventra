"use client";

import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddToCalendarButton({ eventId }: { eventId: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={`/api/events/${eventId}/calendar.ics`} download>
        <CalendarPlus className="h-4 w-4" />
        Add to Calendar
      </a>
    </Button>
  );
}
