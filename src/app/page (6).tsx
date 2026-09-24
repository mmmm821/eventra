import Link from "next/link";
import { CalendarDays, Ticket, IndianRupee, QrCode, Plus, ListChecks } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrganizerStats } from "@/lib/organizer/stats";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import { SalesTrendChart, CategoryBreakdownChart } from "@/components/organizer/sales-chart";

export const dynamic = "force-dynamic";

export default async function OrganizerDashboard() {
  const session = await auth();
  const stats = await getOrganizerStats((session!.user as any).id);

  return (
    <div className="container py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">Organizer Dashboard</h1>
          <p className="text-white/50 mt-1">Manage your events, ticket sales, and check-ins.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/scanner"><QrCode className="h-4 w-4" /> Scan Tickets</Link>
          </Button>
          <Button asChild>
            <Link href="/organizer/events/new"><Plus className="h-4 w-4" /> Create Event</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={CalendarDays} label="Total Events" value={stats.totalEvents} />
        <StatCard icon={CalendarDays} label="Upcoming" value={stats.upcomingEvents} />
        <StatCard icon={Ticket} label="Tickets Sold" value={stats.ticketsSold} />
        <StatCard icon={IndianRupee} label="Total Revenue" value={formatINR(stats.totalRevenue)} isText />
        <StatCard icon={QrCode} label="Today's Check-ins" value={stats.todaysCheckIns} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-8">
        <Card className="p-5">
          <p className="text-sm font-medium text-white/80 mb-2">Ticket sales over time</p>
          <SalesTrendChart data={stats.salesTrend} />
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-white/80 mb-2">Sales by category</p>
          <CategoryBreakdownChart data={stats.categoryBreakdown} />
        </Card>
      </div>

      <div className="mt-8">
        <Button variant="secondary" asChild>
          <Link href="/organizer/events"><ListChecks className="h-4 w-4" /> Manage all events</Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, isText }: { icon: any; label: string; value: number | string; isText?: boolean }) {
  return (
    <Card className="p-4">
      <Icon className="h-4 w-4 text-violet-400 mb-2" />
      <p className={`font-display font-semibold text-white ${isText ? "text-lg" : "text-2xl"}`}>{value}</p>
      <p className="text-xs text-white/45 mt-0.5">{label}</p>
    </Card>
  );
}
