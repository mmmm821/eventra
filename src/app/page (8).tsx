import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EditEventForm } from "@/components/organizer/edit-event-form";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session!.user as any).role;
  const userId = (session!.user as any).id;

  const event = await db.event.findUnique({ where: { id: params.id } });
  if (!event || (event.organizerId !== userId && role !== "ADMIN")) notFound();

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="font-display text-2xl font-semibold text-white mb-1">Edit event</h1>
      <p className="text-white/50 text-sm mb-8">
        Core details only — to change dates, venue, or ticket types, cancel this event and create a new one to avoid disrupting existing bookings.
      </p>
      <EditEventForm
        eventId={event.id}
        initial={{
          title: event.title,
          description: event.description,
          bannerUrl: event.bannerUrl ?? "",
          cancellationPolicy: event.cancellationPolicy ?? "",
        }}
      />
    </div>
  );
}
