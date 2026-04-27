export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { passwordChangeSchema, profileSchema } from "@/lib/validators";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ user: null });
  }

  if (session.role === "ADMIN") {
    const admin = await prisma.adminUser.findUnique({ where: { id: session.adminId } });
    return NextResponse.json({
      user: admin
        ? { id: admin.id, username: admin.username, email: admin.email, role: "ADMIN" }
        : null,
    });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });

  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: "USER",
        }
      : null,
  });
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "USER" || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.type === "password") {
      const parsed = passwordChangeSchema.parse(body);

      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const valid = await bcrypt.compare(parsed.currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(parsed.newPassword, 12);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

      return NextResponse.json({ success: true });
    }

    const parsed = profileSchema.parse(body);

    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: session.userId },
        OR: [{ username: parsed.username }, { email: parsed.email }, { phone: parsed.phone }],
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: "Username, email or phone already exists" }, { status: 409 });
    }

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        username: parsed.username,
        email: parsed.email,
        phone: parsed.phone,
      },
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
      { error: error?.issues?.[0]?.message || "Invalid profile update request" },
      { status: 400 },
    );
  }
}

