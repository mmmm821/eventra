import { db } from "@/lib/db";
import { isTrending, isSellingFast, isNew } from "@/lib/recommendations/engine";
import type { EventCardData, EventTag } from "@/components/events/event-card";
import type { Prisma } from "@prisma/client";

const cardInclude = {
  venue: true,
  ticketTypes: true,
  _count: { select: { tickets: true, favorites: true } },
} satisfies Prisma.EventInclude;

type RawEvent = Prisma.EventGetPayload<{ include: typeof cardInclude }>;

export function toCardData(event: RawEvent): EventCardData {
  const prices = event.ticketTypes.map((t) => t.price);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const totalQty = event.ticketTypes.reduce((s, t) => s + t.quantityTotal, 0);
  const soldQty = event.ticketTypes.reduce((s, t) => s + t.quantitySold, 0);
  const remaining = totalQty ? totalQty - soldQty : null;

  const tags: EventTag[] = [];
  if (isTrending(event._count.tickets, event._count.favorites)) tags.push("trending");
  if (isSellingFast(soldQty, totalQty)) tags.push("selling-fast");
  if (isNew(event.createdAt)) tags.push("new");
  if (event.audience === "COLLEGE") tags.push("student");
  if (minPrice === 0 || minPrice === null) tags.push("free");
  else if (minPrice < 20000) tags.push("budget");
  if (event._count.favorites >= 30) tags.push("popular");

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    bannerUrl: event.bannerUrl,
    category: event.category,
    startDate: event.startDate,
    city: event.venue?.city,
    venueName: event.venue?.name,
    minPrice,
    audience: event.audience,
    tags,
    ticketsRemaining: remaining,
  };
}

export async function getPublishedEvents(where: Prisma.EventWhereInput = {}, take = 12, orderBy: Prisma.EventOrderByWithRelationInput = { startDate: "asc" }) {
  const events = await db.event.findMany({
    where: { status: "PUBLISHED", startDate: { gte: new Date() }, ...where },
    include: cardInclude,
    orderBy,
    take,
  });
  return events.map(toCardData);
}

export type EventSort = "recommended" | "trending" | "newest" | "price-asc" | "date";

export async function searchEvents(params: {
  q?: string;
  category?: string;
  audience?: "COLLEGE" | "PUBLIC";
  format?: "ONLINE" | "OFFLINE";
  free?: boolean;
  sort?: EventSort;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 12;

  const where: Prisma.EventWhereInput = {
    status: "PUBLISHED",
    startDate: { gte: new Date() },
  };
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
      { category: { contains: params.q, mode: "insensitive" } },
      { venue: { is: { city: { contains: params.q, mode: "insensitive" } } } },
    ];
  }
  if (params.category) where.category = params.category;
  if (params.audience) where.audience = params.audience;
  if (params.format) where.format = params.format;

  let orderBy: Prisma.EventOrderByWithRelationInput = { startDate: "asc" };
  if (params.sort === "newest") orderBy = { createdAt: "desc" };
  if (params.sort === "trending") orderBy = { tickets: { _count: "desc" } };
  if (params.sort === "date") orderBy = { startDate: "asc" };

  const [total, events] = await Promise.all([
    db.event.count({ where }),
    db.event.findMany({
      where,
      include: cardInclude,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  let cards = events.map(toCardData);

  if (params.free) cards = cards.filter((c) => !c.minPrice);
  if (params.sort === "price-asc") cards = cards.sort((a, b) => (a.minPrice ?? 0) - (b.minPrice ?? 0));

  return { cards, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function trackEventView(userId: string, eventId: string) {
  // Avoid spamming a row per page refresh — only log once every 5 minutes
  // per user per event.
  const recent = await db.eventView.findFirst({
    where: { userId, eventId, createdAt: { gte: new Date(Date.now() - 5 * 60_000) } },
  });
  if (!recent) {
    await db.eventView.create({ data: { userId, eventId } });
  }
}

/** Real (not simulated) count of distinct viewers in the last 15 minutes.
 * Returns null when there isn't enough signal to show a meaningful number —
 * callers should hide the "N people viewing" UI in that case rather than
 * fabricate a figure. */
export async function getRecentViewerCount(eventId: string) {
  const views = await db.eventView.findMany({
    where: { eventId, createdAt: { gte: new Date(Date.now() - 15 * 60_000) } },
    distinct: ["userId"],
    select: { userId: true },
  });
  return views.length >= 2 ? views.length : null;
}

export async function getTrendingEvents(take = 12) {
  const events = await db.event.findMany({
    where: { status: "PUBLISHED", startDate: { gte: new Date() } },
    include: cardInclude,
    orderBy: [{ tickets: { _count: "desc" } }],
    take,
  });
  return events.map(toCardData);
}
