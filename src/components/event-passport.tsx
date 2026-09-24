import { Stamp } from "lucide-react";

export function EventPassport({ stamps }: { stamps: { category: string }[] }) {
  if (stamps.length === 0) return null;

  const byCategory = stamps.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/10 via-transparent to-blue-600/10 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Stamp className="h-4 w-4 text-violet-400" />
        <p className="text-sm font-medium text-white">Event Passport</p>
        <span className="text-xs text-white/40">· {stamps.length} event{stamps.length !== 1 ? "s" : ""} attended</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(byCategory).map(([category, count]) => (
          <div key={category} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">
            <span className="text-emerald-400">✓</span>
            {category} × {count}
          </div>
        ))}
      </div>
    </div>
  );
}
