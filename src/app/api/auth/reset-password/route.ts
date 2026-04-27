export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validators";

const RESET_TOKEN_PREFIX = "pwreset_";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.parse(body);
    const token = `${RESET_TOKEN_PREFIX}${parsed.token.trim()}`;

    const resetSession = await prisma.session.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!resetSession || !resetSession.userId || resetSession.expiresAt < new Date()) {
      return NextResponse.json({ error: "Reset link is invalid or expired" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetSession.userId },
        data: { passwordHash },
      }),
      prisma.session.delete({ where: { id: resetSession.id } }),
    ]);

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Invalid reset password request" },
      { status: 400 },
    );
  }
}
