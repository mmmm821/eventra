import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to join the waitlist." }, { status: 401 });

  const { eventId } = await req.json();
  const userId = (session.user as any).id;

  const entry = await db.waitlist.upsert({
    where: { userId_eventId: { userId, eventId } },
    create: { userId, eventId },
    update: {},
  });
  return NextResponse.json({ joined: true, entry });
}
