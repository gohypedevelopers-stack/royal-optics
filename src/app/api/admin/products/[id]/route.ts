import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { productSchema } from "@/lib/validators";
import { toSlug } from "@/lib/admin";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function ensureAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const item = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      productColors: true,
    },
  });
  if (!item) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  try {
    const payload = productSchema.parse(await request.json());
    const imageUrls = payload.additionalImages?.length ? payload.additionalImages : payload.imageUrls;
    const mainImage = payload.mainImage || imageUrls[0] || null;
    const featured = payload.featured || payload.isFeatured;

    const item = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: params.id },
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
        },
      });

      await tx.productImage.deleteMany({ where: { productId: params.id } });
      if (imageUrls.length) {
        await tx.productImage.createMany({
          data: imageUrls.map((url, index) => ({
            productId: params.id,
            url,
            alt: payload.name,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        });
      }

      await tx.productColor.deleteMany({ where: { productId: params.id } });
      if (payload.availableColors.length) {
        await tx.productColor.createMany({
          data: payload.availableColors.map((color) => ({
            productId: params.id,
            name: color.name,
            hexCode: color.hexCode,
          })),
        });
      }

      return product;
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    return NextResponse.json({ error: error?.issues?.[0]?.message || "Failed to update product" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
