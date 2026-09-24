import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form for errors.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, password, role, organization } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email: normalizedEmail,
      phone,
      passwordHash,
      // Admin is never selectable from public signup — role is constrained
      // by the Zod schema to ATTENDEE | ORGANIZER only.
      role,
      ...(role === "ORGANIZER"
        ? { organizerProfile: { create: { organization: organization || `${name}'s organization` } } }
        : {}),
    },
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
