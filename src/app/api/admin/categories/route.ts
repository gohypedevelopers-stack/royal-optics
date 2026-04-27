import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { categorySchema } from "@/lib/validators";
import { parseLimit, parsePage, toSlug } from "@/lib/admin";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

async function resolveParentCategoryId(parentId?: string | null) {
  if (!parentId) return null;
  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true },
  });
  if (!parent) throw new Error("Parent category not found");
  if (parent.parentId) throw new Error("Only top-level categories can be selected as parent");
  return parent.id;
}

export async function GET(request: Request) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const page = parsePage(searchParams.get("page"), 1);
  const limit = parseLimit(searchParams.get("limit"), 10, 100);

  const where: Prisma.CategoryWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status: status as any } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.category.count({ where }),
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
    const payload = categorySchema.parse(await request.json());
    const slug = payload.slug?.trim() ? toSlug(payload.slug) : toSlug(payload.name);
    const parentId = await resolveParentCategoryId(payload.parentId || null);

    const item = await prisma.category.create({
      data: {
        name: payload.name,
        slug,
        description: payload.description || null,
        imageUrl: payload.imageUrl || null,
        status: payload.status,
        parentId,
      },
    });
    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Failed to create category" }, { status: 400 });
  }
}
