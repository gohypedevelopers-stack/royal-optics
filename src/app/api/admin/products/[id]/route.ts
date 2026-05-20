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

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const { id } = await params;
  const item = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      productColors: true,
    },
  });
  if (!item) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const { id } = await params;
  try {
    const payload = productSchema.parse(await request.json());
    const imageUrls = payload.additionalImages?.length ? payload.additionalImages : payload.imageUrls;
    const mainImage = payload.mainImage || imageUrls[0] || null;
    const featured = payload.featured || payload.isFeatured;

    // Combine mainImage and additionalImages so the primary image is always correct in ProductImage
    const combinedImages: string[] = [];
    if (mainImage) {
      combinedImages.push(mainImage);
    }
    imageUrls.forEach((url) => {
      if (url !== mainImage && !combinedImages.includes(url)) {
        combinedImages.push(url);
      }
    });

    const item = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
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

      await tx.productImage.deleteMany({ where: { productId: id } });
      if (combinedImages.length) {
        await tx.productImage.createMany({
          data: combinedImages.map((url, index) => ({
            productId: id,
            url,
            alt: payload.name,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        });
      }

      await tx.productColor.deleteMany({ where: { productId: id } });
      if (payload.availableColors.length) {
        await tx.productColor.createMany({
          data: payload.availableColors.map((color) => ({
            productId: id,
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

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await ensureAdmin();
  if (!session) return unauthorized();

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
