export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminProductEditPage({ params }: { params: { id: string } }) {
  const [item, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        productColors: true,
      },
    }),
    prisma.category.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!item) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Product</CardTitle>
      </CardHeader>
      <CardContent>
        <ProductForm
          categories={categories}
          initial={{
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description,
            price: Number(item.price),
            stock: item.stock,
            rating: Number(item.rating),
            categoryId: item.categoryId,
            productType: item.productType as any,
            shape: item.shape || "",
            colors: item.colors,
            availableColors: item.productColors.map((color) => ({ name: color.name, hexCode: color.hexCode })),
            mainImage: item.mainImage || item.images[0]?.url || "",
            additionalImages: item.images.map((image) => image.url),
            customizationType: item.customizationType as any,
            powerRange: item.powerRange || "",
            status: item.status as any,
            isTrending: item.isTrending,
            isFeatured: item.isFeatured,
            featured: item.featured,
            imageUrls: item.images.map((image) => image.url),
          }}
        />
      </CardContent>
    </Card>
  );
}
