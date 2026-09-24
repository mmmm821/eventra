import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [totalUsers, totalOrganizers, totalEvents, totalTickets, revenueAgg, activeEvents] = await Promise.all([
    db.user.count({ where: { role: "ATTENDEE" } }),
    db.organizerProfile.count(),
    db.event.count(),
    db.ticket.count({ where: { status: { in: ["CONFIRMED", "USED"] } } }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    db.event.count({ where: { status: "PUBLISHED", startDate: { gte: new Date() } } }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalOrganizers,
    totalEvents,
    totalTickets,
    revenue: revenueAgg._sum.amount ?? 0,
    activeEvents,
  });
}
