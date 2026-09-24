"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#8B5CF6", "#3B82F6", "#EC4899", "#F59E0B", "#10B981", "#EF4444"];

export function SalesTrendChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-sm text-white/30">No sales yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ background: "#171826", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
        <Area type="monotone" dataKey="count" stroke="#A78BFA" fill="url(#salesFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBreakdownChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return <div className="h-56 flex items-center justify-center text-sm text-white/30">No ticket sales yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: "#171826", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
