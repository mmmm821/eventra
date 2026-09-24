import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createOrderSchema } from "@/lib/validation/schemas";
import { createPendingBooking, BookingError } from "@/lib/bookings/create-booking";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to book tickets." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const booking = await createPendingBooking((session.user as any).id, parsed.data);
    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 409 });
    }
    console.error("[POST /api/bookings]", err);
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bookings = await db.booking.findMany({
    where: { userId: (session.user as any).id },
    include: { event: true, items: { include: { ticketType: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ bookings });
}
