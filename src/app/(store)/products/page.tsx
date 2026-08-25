export const dynamic = "force-dynamic";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
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

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const resolvedSearchParams = await searchParams;
  const query = paramValue(resolvedSearchParams.q);
  const categorySlug = paramValue(resolvedSearchParams.category);
  const sort = paramValue(resolvedSearchParams.sort) || "relevance";

  const subFilter = paramValue(resolvedSearchParams.sub);

  const clType = paramValue(resolvedSearchParams.cl_type);
  const clCat = paramValue(resolvedSearchParams.cl_cat);
  const clDisp = paramValue(resolvedSearchParams.cl_disp);

  const categories = await prisma.category.findMany({
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, name: true, slug: true, parentId: true },
  });

  let categoryIds: string[] | undefined;
  if (categorySlug) {
    const category = categories.find((item) => item.slug === categorySlug);
    if (category) {
      if (category.slug === "eyewear") {
        categoryIds = [category.id];
      } else {
        categoryIds = descendantIds(category.id, categories);
      }
    } else {
      categoryIds = [];
    }
  }

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    ...(categoryIds ? { categoryId: { in: categoryIds } } : {}),
  };

  if (subFilter) {
    where.gender = subFilter;
  }

  if (clType) {
    where.contactLensType = clType;
  }
  if (clCat) {
    where.contactLensCategory = clCat;
  }
  if (clDisp) {
    where.contactLensDisposability = clDisp;
  }

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

      <div className="mx-auto mt-8 max-w-[1600px] border-b border-slate-100 pb-5">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products"
            className={`rounded-full px-5 py-2.5 text-[0.82rem] font-bold uppercase tracking-wider transition-all duration-300 ${
              !categorySlug
                ? "bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.12)] border border-transparent"
                : "border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-sm"
            }`}
          >
            All Products
          </Link>
          {(() => {
            const allowedFilterNames = ["Eyewear", "Sunglasses", "Eyeglasses", "Contact Lenses", "Accessories"];
            const filterCategories = allowedFilterNames
              .map((name) => categories.find((cat) => cat.name.trim().toLowerCase() === name.toLowerCase()))
              .filter((cat): cat is Exclude<typeof cat, undefined> => cat !== undefined);

            return filterCategories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className={`rounded-full px-5 py-2.5 text-[0.82rem] font-bold uppercase tracking-wider transition-all duration-300 ${
                  categorySlug === category.slug
                    ? "bg-slate-900 text-white shadow-[0_4px_12px_rgba(15,23,42,0.12)] border border-transparent"
                    : "border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                }`}
              >
                {category.name}
              </Link>
            ));
          })()}
        </div>

        {(categorySlug === "sunglasses" || categorySlug === "eyeglasses") && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            {["Men", "Women", "Boy", "Girl"].map((subName) => {
              const subSlug = subName.toLowerCase();
              const isActive = subFilter === subSlug;
              return (
                <Link
                  key={subSlug}
                  href={isActive ? `/products?category=${categorySlug}` : `/products?category=${categorySlug}&sub=${subSlug}`}
                  className={`rounded-full px-5 py-2 text-[0.78rem] font-bold uppercase tracking-widest transition-all duration-300 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] border border-transparent"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 shadow-sm"
                  }`}
                >
                  {subName}
                </Link>
              );
            })}
          </div>
        )}

        {categorySlug === "contact-lenses" && (
          <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
            {/* Level 1: Main Type */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {[
                { label: "All Contact Lenses", type: "" },
                { label: "Power Lenses", type: "POWER" },
                { label: "Non-Power Lenses", type: "NON_POWER" },
                { label: "Contact Lenses Care", type: "CARE" },
              ].map((item) => {
                const isActive = clType === item.type;
                const href = item.type
                  ? `/products?category=contact-lenses&cl_type=${item.type}`
                  : `/products?category=contact-lenses`;
                return (
                  <Link
                    key={item.label}
                    href={href}
                    className={`rounded-full px-4 py-2 text-[0.78rem] font-bold uppercase tracking-wider transition-all duration-300 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] border border-transparent"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Level 2: Sub-category (Clear vs Color for Power Lenses) */}
            {clType === "POWER" && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-slate-100">
                {[
                  { label: "All Power Lenses", cat: "" },
                  { label: "Clear Lenses", cat: "CLEAR" },
                  { label: "Color Lenses", cat: "COLOR" },
                ].map((item) => {
                  const isActive = clCat === item.cat;
                  const href = item.cat
                    ? `/products?category=contact-lenses&cl_type=POWER&cl_cat=${item.cat}`
                    : `/products?category=contact-lenses&cl_type=POWER`;
                  return (
                    <Link
                      key={item.label}
                      href={href}
                      className={`rounded-full px-3.5 py-1.5 text-[0.74rem] font-semibold tracking-wide transition-all duration-300 ${
                        isActive
                          ? "bg-slate-900 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Level 3: Disposability / Modality */}
            {(clType === "POWER" || clType === "NON_POWER" || !clType) && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {(() => {
                  let options: Array<{ label: string; val: string }> = [];

                  if (clType === "POWER" && clCat === "CLEAR") {
                    options = [
                      { label: "Dailies", val: "DAILIES" },
                      { label: "2 Weeks", val: "2_WEEKS" },
                      { label: "Monthly", val: "MONTHLY" },
                      { label: "Yearly", val: "YEARLY" },
                      { label: "Toric (SPH+CYL)", val: "TORIC" },
                    ];
                  } else if (clType === "POWER" && clCat === "COLOR") {
                    options = [
                      { label: "Dailies", val: "DAILIES" },
                      { label: "Monthly", val: "MONTHLY" },
                      { label: "3 Months", val: "3_MONTHS" },
                      { label: "6 Months", val: "6_MONTHS" },
                      { label: "Yearly", val: "YEARLY" },
                    ];
                  } else if (clType === "NON_POWER") {
                    options = [
                      { label: "Dailies", val: "DAILIES" },
                      { label: "Weekly", val: "WEEKLY" },
                      { label: "Monthly", val: "MONTHLY" },
                      { label: "3 Months", val: "3_MONTHS" },
                      { label: "6 Months", val: "6_MONTHS" },
                      { label: "Yearly", val: "YEARLY" },
                    ];
                  } else {
                    options = [
                      { label: "Dailies", val: "DAILIES" },
                      { label: "Weekly / 2 Weeks", val: "MONTHLY" },
                      { label: "Monthly", val: "MONTHLY" },
                      { label: "3 Months", val: "3_MONTHS" },
                      { label: "6 Months", val: "6_MONTHS" },
                      { label: "Yearly", val: "YEARLY" },
                      { label: "Toric (SPH+CYL)", val: "TORIC" },
                    ];
                  }

                  return options.map((opt) => {
                    const isActive = clDisp === opt.val;
                    const params = new URLSearchParams();
                    params.set("category", "contact-lenses");
                    if (clType) params.set("cl_type", clType);
                    if (clCat) params.set("cl_cat", clCat);
                    if (!isActive) params.set("cl_disp", opt.val);

                    return (
                      <Link
                        key={opt.val + opt.label}
                        href={`/products?${params.toString()}`}
                        className={`rounded-lg px-3 py-1 text-[0.72rem] font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-blue-100 text-blue-800 border border-blue-300 font-semibold"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                        }`}
                      >
                        {opt.label}
                      </Link>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">No products found.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group flex flex-col justify-between overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-[0_20px_45px_rgba(15,23,42,0.09)]"
            >
              <div>
                {/* Image container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[radial-gradient(circle_at_top,#f8fafc,#f1f5f9)]">
                  <SafeImage
                    src={product.mainImage || product.images[0]?.url || "/frame-square.png"}
                    alt={product.images[0]?.alt || product.name}
                    fill
                    quality={80}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 25vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/40 to-transparent" />
                </div>

                {/* Content block */}
                <div className="p-5">
                  <p className="line-clamp-2 text-[0.98rem] font-bold leading-snug tracking-tight text-slate-800 transition-colors duration-300 group-hover:text-blue-600">
                    {product.name}
                  </p>
                </div>
              </div>

              {/* Action row */}
              <div className="px-5 pb-5">
                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[1.1rem] font-bold text-slate-900">
                      {formatINR(product.discount ? Number(product.price) - (Number(product.price) * product.discount) / 100 : Number(product.price))}
                    </span>
                    {!!product.discount && product.discount > 0 && (
                      <span className="text-xs font-medium text-slate-400 line-through">
                        {formatINR(Number(product.price))}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3.5 py-2 text-[0.72rem] font-semibold text-white transition-all duration-300 group-hover:bg-blue-600 group-hover:shadow-[0_4px_12px_rgba(37,99,235,0.25)]">
                    View Details
                    <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
