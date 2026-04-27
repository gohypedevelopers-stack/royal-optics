export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { mergeGuestStateToUser } from "@/lib/cart";
import { GUEST_TOKEN_COOKIE } from "@/lib/guest";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);

    if (parsed.asAdmin) {
      const admin = await prisma.adminUser.findFirst({
        where: {
          OR: [{ username: parsed.identifier }, { email: parsed.identifier.toLowerCase() }],
        },
      });

      if (!admin || !(await bcrypt.compare(parsed.password, admin.passwordHash))) {
        return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
      }

      await setSessionCookie({
        role: "ADMIN",
        adminId: admin.id,
        username: admin.username,
        email: admin.email,
      });

      return NextResponse.json({ success: true, role: "ADMIN" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: parsed.identifier },
          { email: parsed.identifier.toLowerCase() },
          { phone: parsed.identifier },
        ],
      },
    });

    if (!user || !(await bcrypt.compare(parsed.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid login credentials" }, { status: 401 });
    }

    const guestToken = cookies().get(GUEST_TOKEN_COOKIE)?.value ?? null;
    await mergeGuestStateToUser(user.id, guestToken);

    await setSessionCookie({
      role: "USER",
      userId: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
    });

    return NextResponse.json({ success: true, role: "USER" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Invalid login request" },
      { status: 400 },
    );
  }
}

