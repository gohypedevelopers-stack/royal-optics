import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseLimit, parsePage } from "@/lib/admin";
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

export async function GET(request: Request) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const active = searchParams.get("active")?.trim() || "";
  const discountType = searchParams.get("discountType")?.trim() || "";
  const page = parsePage(searchParams.get("page"), 1);
  const limit = parseLimit(searchParams.get("limit"), 10, 100);

  const where: Prisma.PromoCodeWhereInput = {
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(active === "active" ? { isActive: true } : {}),
    ...(active === "inactive" ? { isActive: false } : {}),
    ...(discountType ? { discountType: discountType as any } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.promoCode.count({ where }),
  ]);

  return NextResponse.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function POST(request: Request) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  try {
    const payload = promoCodeSchema.parse(await request.json());
    const item = await prisma.promoCode.create({
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
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Failed to create coupon" }, { status: 400 });
  }
}

