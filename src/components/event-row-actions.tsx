"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MoreVertical, Eye, Pencil, Users, QrCode, Ban, Trash2, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function EventRowActions({ eventId, slug, status }: { eventId: string; slug: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not update event.");
      return;
    }
    toast.success(`Event ${newStatus.toLowerCase().replace("_", " ")}.`);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/events/${slug}`}><Eye className="mr-2 h-4 w-4" /> View event</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/organizer/events/${eventId}/edit`}><Pencil className="mr-2 h-4 w-4" /> Edit event</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/organizer/events/${eventId}/attendees`}><Users className="mr-2 h-4 w-4" /> Manage attendees</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/scanner"><QrCode className="mr-2 h-4 w-4" /> Scan tickets</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {status === "DRAFT" && (
          <DropdownMenuItem onClick={() => updateStatus("PENDING_APPROVAL")}>
            <Send className="mr-2 h-4 w-4" /> Submit for review
          </DropdownMenuItem>
        )}
        {status === "PUBLISHED" && (
          <DropdownMenuItem onClick={() => updateStatus("DRAFT")}>
            <Ban className="mr-2 h-4 w-4" /> Unpublish
          </DropdownMenuItem>
        )}
        {(status === "PUBLISHED" || status === "PENDING_APPROVAL") && (
          <DropdownMenuItem
            onClick={() => updateStatus("CANCELLED", "Cancel this event? All confirmed tickets will be cancelled too.")}
            className="text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Cancel event
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
