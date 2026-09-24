import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { SuspendToggle } from "@/components/admin/suspend-toggle";

export const dynamic = "force-dynamic";

const ROLE_VARIANT: Record<string, any> = {
  ATTENDEE: "outline",
  ORGANIZER: "violet",
  EVENT_STAFF: "amber",
  ADMIN: "pink",
};

export default async function AdminUsersPage({ searchParams }: { searchParams: { role?: string } }) {
  const users = await db.user.findMany({
    where: searchParams.role ? { role: searchParams.role as any } : {},
    select: { id: true, name: true, email: true, role: true, isSuspended: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="container py-10">
      <h1 className="font-display text-2xl font-semibold text-white mb-1">Users</h1>
      <p className="text-white/50 text-sm mb-6">{users.length} account{users.length !== 1 ? "s" : ""}</p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 text-xs border-b border-white/10">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0">
                <td className="p-3 text-white">{u.name}</td>
                <td className="p-3 text-white/60">{u.email}</td>
                <td className="p-3"><Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge></td>
                <td className="p-3 text-white/50">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(u.createdAt)}</td>
                <td className="p-3">{u.role !== "ADMIN" && <SuspendToggle userId={u.id} initialSuspended={u.isSuspended} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
