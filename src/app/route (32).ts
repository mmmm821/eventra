import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createEventSchema } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils";
import { searchEvents } from "@/lib/events-query";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const result = await searchEvents({
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    audience: (searchParams.get("audience") as any) ?? undefined,
    format: (searchParams.get("format") as any) ?? undefined,
    free: searchParams.get("free") === "true",
    sort: (searchParams.get("sort") as any) ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
  });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "ORGANIZER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Only organizers can create events." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the event details.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  let venueId: string | undefined;
  if (data.format === "OFFLINE" && data.venueName) {
    const venue = await db.venue.create({
      data: {
        name: data.venueName,
        address: data.address ?? "",
        city: data.city ?? "",
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
    venueId = venue.id;
  } else if (data.format === "ONLINE" && data.meetingUrl) {
    const venue = await db.venue.create({
      data: { name: "Online", address: "Online event", city: "Online", meetingUrl: data.meetingUrl },
    });
    venueId = venue.id;
  }

  // College events publish straight away; public events go to moderation
  // first (see EVENT APPROVAL SYSTEM in the spec).
  const status = data.audience === "COLLEGE" ? "PUBLISHED" : "PENDING_APPROVAL";

  const event = await db.event.create({
    data: {
      slug: slugify(data.title),
      title: data.title,
      description: data.description,
      category: data.category,
      audience: data.audience,
      format: data.format,
      ticketMode: data.ticketMode,
      bannerUrl: data.bannerUrl || null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      ageRestriction: data.ageRestriction,
      cancellationPolicy: data.cancellationPolicy,
      terms: data.terms,
      status,
      organizerId: (session.user as any).id,
      venueId,
      ticketTypes: {
        create: data.ticketTypes.map((t) => ({
          name: t.name,
          description: t.description,
          price: t.price,
          quantityTotal: t.quantityTotal,
          saleStart: t.saleStart ? new Date(t.saleStart) : undefined,
          saleEnd: t.saleEnd ? new Date(t.saleEnd) : undefined,
          isGroupTicket: t.isGroupTicket,
          maxPerOrder: t.maxPerOrder,
        })),
      },
    },
  });

  // Seat-based events get a seat grid generated from ticket-type capacity —
  // see the wizard's Step 5 note. A simple 10-wide grid keeps this legible;
  // organizers can regenerate with a different layout by editing the event.
  if (data.ticketMode === "SEAT_BASED") {
    const seatRows: { eventId: string; row: string; number: number; section: string; price: number }[] = [];
    let rowIndex = 0;
    for (const t of data.ticketTypes) {
      const section = t.name.toLowerCase().includes("vip") ? "VIP" : "GENERAL";
      let seatsLeft = t.quantityTotal;
      while (seatsLeft > 0) {
        const rowLetter = String.fromCharCode(65 + (rowIndex % 26));
        const seatsInRow = Math.min(10, seatsLeft);
        for (let n = 1; n <= seatsInRow; n++) {
          seatRows.push({ eventId: event.id, row: rowLetter, number: n, section, price: t.price });
        }
        seatsLeft -= seatsInRow;
        rowIndex++;
      }
    }
    if (seatRows.length) await db.seat.createMany({ data: seatRows });
  }

  return NextResponse.json({ event }, { status: 201 });
}
