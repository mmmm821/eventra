"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  "All", "Concerts", "Sports", "Comedy", "Technology", "Workshops", "College",
  "Cultural", "Food", "Gaming", "Business", "Networking", "Exhibitions", "Other",
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "date", label: "Date" },
];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const activeCategory = searchParams.get("category") ?? "All";
  const activeSort = searchParams.get("sort") ?? "recommended";
  const audience = searchParams.get("audience");
  const free = searchParams.get("free") === "true";
  const format = searchParams.get("format");

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "" || value === "All") params.delete(key);
      else params.set(key, value);
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          className="flex-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 h-11"
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q);
          }}
        >
          <Search className="h-4 w-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events, artists, venues..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
          />
        </form>

        <Select value={activeSort} onValueChange={(v) => setParam("sort", v)}>
          <SelectTrigger className="w-full sm:w-52">
            <SlidersHorizontal className="h-4 w-4 mr-2 text-white/40" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setParam("category", c)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm border transition-colors ${
              activeCategory === c
                ? "bg-violet-600 border-violet-600 text-white"
                : "border-white/10 bg-white/[0.03] text-white/65 hover:text-white hover:border-white/20"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={audience === "COLLEGE"} onClick={() => setParam("audience", audience === "COLLEGE" ? null : "COLLEGE")}>College</FilterChip>
        <FilterChip active={audience === "PUBLIC"} onClick={() => setParam("audience", audience === "PUBLIC" ? null : "PUBLIC")}>Public</FilterChip>
        <FilterChip active={format === "ONLINE"} onClick={() => setParam("format", format === "ONLINE" ? null : "ONLINE")}>Online</FilterChip>
        <FilterChip active={format === "OFFLINE"} onClick={() => setParam("format", format === "OFFLINE" ? null : "OFFLINE")}>Offline</FilterChip>
        <FilterChip active={free} onClick={() => setParam("free", free ? null : "true")}>Free only</FilterChip>
      </div>
    </div>
  );
}

function FilterChip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}>
      <Badge variant={active ? "violet" : "outline"} className="cursor-pointer px-3 py-1.5">
        {children}
      </Badge>
    </button>
  );
}
