import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isSuspended } = await req.json();
  const user = await db.user.update({
    where: { id: params.id },
    data: { isSuspended: !!isSuspended },
    select: { id: true, name: true, email: true, isSuspended: true },
  });
  return NextResponse.json({ user });
}
