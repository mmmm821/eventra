"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { EventCard, type EventCardData } from "./event-card";

export function EventCarousel({
  title,
  subtitle,
  events,
  seeAllHref,
}: {
  title: string;
  subtitle?: string;
  events: EventCardData[];
  seeAllHref?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    ref.current?.scrollBy({ left: dir === "left" ? -600 : 600, behavior: "smooth" });
  };

  if (events.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-white/50 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {seeAllHref && (
            <Link href={seeAllHref} className="hidden sm:flex items-center gap-1 text-sm text-violet-300 hover:text-violet-200">
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <button onClick={() => scroll("left")} className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/5">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll("right")} className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/5">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={ref} className="container flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
        {events.map((e) => (
          <div key={e.id} className="snap-start">
            <EventCard event={e} />
          </div>
        ))}
      </div>
    </section>
  );
}
