"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const FLOATING_CHIPS = [
  { label: "TechFest 2026", pos: "top-[8%] left-[4%]", delay: 0 },
  { label: "Rhythm Beats Fest", pos: "top-[62%] left-[2%]", delay: 0.15 },
  { label: "Stand-up Night", pos: "top-[14%] right-[3%]", delay: 0.3 },
  { label: "Football Cup Finals", pos: "top-[68%] right-[5%]", delay: 0.45 },
];

export function Hero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query ? `/events?q=${encodeURIComponent(query)}` : "/events");
  };

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full bg-violet-600/25 blur-[120px]" />
        <div className="absolute top-20 right-0 h-[360px] w-[360px] rounded-full bg-pink-500/15 blur-[100px]" />
      </div>

      {FLOATING_CHIPS.map((chip) => (
        <motion.div
          key={chip.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: chip.delay }}
          className={`hidden lg:flex absolute ${chip.pos} items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md px-3.5 py-2.5 text-xs text-white/70`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {chip.label}
        </motion.div>
      ))}

      <div className="container relative pt-16 pb-20 sm:pt-24 sm:pb-28 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-white/60 mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 text-violet-400" />
          Now booking college fests and public events across India
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="font-display text-4xl sm:text-6xl font-semibold tracking-tight text-white max-w-3xl leading-[1.08]"
        >
          Discover what&rsquo;s happening around you.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-5 text-base sm:text-lg text-white/55 max-w-xl"
        >
          Find events. Book instantly. Experience more.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          onSubmit={onSearch}
          className="mt-9 w-full max-w-xl"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-2 pl-4 focus-within:border-violet-500/50 transition-colors">
            <Search className="h-4.5 w-4.5 text-white/40 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, artists, venues, categories..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none py-2.5"
            />
            <Button type="submit" size="sm" className="shrink-0">
              Search
            </Button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.28 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" asChild>
            <a href="/events">
              Explore Events <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button size="lg" variant="secondary" asChild>
            <a href="/organizer">Host an Event</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
