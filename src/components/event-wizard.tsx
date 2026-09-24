"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/organizer/image-upload";
import { formatINR } from "@/lib/utils";

const STEPS = ["Basics", "Date & Time", "Location", "Banner", "Tickets", "Policies", "Preview"];
const CATEGORIES = ["Concerts", "Sports", "Comedy", "Technology", "Workshops", "College", "Cultural", "Food", "Gaming", "Business", "Networking", "Exhibitions", "Other"];

type TicketTypeForm = {
  name: string;
  price: string; // rupees, converted to paise on submit
  quantityTotal: string;
  saleStart: string;
  saleEnd: string;
  isGroupTicket: boolean;
  maxPerOrder: string;
};

const emptyTicketType = (): TicketTypeForm => ({
  name: "",
  price: "",
  quantityTotal: "",
  saleStart: "",
  saleEnd: "",
  isGroupTicket: false,
  maxPerOrder: "10",
});

export function EventWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Technology",
    audience: "PUBLIC" as "COLLEGE" | "PUBLIC",
    format: "OFFLINE" as "ONLINE" | "OFFLINE",
    ticketMode: "GENERAL_ADMISSION" as "GENERAL_ADMISSION" | "SEAT_BASED",
    bannerUrl: "",
    startDate: "",
    startTime: "18:00",
    endDate: "",
    endTime: "21:00",
    venueName: "",
    address: "",
    city: "",
    meetingUrl: "",
    ageRestriction: "",
    cancellationPolicy: "Full refund up to 48 hours before the event. No refunds after that.",
    terms: "",
  });
  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([emptyTicketType()]);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const updateTicketType = (i: number, key: keyof TicketTypeForm, value: any) =>
    setTicketTypes((prev) => prev.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)));

  const canProceed = () => {
    switch (step) {
      case 0:
        return form.title.trim().length >= 4 && form.description.trim().length >= 20;
      case 1:
        return !!form.startDate && !!form.endDate;
      case 2:
        return form.format === "ONLINE" ? !!form.meetingUrl : !!form.venueName && !!form.city;
      case 4:
        return ticketTypes.every((t) => t.name && t.price !== "" && t.quantityTotal !== "");
      default:
        return true;
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const startDate = new Date(`${form.startDate}T${form.startTime}`).toISOString();
      const endDate = new Date(`${form.endDate}T${form.endTime}`).toISOString();

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          audience: form.audience,
          format: form.format,
          ticketMode: form.ticketMode,
          bannerUrl: form.bannerUrl || undefined,
          startDate,
          endDate,
          venueName: form.format === "OFFLINE" ? form.venueName : undefined,
          address: form.format === "OFFLINE" ? form.address : undefined,
          city: form.format === "OFFLINE" ? form.city : undefined,
          meetingUrl: form.format === "ONLINE" ? form.meetingUrl : undefined,
          ageRestriction: form.ageRestriction || undefined,
          cancellationPolicy: form.cancellationPolicy || undefined,
          terms: form.terms || undefined,
          ticketTypes: ticketTypes.map((t) => ({
            name: t.name,
            price: Math.round(Number(t.price) * 100),
            quantityTotal: Number(t.quantityTotal),
            saleStart: t.saleStart ? new Date(t.saleStart).toISOString() : undefined,
            saleEnd: t.saleEnd ? new Date(t.saleEnd).toISOString() : undefined,
            isGroupTicket: t.isGroupTicket,
            maxPerOrder: Number(t.maxPerOrder) || 10,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not create event.");
        setSubmitting(false);
        return;
      }
      toast.success(form.audience === "COLLEGE" ? "Event published!" : "Event submitted for approval.");
      router.push("/organizer/events");
    } catch {
      toast.error("Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="font-display text-2xl font-semibold text-white mb-1">Create an event</h1>
      <p className="text-white/50 text-sm mb-8">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>

      <div className="flex gap-1.5 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-violet-500" : "bg-white/10"}`} />
        ))}
      </div>

      <Card className="p-6">
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Event name">
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. TechFest 2026" />
            </Field>
            <Field label="Description">
              <Textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What's this event about?" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <Select value={form.category} onValueChange={(v) => update("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Event type">
                <Select value={form.audience} onValueChange={(v) => update("audience", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="COLLEGE">College</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Format">
              <Select value={form.format} onValueChange={(v) => update("format", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFLINE">In-person</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start date"><Input type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} /></Field>
            <Field label="Start time"><Input type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} /></Field>
            <Field label="End date"><Input type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></Field>
            <Field label="End time"><Input type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} /></Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {form.format === "ONLINE" ? (
              <Field label="Meeting URL">
                <Input value={form.meetingUrl} onChange={(e) => update("meetingUrl", e.target.value)} placeholder="https://meet.google.com/..." />
              </Field>
            ) : (
              <>
                <Field label="Venue name">
                  <Input value={form.venueName} onChange={(e) => update("venueName", e.target.value)} placeholder="e.g. Main Auditorium" />
                </Field>
                <Field label="Address">
                  <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Street address" />
                </Field>
                <Field label="City">
                  <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City" />
                </Field>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <Field label="Event banner">
            <ImageUpload value={form.bannerUrl} onChange={(url) => update("bannerUrl", url)} />
          </Field>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <Field label="Ticketing mode">
              <Select value={form.ticketMode} onValueChange={(v) => update("ticketMode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL_ADMISSION">General Admission</SelectItem>
                  <SelectItem value="SEAT_BASED">Assigned Seating</SelectItem>
                </SelectContent>
              </Select>
              {form.ticketMode === "SEAT_BASED" && (
                <p className="text-xs text-white/40 mt-1.5">
                  Name a ticket type &ldquo;VIP&rdquo; to place it in the VIP section — everything else becomes general seating.
                </p>
              )}
            </Field>

            <div className="space-y-4">
              {ticketTypes.map((t, i) => (
                <div key={i} className="rounded-xl border border-white/10 p-4 space-y-3 relative">
                  {ticketTypes.length > 1 && (
                    <button
                      onClick={() => setTicketTypes((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-3 right-3 text-white/30 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Ticket name">
                      <Input value={t.name} onChange={(e) => updateTicketType(i, "name", e.target.value)} placeholder="e.g. General / VIP / Early Bird" />
                    </Field>
                    <Field label="Price (₹, 0 = free)">
                      <Input type="number" min="0" value={t.price} onChange={(e) => updateTicketType(i, "price", e.target.value)} />
                    </Field>
                    <Field label="Quantity available">
                      <Input type="number" min="1" value={t.quantityTotal} onChange={(e) => updateTicketType(i, "quantityTotal", e.target.value)} />
                    </Field>
                    <Field label="Max per order">
                      <Input type="number" min="1" value={t.maxPerOrder} onChange={(e) => updateTicketType(i, "maxPerOrder", e.target.value)} />
                    </Field>
                    <Field label="Sale starts (optional)">
                      <Input type="datetime-local" value={t.saleStart} onChange={(e) => updateTicketType(i, "saleStart", e.target.value)} />
                    </Field>
                    <Field label="Sale ends (optional)">
                      <Input type="datetime-local" value={t.saleEnd} onChange={(e) => updateTicketType(i, "saleEnd", e.target.value)} />
                    </Field>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={t.isGroupTicket} onCheckedChange={(v) => updateTicketType(i, "isGroupTicket", v)} />
                    <span className="text-sm text-white/60">Allow group booking for this ticket type</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setTicketTypes((prev) => [...prev, emptyTicketType()])}>
              <Plus className="h-4 w-4" /> Add another ticket type
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <Field label="Age restriction (optional)">
              <Input value={form.ageRestriction} onChange={(e) => update("ageRestriction", e.target.value)} placeholder="e.g. 18+ only" />
            </Field>
            <Field label="Cancellation policy">
              <Textarea rows={3} value={form.cancellationPolicy} onChange={(e) => update("cancellationPolicy", e.target.value)} />
            </Field>
            <Field label="Terms (optional)">
              <Textarea rows={3} value={form.terms} onChange={(e) => update("terms", e.target.value)} placeholder="Any additional terms attendees should know" />
            </Field>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <div className="rounded-xl overflow-hidden border border-white/10">
              <div className="relative aspect-video bg-gradient-to-br from-violet-900/40 to-blue-900/40">
                {form.bannerUrl && <img src={form.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              </div>
              <div className="p-4">
                <p className="font-display text-lg font-semibold text-white">{form.title || "Untitled event"}</p>
                <p className="text-sm text-white/50 mt-1">
                  {form.startDate} {form.startTime} · {form.format === "ONLINE" ? "Online" : `${form.venueName}, ${form.city}`}
                </p>
                <p className="text-sm text-white/50 mt-1">{form.category} · {form.audience === "COLLEGE" ? "College event" : "Public event"}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-white/80 mb-2">Tickets</p>
              <div className="space-y-1.5">
                {ticketTypes.map((t, i) => (
                  <div key={i} className="flex justify-between text-sm text-white/60">
                    <span>{t.name || "Untitled"} × {t.quantityTotal || 0}</span>
                    <span>{t.price ? formatINR(Number(t.price) * 100) : "Free"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/10 p-3.5 text-xs text-white/50">
              {form.audience === "COLLEGE"
                ? "College events publish immediately."
                : "Public events are reviewed by an admin before going live — usually within a day."}
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Publish event
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
