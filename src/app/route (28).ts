import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { email, token, password } = await req.json();
  if (!email || !token || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const record = await db.verificationToken.findUnique({ where: { identifier_token: { identifier: email, token } } });
  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.update({ where: { email }, data: { passwordHash } });
  await db.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });

  return NextResponse.json({ ok: true });
}
