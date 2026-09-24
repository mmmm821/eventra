import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await db.event.findUnique({ where: { id: params.id }, select: { organizerId: true, title: true } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (role !== "ADMIN" && event.organizerId !== (session.user as any).id) {
    return NextResponse.json({ error: "You don't manage this event." }, { status: 403 });
  }

  const tickets = await db.ticket.findMany({
    where: { eventId: params.id },
    include: { user: { select: { name: true, email: true } }, ticketType: true, booking: { include: { payment: true } }, checkIn: true },
    orderBy: { createdAt: "desc" },
  });

  const { searchParams } = new URL(req.url);
  if (searchParams.get("format") === "csv") {
    const header = "Name,Email,Ticket Type,Booking ID,Payment Status,Ticket Status,Checked In\n";
    const rows = tickets
      .map((t) =>
        [
          t.attendeeName,
          t.user.email,
          t.ticketType.name,
          t.ticketCode,
          t.booking.payment?.status ?? "N/A",
          t.status,
          t.checkIn ? "Yes" : "No",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${event.title.replace(/\W+/g, "-")}-attendees.csv"`,
      },
    });
  }

  return NextResponse.json({ tickets });
}
