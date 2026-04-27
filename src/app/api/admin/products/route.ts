import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { productSchema } from "@/lib/validators";
import { parseLimit, parsePage, toSlug } from "@/lib/admin";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function GET(request: Request) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const categoryId = searchParams.get("categoryId")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const productType = searchParams.get("productType")?.trim() || "";
  const page = parsePage(searchParams.get("page"), 1);
  const limit = parseLimit(searchParams.get("limit"), 10, 100);

  const where: Prisma.ProductWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status: status as any } : {}),
    ...(productType ? { productType: productType as any } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        productColors: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
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
    const payload = productSchema.parse(await request.json());
    const imageUrls = payload.additionalImages?.length ? payload.additionalImages : payload.imageUrls;
    const mainImage = payload.mainImage || imageUrls[0] || null;
    const featured = payload.featured || payload.isFeatured;

    const product = await prisma.product.create({
      data: {
        name: payload.name,
        slug: payload.slug?.trim() ? toSlug(payload.slug) : toSlug(payload.name),
        description: payload.description,
        price: payload.price,
        stock: payload.stock,
        rating: payload.rating,
        categoryId: payload.categoryId,
        productType: payload.productType,
        shape: payload.shape || null,
        mainImage,
        colors: payload.colors,
        customizationType: payload.customizationType,
        powerRange: payload.powerRange || null,
        status: payload.status,
        isTrending: payload.isTrending,
        isFeatured: payload.isFeatured,
        featured,
        images: {
          create: imageUrls.map((url, index) => ({
            url,
            alt: payload.name,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        },
        productColors: {
          create: payload.availableColors.map((color) => ({
            name: color.name,
            hexCode: color.hexCode,
          })),
        },
      },
      include: { images: true, productColors: true },
    });

    return NextResponse.json({ success: true, item: product });
  } catch (error: any) {
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Failed to create product" }, { status: 400 });
  }
}
