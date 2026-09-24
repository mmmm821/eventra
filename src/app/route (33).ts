import { NextResponse } from "next/server";
import { createEvent } from "ics";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const event = await db.event.findFirst({ where: { OR: [{ id: params.id }, { slug: params.id }] }, include: { venue: true } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  const { error, value } = createEvent({
    title: event.title,
    description: event.description.slice(0, 400),
    location: event.venue ? `${event.venue.name}, ${event.venue.city}` : undefined,
    start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
    end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
    url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.slug}`,
  });

  if (error || !value) {
    return NextResponse.json({ error: "Could not generate calendar file." }, { status: 500 });
  }

  return new NextResponse(value, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
