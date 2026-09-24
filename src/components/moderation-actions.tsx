"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ModerationActions({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");

  const act = async (action: "approve" | "reject") => {
    setLoading(true);
    const res = await fetch(`/api/admin/events/${eventId}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Action failed.");
      return;
    }
    toast.success(action === "approve" ? "Event approved." : "Event rejected.");
    setRejectOpen(false);
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => act("approve")} disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
      </Button>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject event</DialogTitle>
            <DialogDescription>Let the organizer know what needs to change.</DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for rejection" />
          <div className="flex justify-end gap-2 mt-4">
            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={() => act("reject")} disabled={loading}>Reject event</Button>
          </div>
        </DialogContent>
        <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
          <X className="h-3.5 w-3.5" /> Reject
        </Button>
      </Dialog>
    </div>
  );
}
