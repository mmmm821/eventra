import { db } from "@/lib/db";

export async function getOrganizerStats(organizerId: string) {
  const events = await db.event.findMany({ where: { organizerId }, select: { id: true, status: true, startDate: true, category: true } });
  const eventIds = events.map((e) => e.id);
  const now = new Date();
  const todayStart = new Date(now.toDateString());

  const [ticketsSold, revenueAgg, todaysCheckIns, ticketsByCategory, recentTickets] = await Promise.all([
    db.ticket.count({ where: { eventId: { in: eventIds }, status: { in: ["CONFIRMED", "USED"] } } }),
    db.payment.aggregate({ where: { booking: { eventId: { in: eventIds } }, status: "PAID" }, _sum: { amount: true } }),
    db.checkIn.count({ where: { eventId: { in: eventIds }, scannedAt: { gte: todayStart } } }),
    db.ticket.groupBy({ by: ["eventId"], where: { eventId: { in: eventIds }, status: { in: ["CONFIRMED", "USED"] } }, _count: true }),
    db.ticket.findMany({
      where: { eventId: { in: eventIds }, status: { in: ["CONFIRMED", "USED"] } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 500,
    }),
  ]);

  const categoryMap = new Map(events.map((e) => [e.id, e.category]));
  const categoryBreakdown = ticketsByCategory.reduce<Record<string, number>>((acc, row) => {
    const cat = categoryMap.get(row.eventId) ?? "Other";
    acc[cat] = (acc[cat] ?? 0) + row._count;
    return acc;
  }, {});

  const salesByDay = recentTickets.reduce<Record<string, number>>((acc, t) => {
    const key = t.createdAt.toISOString().slice(0, 10);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalEvents: events.length,
    upcomingEvents: events.filter((e) => e.startDate > now && e.status === "PUBLISHED").length,
    ticketsSold,
    totalRevenue: revenueAgg._sum.amount ?? 0,
    todaysCheckIns,
    categoryBreakdown: Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })),
    salesTrend: Object.entries(salesByDay).map(([date, count]) => ({ date, count })),
  };
}
