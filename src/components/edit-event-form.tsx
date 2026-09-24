"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/organizer/image-upload";

export function EditEventForm({
  eventId,
  initial,
}: {
  eventId: string;
  initial: { title: string; description: string; bannerUrl: string; cancellationPolicy: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not save changes.");
      return;
    }
    toast.success("Event updated.");
    router.push("/organizer/events");
    router.refresh();
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <Label>Event name</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div>
        <Label>Banner</Label>
        <ImageUpload value={form.bannerUrl} onChange={(url) => setForm({ ...form, bannerUrl: url })} />
      </div>
      <div>
        <Label>Cancellation policy</Label>
        <Textarea rows={3} value={form.cancellationPolicy} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })} />
      </div>
      <Button onClick={save} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </Card>
  );
}
