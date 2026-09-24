"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Attendee = {
  id: string;
  attendeeName: string;
  userEmail: string;
  ticketType: string;
  ticketCode: string;
  paymentStatus: string;
  ticketStatus: string;
  checkedIn: boolean;
};

const STATUS_VARIANT: Record<string, any> = {
  CONFIRMED: "green",
  USED: "outline",
  CANCELLED: "red",
  REFUNDED: "amber",
  EXPIRED: "outline",
};

export function AttendeeTable({ attendees }: { attendees: Attendee[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return attendees.filter(
      (a) => a.attendeeName.toLowerCase().includes(q) || a.userEmail.toLowerCase().includes(q) || a.ticketCode.toLowerCase().includes(q)
    );
  }, [attendees, query]);

  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 h-11 mb-4 max-w-sm">
        <Search className="h-4 w-4 text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or booking ID"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 text-xs border-b border-white/10">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Ticket Type</th>
              <th className="p-3 font-medium">Booking ID</th>
              <th className="p-3 font-medium">Payment</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Checked In</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-white/5 last:border-0">
                <td className="p-3 text-white">{a.attendeeName}</td>
                <td className="p-3 text-white/60">{a.userEmail}</td>
                <td className="p-3 text-white/60">{a.ticketType}</td>
                <td className="p-3 text-white/60">{a.ticketCode}</td>
                <td className="p-3 text-white/60">{a.paymentStatus}</td>
                <td className="p-3"><Badge variant={STATUS_VARIANT[a.ticketStatus]}>{a.ticketStatus}</Badge></td>
                <td className="p-3">{a.checkedIn ? <span className="text-emerald-400">Yes</span> : <span className="text-white/30">No</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-white/40 text-sm py-8">No attendees match your search.</p>}
      </div>
    </div>
  );
}
