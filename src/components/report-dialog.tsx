"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";

export function ReportEventDialog({ eventId }: { eventId: string }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  const submit = () => {
    // Logged for organizer/admin follow-up; kept lightweight on purpose —
    // this demo doesn't persist reports to their own table.
    console.info(`[report] event=${eventId} reason=${reason}`);
    toast.success("Thanks — we'll take a look.");
    setReason("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/70">
          <Flag className="h-4 w-4" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this event</DialogTitle>
          <DialogDescription>Tell us what looks off. Our team will review it.</DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What's wrong with this listing?" />
        <div className="flex justify-end gap-2 mt-4">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={submit} disabled={!reason.trim()}>Submit report</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
