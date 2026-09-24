import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { eventReminderEmail } from "@/lib/email/templates";

/**
 * Sends "starts in ~24h" and "starts in ~1h" reminders. Intended to run
 * hourly via cron (see vercel.json). Each ticket only ever gets one email
 * per window because we track a per-window flag via the Notification table
 * (type EVENT_REMINDER, one row per ticket+window).
 */
async function remind(hoursBefore: 24 | 1) {
  const windowStart = new Date(Date.now() + (hoursBefore - 0.5) * 3_600_000);
  const windowEnd = new Date(Date.now() + (hoursBefore + 0.5) * 3_600_000);

  const tickets = await db.ticket.findMany({
    where: {
      status: "CONFIRMED",
      event: { startDate: { gte: windowStart, lte: windowEnd } },
    },
    include: { event: { include: { venue: true } }, user: true },
    distinct: ["userId", "eventId"],
  });

  let sent = 0;
  for (const ticket of tickets) {
    const flagKey = `reminder-${hoursBefore}h-${ticket.eventId}`;
    const already = await db.notification.findFirst({
      where: { userId: ticket.userId, type: "EVENT_REMINDER", body: { contains: flagKey } },
    });
    if (already) continue;

    await sendMail({
      to: ticket.user.email,
      ...eventReminderEmail({
        attendeeName: ticket.attendeeName,
        eventTitle: ticket.event.title,
        startDate: ticket.event.startDate,
        venueName: ticket.event.venue?.name,
        hoursBefore,
      }),
    });
    await db.notification.create({
      data: {
        userId: ticket.userId,
        type: "EVENT_REMINDER",
        title: `${ticket.event.title} is coming up`,
        body: `Reminder sent for ${ticket.event.title} [${flagKey}]`,
      },
    });
    sent++;
  }
  return sent;
}

async function handle(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [h24, h1] = await Promise.all([remind(24), remind(1)]);
  return NextResponse.json({ sent24h: h24, sent1h: h1 });
}

export const GET = handle;
export const POST = handle;
