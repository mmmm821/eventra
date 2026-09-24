import Link from "next/link";
import { CalendarX } from "lucide-react";
import { FilterBar } from "@/components/events/filter-bar";
import { EventCard } from "@/components/events/event-card";
import { searchEvents, type EventSort } from "@/lib/events-query";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; audience?: string; format?: string; free?: string; sort?: string; page?: string };
}) {
  const { cards, total, page, totalPages } = await searchEvents({
    q: searchParams.q,
    category: searchParams.category,
    audience: searchParams.audience as "COLLEGE" | "PUBLIC" | undefined,
    format: searchParams.format as "ONLINE" | "OFFLINE" | undefined,
    free: searchParams.free === "true",
    sort: (searchParams.sort as EventSort) ?? "recommended",
    page: searchParams.page ? Number(searchParams.page) : 1,
  });

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">Explore events</h1>
        <p className="text-sm text-white/50 mt-1">{total} event{total !== 1 ? "s" : ""} found</p>
      </div>

      <FilterBar />

      {cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-4">
            <CalendarX className="h-6 w-6 text-white/40" />
          </div>
          <p className="text-white font-medium">No events found</p>
          <p className="text-sm text-white/50 mt-1 max-w-sm">
            Try a different search term, or clear your filters to see everything that's on right now.
          </p>
          <Link href="/events" className="mt-4 text-sm text-violet-300 hover:text-violet-200">
            Clear filters
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 mt-8">
            {cards.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PageLink key={p} page={p} active={p === page} searchParams={searchParams} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PageLink({ page, active, searchParams }: { page: number; active: boolean; searchParams: Record<string, string | undefined> }) {
  const params = new URLSearchParams(Object.entries(searchParams).filter(([, v]) => v) as [string, string][]);
  params.set("page", String(page));
  return (
    <Link
      href={`/events?${params.toString()}`}
      className={`h-9 w-9 flex items-center justify-center rounded-lg text-sm ${
        active ? "bg-violet-600 text-white" : "text-white/60 hover:bg-white/5"
      }`}
    >
      {page}
    </Link>
  );
}
