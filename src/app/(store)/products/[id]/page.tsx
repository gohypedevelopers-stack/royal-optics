export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { PackageOpen } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductDetails from "@/components/ProductDetails";
import ProductImageGallery from "@/components/ProductImageGallery";
import { getSiteProfile } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const param = params.id;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: param }, { slug: param }],
      status: "ACTIVE",
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) {
    notFound();
  }

  const [relatedProducts, lensPrices, siteProfile] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
      },
      take: 4,
      orderBy: { isTrending: "desc" },
    }),
    prisma.lensPrice.findMany({ where: { isActive: true } }),
    getSiteProfile(),
  ]);

  const lensPriceMap = lensPrices.reduce<Record<string, number>>((acc, item) => {
    acc[item.key] = Number(item.value);
    return acc;
  }, {});

  return (
    <div className="mx-auto w-full max-w-[1500px] px-3 pb-10 pt-4 sm:px-5 lg:px-8 lg:pt-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.09),transparent_38%)]" />
        <div className="relative grid gap-6 xl:grid-cols-[1.07fr_0.93fr] xl:items-start">
          <ProductImageGallery images={product.images} name={product.name} />
          <ProductDetails
            product={{
              id: product.id,
              name: product.name,
              description: product.description,
              price: Number(product.price),
              rating: Number(product.rating),
              stock: product.stock,
              customizationType: product.customizationType,
              powerRange: product.powerRange,
              colors: product.colors,
              categoryName: product.category?.name,
            }}
            lensPrices={lensPriceMap}
            supportPhone={siteProfile.supportPhone}
          />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <PackageOpen size={22} className="text-blue-600" />
          Related Products
        </h2>
        {relatedProducts.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={{
                  id: item.id,
                  name: item.name,
                  slug: item.slug,
                  price: Number(item.price),
                  rating: Number(item.rating),
                  customizationType: item.customizationType,
                  images: item.images,
                  colors: item.colors,
                }}
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No related products available right now.</p>
        )}
      </section>
    </div>
  );
}


