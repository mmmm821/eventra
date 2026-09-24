import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ScannerClient } from "@/components/scanner/scanner-client";

export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const session = await auth();
  const userId = (session!.user as any).id;
  const role = (session!.user as any).role;

  const events =
    role === "ADMIN"
      ? await db.event.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, startDate: true }, orderBy: { startDate: "desc" } })
      : await db.event.findMany({
          where: {
            status: "PUBLISHED",
            OR: [{ organizerId: userId }, { staff: { some: { userId } } }],
          },
          select: { id: true, title: true, startDate: true },
          orderBy: { startDate: "desc" },
        });

  return <ScannerClient events={events} />;
}
