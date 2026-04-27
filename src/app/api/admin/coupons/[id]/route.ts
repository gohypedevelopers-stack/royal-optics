import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { promoCodeSchema } from "@/lib/validators";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

function toDateOrNull(value?: string) {
  return value ? new Date(value) : null;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const item = await prisma.promoCode.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  try {
    const payload = promoCodeSchema.parse(await request.json());
    const item = await prisma.promoCode.update({
      where: { id: params.id },
      data: {
        code: payload.code.trim().toUpperCase(),
        description: payload.description?.trim() || null,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        minOrderAmount: payload.minOrderAmount ?? null,
        maxDiscountAmount: payload.maxDiscountAmount ?? null,
        startsAt: toDateOrNull(payload.startsAt),
        endsAt: toDateOrNull(payload.endsAt),
        usageLimit: payload.usageLimit ?? null,
        isActive: payload.isActive,
      },
    });
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Failed to update coupon" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();
  await prisma.promoCode.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

