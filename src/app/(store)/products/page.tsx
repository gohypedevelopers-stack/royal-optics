export const dynamic = "force-dynamic";
import Link from "next/link";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import { ShoppingCart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { searchProductIds } from "@/lib/search";

type SearchParamsInput = Record<string, string | string[] | undefined>;

function paramValue(input: string | string[] | undefined) {
  return Array.isArray(input) ? String(input[0] || "").trim() : String(input || "").trim();
}

function descendantIds(rootId: string, categories: Array<{ id: string; parentId: string | null }>) {
  const queue = [rootId];
  const visited = new Set<string>();
  const ids: string[] = [];

  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    ids.push(current);

    for (const item of categories) {
      if (item.parentId === current) queue.push(item.id);
    }
  }

  return ids;
}

function ancestorIds(rootId: string, categories: Array<{ id: string; parentId: string | null }>) {
  const byId = new Map(categories.map((item) => [item.id, item]));
  const ids: string[] = [];
  let current = byId.get(rootId);

  while (current?.parentId) {
    ids.push(current.parentId);
    current = byId.get(current.parentId);
  }

  return ids;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParamsInput }) {
  const query = paramValue(searchParams.q);
  const categorySlug = paramValue(searchParams.category);
  const sort = paramValue(searchParams.sort) || "relevance";

  const categories = await prisma.category.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, name: true, slug: true, parentId: true },
  });

  let categoryIds: string[] | undefined;
  if (categorySlug) {
    const category = categories.find((item) => item.slug === categorySlug);
    categoryIds = category
      ? Array.from(new Set([...descendantIds(category.id, categories), ...ancestorIds(category.id, categories)]))
      : [];
  }

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
  };

  if (query) {
    const ids = await searchProductIds(query, 120);
    where.id = { in: ids.length ? ids : [] };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price_low_high"
      ? [{ price: "asc" }]
      : sort === "price_high_low"
        ? [{ price: "desc" }]
        : sort === "newest"
          ? [{ createdAt: "desc" }]
          : [{ isTrending: "desc" }, { createdAt: "desc" }];

  const products = await prisma.product.findMany({
    where,
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy,
  });

  return (
    <div className="w-full px-2 py-6 md:px-3">
      <h1 className="flex items-center justify-center gap-3 text-[34px] font-semibold text-slate-900 md:text-[56px]">
        <ShoppingCart className="text-slate-600" size={34} /> Browse Our Products
      </h1>

      <div className="mx-auto mt-6 max-w-[1600px]">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
          <Link
            href="/products"
            className={`rounded border px-3 py-1.5 text-sm ${
              !categorySlug ? "border-slate-300 bg-slate-50 text-slate-900" : "border-transparent bg-transparent text-blue-600 hover:text-blue-700"
            }`}
          >
            All Products
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className={`rounded border px-3 py-1.5 text-sm ${
                categorySlug === category.slug
                  ? "border-slate-300 bg-slate-50 text-slate-900"
                  : "border-transparent bg-transparent text-blue-600 hover:text-blue-700"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">No products found.</p>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`} className="block rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative h-[170px] overflow-hidden rounded bg-slate-100">
                <Image
                  src={product.images[0]?.url || "/frame-square.png"}
                  alt={product.images[0]?.alt || product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-800">{product.name}</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">{formatINR(Number(product.price))}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
