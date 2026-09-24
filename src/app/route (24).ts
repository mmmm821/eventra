import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, note } = await req.json(); // action: "approve" | "reject"
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'." }, { status: 400 });
  }

  const event = await db.event.update({
    where: { id: params.id },
    data: {
      status: action === "approve" ? "PUBLISHED" : "REJECTED",
      rejectionNote: action === "reject" ? note : null,
    },
    include: { organizer: true },
  });

  await db.notification.create({
    data: {
      userId: event.organizerId,
      type: action === "approve" ? "EVENT_APPROVED" : "EVENT_REJECTED",
      title: action === "approve" ? "Event approved" : "Event needs changes",
      body:
        action === "approve"
          ? `${event.title} is now live on EVENTRA.`
          : `${event.title} wasn't approved. ${note ?? ""}`.trim(),
    },
  });

  await sendMail({
    to: event.organizer.email,
    subject: action === "approve" ? `${event.title} is live!` : `${event.title} needs a few changes`,
    html: `<p>${action === "approve" ? "Your event is now published on EVENTRA." : `Your event wasn't approved. ${note ?? ""}`}</p>`,
  });

  return NextResponse.json({ event });
}
