export const dynamic = "force-dynamic";

import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";

const RESET_TOKEN_PREFIX = "pwreset_";
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.parse(body);
    const identifier = parsed.identifier.trim();
    const normalizedEmail = identifier.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: identifier }, { phone: identifier }],
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If account exists, reset link has been generated.",
      });
    }

    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        token: { startsWith: RESET_TOKEN_PREFIX },
      },
    });

    const rawToken = randomBytes(24).toString("hex");
    const sessionToken = `${RESET_TOKEN_PREFIX}${rawToken}`;

    await prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `/reset-password?token=${encodeURIComponent(rawToken)}`;

    return NextResponse.json({
      success: true,
      message: "If account exists, reset link has been generated.",
      resetUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Invalid forgot password request" },
      { status: 400 },
    );
  }
}
