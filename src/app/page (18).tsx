import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<string, any> = {
  CREATED: "outline",
  PENDING: "amber",
  PAID: "green",
  FAILED: "red",
  REFUNDED: "amber",
};

export default async function AdminTransactionsPage() {
  const payments = await db.payment.findMany({
    include: { booking: { include: { event: true, user: { select: { name: true, email: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="container py-10">
      <h1 className="font-display text-2xl font-semibold text-white mb-1">Transactions</h1>
      <p className="text-white/50 text-sm mb-6">{payments.length} transactions · {formatINR(totalPaid)} total collected</p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 text-xs border-b border-white/10">
              <th className="p-3 font-medium">Booking</th>
              <th className="p-3 font-medium">Event</th>
              <th className="p-3 font-medium">User</th>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">Provider</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0">
                <td className="p-3 text-white/70">{p.booking.bookingRef}</td>
                <td className="p-3 text-white/70">{p.booking.event.title}</td>
                <td className="p-3 text-white/60">{p.booking.user.name}</td>
                <td className="p-3 text-white">{formatINR(p.amount)}</td>
                <td className="p-3 text-white/50 capitalize">{p.provider}</td>
                <td className="p-3"><Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge></td>
                <td className="p-3 text-white/45">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p className="text-center text-white/40 py-16">No transactions yet.</p>}
      </div>
    </div>
  );
}
