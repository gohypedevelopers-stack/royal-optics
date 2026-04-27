export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { searchProductIds } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q")?.trim() || "";
  const categorySlug = searchParams.get("category")?.trim() || "";
  const color = searchParams.get("color")?.trim() || "";
  const shape = searchParams.get("shape")?.trim() || "";
  const minPrice = Number(searchParams.get("minPrice") || 0);
  const maxPriceRaw = Number(searchParams.get("maxPrice") || 0);
  const maxPrice = maxPriceRaw > 0 ? maxPriceRaw : undefined;
  const sort = searchParams.get("sort") || "relevance";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(60, Math.max(1, Number(searchParams.get("limit") || 12)));

  let categoryIds: string[] | undefined;
  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug }, select: { id: true } });
    if (category) {
      const children = await prisma.category.findMany({ where: { parentId: category.id }, select: { id: true } });
      categoryIds = [category.id, ...children.map((child) => child.id)];
    } else {
      categoryIds = [];
    }
  }

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
    ...(shape ? { shape: { equals: shape, mode: "insensitive" } } : {}),
    ...(color ? { colors: { has: color } } : {}),
    price: {
      gte: minPrice || 0,
      ...(maxPrice ? { lte: maxPrice } : {}),
    },
  };

  if (q) {
    const ids = await searchProductIds(q, 100);
    if (!ids.length) {
      return NextResponse.json({ products: [], total: 0, page, limit });
    }
    where.id = { in: ids };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price_low_high"
      ? [{ price: "asc" }]
      : sort === "price_high_low"
        ? [{ price: "desc" }]
        : sort === "newest"
          ? [{ createdAt: "desc" }]
          : [{ isTrending: "desc" }, { createdAt: "desc" }];

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true, parentId: true },
        },
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total, page, limit });
}

