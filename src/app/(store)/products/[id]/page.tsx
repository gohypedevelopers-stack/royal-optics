export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, PackageOpen } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductDetails from "@/components/ProductDetails";
import ProductImageGallery from "@/components/ProductImageGallery";
import { getSiteProfile } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const param = id;

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
    <div className="mx-auto w-full max-w-[1500px] px-2.5 pb-28 pt-2.5 sm:px-5 sm:pt-4 lg:px-8 lg:pb-10 lg:pt-6">
      <nav className="mb-2.5 flex flex-wrap items-center gap-1 text-[0.72rem] text-slate-500 sm:mb-4 sm:gap-1.5 sm:text-sm">
        <Link href="/" className="transition hover:text-slate-900">
          Home
        </Link>
        <ChevronRight size={15} className="text-slate-400" />
        <Link href="/products" className="transition hover:text-slate-900">
          Products
        </Link>
        {product.category ? (
          <>
            <ChevronRight size={15} className="text-slate-400" />
            <Link href={`/products?category=${product.category.slug}`} className="transition hover:text-slate-900">
              {product.category.name}
            </Link>
          </>
        ) : null}
        <ChevronRight size={15} className="text-slate-400" />
        <span className="font-semibold text-slate-700">{product.name}</span>
      </nav>

      <section className="relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm sm:rounded-3xl sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.09),transparent_38%)]" />
        <div className="relative grid gap-4 sm:gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <ProductImageGallery images={product.images} name={product.name} mainImage={product.mainImage} />
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

      <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:mt-8 sm:rounded-2xl sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <PackageOpen size={22} className="text-blue-600" />
              Related Products
            </h2>
            <p className="text-sm text-slate-500">More picks from the same category that match this shopping journey.</p>
          </div>
        </div>
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
                  mainImage: item.mainImage,
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


