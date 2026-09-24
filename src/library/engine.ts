import { db } from "@/lib/db";

/**
 * A deterministic, explainable recommendation algorithm — deliberately not
 * an ML model. It scores each candidate PUBLISHED event for a user from:
 *
 *   +3  category matches a category the user has booked before
 *   +2  category matches a category the user has favorited
 *   +1  category matches a category the user has merely viewed
 *   +2  category is in the user's declared `interests`
 *   +1  event is trending (see isTrending below)
 *   +1  event is starting soon (within 14 days) — recency bonus
 *
 * Ties break by soonest start date. This runs entirely in SQL-adjacent
 * Prisma queries plus in-memory scoring, so it stays fast without a
 * dedicated ML pipeline, and every score is auditable.
 */
export async function getRecommendedEvents(userId: string, take = 8) {
  const [user, bookings, favorites, views] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { interests: true } }),
    db.booking.findMany({
      where: { userId, status: "CONFIRMED" },
      select: { event: { select: { category: true } } },
    }),
    db.favorite.findMany({ where: { userId }, select: { event: { select: { category: true } } } }),
    db.eventView.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { event: { select: { category: true } } },
    }),
  ]);

  const bookedCategories = new Set(bookings.map((b) => b.event.category));
  const favoritedCategories = new Set(favorites.map((f) => f.event.category));
  const viewedCategories = new Set(views.map((v) => v.event.category));
  const interestCategories = new Set(user?.interests ?? []);

  const candidates = await db.event.findMany({
    where: { status: "PUBLISHED", startDate: { gte: new Date() } },
    include: { venue: true, ticketTypes: true, _count: { select: { tickets: true, favorites: true } } },
    take: 100,
    orderBy: { startDate: "asc" },
  });

  const now = Date.now();
  const scored = candidates.map((event) => {
    let score = 0;
    if (bookedCategories.has(event.category)) score += 3;
    if (favoritedCategories.has(event.category)) score += 2;
    if (viewedCategories.has(event.category)) score += 1;
    if (interestCategories.has(event.category)) score += 2;
    if (isTrending(event._count.tickets, event._count.favorites)) score += 1;

    const daysAway = (new Date(event.startDate).getTime() - now) / 86_400_000;
    if (daysAway <= 14) score += 1;

    return { event, score, daysAway };
  });

  scored.sort((a, b) => b.score - a.score || a.daysAway - b.daysAway);

  return scored.slice(0, take).map((s) => s.event);
}

/** An event is "trending" once it has meaningfully more tickets sold or
 * saves than a typical event — used both by recommendations and the
 * 🔥 Trending tag on cards. Thresholds are intentionally simple and tunable. */
export function isTrending(ticketsSold: number, favorites: number) {
  return ticketsSold >= 25 || favorites >= 15;
}

export function isSellingFast(quantitySold: number, quantityTotal: number) {
  if (quantityTotal === 0) return false;
  return quantitySold / quantityTotal >= 0.8;
}

export function isNew(createdAt: Date) {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return days <= 5;
}
