import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatINR } from "@/lib/utils";

export type EventCardData = {
  id: string;
  slug: string;
  title: string;
  bannerUrl: string | null;
  category: string;
  startDate: Date | string;
  city?: string | null;
  venueName?: string | null;
  minPrice: number | null;
  audience: "COLLEGE" | "PUBLIC";
  tags?: EventTag[];
  ticketsRemaining?: number | null;
};

export type EventTag = "trending" | "selling-fast" | "new" | "student" | "budget" | "popular" | "free";

const TAG_META: Record<EventTag, { label: string; variant: any }> = {
  trending: { label: "🔥 Trending", variant: "pink" },
  "selling-fast": { label: "⚡ Selling Fast", variant: "amber" },
  new: { label: "✨ New", variant: "violet" },
  student: { label: "🎓 Student Friendly", variant: "default" },
  budget: { label: "💰 Budget Friendly", variant: "green" },
  popular: { label: "🏆 Popular", variant: "amber" },
  free: { label: "🆓 Free", variant: "green" },
};

export function EventCard({ event }: { event: EventCardData }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block shrink-0 w-[270px] sm:w-[290px] rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.03] hover:border-white/20 transition-colors duration-200"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-violet-900/40 to-blue-900/40">
        {event.bannerUrl ? (
          <Image
            src={event.bannerUrl}
            alt={event.title}
            fill
            sizes="290px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 font-display text-3xl">
            EVENTRA
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        {event.tags && event.tags.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
            {event.tags.slice(0, 2).map((t) => (
              <Badge key={t} variant={TAG_META[t].variant} className="backdrop-blur-sm bg-black/40 border-none text-[11px]">
                {TAG_META[t].label}
              </Badge>
            ))}
          </div>
        )}

        <Badge variant="outline" className="absolute top-3 right-3 backdrop-blur-sm bg-black/40 border-white/20">
          {event.audience === "COLLEGE" ? "College" : event.category}
        </Badge>

        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-display font-semibold leading-snug line-clamp-2">{event.title}</p>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-white/55">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {formatEventDate(event.startDate)}
        </div>
        {event.venueName && (
          <div className="flex items-center gap-1.5 text-xs text-white/55">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {event.venueName}
              {event.city ? `, ${event.city}` : ""}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-white">
            {event.minPrice === null || event.minPrice === 0 ? "Free" : `From ${formatINR(event.minPrice)}`}
          </span>
          {typeof event.ticketsRemaining === "number" && event.ticketsRemaining <= 20 && (
            <span className="text-[11px] text-amber-400">{event.ticketsRemaining} left</span>
          )}
        </div>
      </div>
    </Link>
  );
}
