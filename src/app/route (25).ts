import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";

export async function POST(req: Request) {
  const { email } = await req.json();
  const normalized = String(email ?? "").toLowerCase().trim();

  const user = await db.user.findUnique({ where: { email: normalized } });
  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.verificationToken.create({
      data: { identifier: normalized, token, expires: new Date(Date.now() + 60 * 60_000) },
    });
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(normalized)}`;
    await sendMail({
      to: normalized,
      subject: "Reset your EVENTRA password",
      html: `<p>Click below to set a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
