export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { signupSchema } from "@/lib/validators";

async function generateUniquePhone() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `9${Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(9, "0")}`;
    const exists = await prisma.user.findUnique({
      where: { phone: candidate },
      select: { id: true },
    });
    if (!exists) {
      return candidate;
    }
  }

  return `9${Date.now().toString().slice(-9)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.parse(body);
    const username = (parsed.name || parsed.username || "").trim();
    const email = parsed.email.toLowerCase();
    const phone = parsed.phone?.trim() || (await generateUniquePhone());

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { phone },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Name, email or phone already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        phone,
        passwordHash,
      },
    });

    await setSessionCookie({
      role: "USER",
      userId: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Invalid signup request" },
      { status: 400 },
    );
  }
}

