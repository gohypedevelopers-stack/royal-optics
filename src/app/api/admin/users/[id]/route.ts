import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const payloadSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
});

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  try {
    const body = payloadSchema.parse(await request.json());
    const item = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Failed to update user" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
