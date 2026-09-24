import { NextResponse } from "next/server";
import { releaseExpiredBookings } from "@/lib/bookings/expire-bookings";

// Intended to be hit periodically by a scheduler (Vercel Cron, a GitHub
// Action, or any external cron pinger) — see vercel.json's `crons` entry.
// Protect it in production by checking a shared secret header/query param.
async function handle(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const released = await releaseExpiredBookings();
  return NextResponse.json({ released });
}

// Vercel Cron issues GET requests; POST is supported too for manual/external triggers.
export const GET = handle;
export const POST = handle;
