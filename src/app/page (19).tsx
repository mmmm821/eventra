import Link from "next/link";
import { Users, Building2, CalendarDays, Ticket, IndianRupee, Activity, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [totalUsers, totalOrganizers, totalEvents, totalTickets, revenueAgg, activeEvents, pendingApprovals] = await Promise.all([
    db.user.count({ where: { role: "ATTENDEE" } }),
    db.organizerProfile.count(),
    db.event.count(),
    db.ticket.count({ where: { status: { in: ["CONFIRMED", "USED"] } } }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    db.event.count({ where: { status: "PUBLISHED", startDate: { gte: new Date() } } }),
    db.event.count({ where: { status: "PENDING_APPROVAL" } }),
  ]);

  return (
    <div className="container py-10">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="h-5 w-5 text-violet-400" />
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">Admin</h1>
      </div>
      <p className="text-white/50 mb-8">Platform-wide overview and moderation.</p>

      {pendingApprovals > 0 && (
        <Card className="p-4 mb-6 border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
          <p className="text-sm text-amber-300">{pendingApprovals} event{pendingApprovals !== 1 ? "s" : ""} waiting for approval</p>
          <Button size="sm" variant="outline" asChild><Link href="/admin/events?status=PENDING_APPROVAL">Review now</Link></Button>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat icon={Users} label="Total Users" value={totalUsers} />
        <Stat icon={Building2} label="Organizers" value={totalOrganizers} />
        <Stat icon={CalendarDays} label="Total Events" value={totalEvents} />
        <Stat icon={Ticket} label="Total Tickets" value={totalTickets} />
        <Stat icon={IndianRupee} label="Revenue" value={formatINR(revenueAgg._sum.amount ?? 0)} isText />
        <Stat icon={Activity} label="Active Events" value={activeEvents} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        <Button variant="secondary" className="h-16" asChild><Link href="/admin/events">Manage events</Link></Button>
        <Button variant="secondary" className="h-16" asChild><Link href="/admin/users">Manage users</Link></Button>
        <Button variant="secondary" className="h-16" asChild><Link href="/admin/transactions">View transactions</Link></Button>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, isText }: { icon: any; label: string; value: number | string; isText?: boolean }) {
  return (
    <Card className="p-4">
      <Icon className="h-4 w-4 text-violet-400 mb-2" />
      <p className={`font-display font-semibold text-white ${isText ? "text-lg" : "text-2xl"}`}>{value}</p>
      <p className="text-xs text-white/45 mt-0.5">{label}</p>
    </Card>
  );
}
