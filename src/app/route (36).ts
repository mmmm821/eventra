import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrganizerStats } from "@/lib/organizer/stats";

export async function GET() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "ORGANIZER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await getOrganizerStats((session.user as any).id);
  return NextResponse.json(stats);
}
