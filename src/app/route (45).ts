import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to save events." }, { status: 401 });

  const { eventId } = await req.json();
  const userId = (session.user as any).id;

  const existing = await db.favorite.findUnique({ where: { userId_eventId: { userId, eventId } } });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }
  await db.favorite.create({ data: { userId, eventId } });
  return NextResponse.json({ saved: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const favorites = await db.favorite.findMany({
    where: { userId: (session.user as any).id },
    include: { event: { include: { venue: true, ticketTypes: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ favorites });
}
