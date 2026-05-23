import Link from "next/link";
import { Glasses, Contact, Package } from "lucide-react";

type Category = { id: string; name: string; slug: string; imageUrl: string | null };

function iconForCategory(name: string) {
  const key = name.toLowerCase();
  if (key.includes("sun")) return <Glasses size={16} />;
  if (key.includes("eye")) return <Glasses size={16} />;
  if (key.includes("contact")) return <Contact size={16} />;
  return <Package size={16} />;
}

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  const curated = [
    { name: "Sunglasses", keywords: ["sun"], fallbackHref: "/products?q=sunglasses" },
    { name: "Eyeglasses", keywords: ["eye", "frame", "eyewear"], fallbackHref: "/products?q=eyeglasses" },
    { name: "Contact Lenses", keywords: ["contact", "lens"], fallbackHref: "/products?q=contact+lenses" },
    { name: "Accessories", keywords: ["accessor"], fallbackHref: "/products?q=accessories" },
  ];

  const displayCategories = curated.map((item, index) => {
    const existing = categories.find((category) => {
      const key = `${category.name} ${category.slug}`.toLowerCase();
      return item.keywords.some((keyword) => key.includes(keyword));
    });

    return {
      id: existing?.id || `fallback-${index}`,
      name: item.name,
      href: existing ? `/products?category=${existing.slug}` : item.fallbackHref,
    };
  });

  return (
    <section className="store-section">
      <h2 className="store-section-title">Shop By Category</h2>
      <p className="store-section-copy">
        Curated categories to help customers discover the right eyewear faster.
      </p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayCategories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-6 py-6 text-left shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_24px_55px_rgba(15,23,42,0.10)]"
          >
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-100/40 blur-2xl transition duration-300 group-hover:bg-amber-100/50" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="space-y-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition group-hover:border-amber-200 group-hover:text-amber-600">
                  {iconForCategory(category.name)}
                </span>
                <div>
                  <p className="text-[1.08rem] font-semibold leading-none tracking-[-0.02em] text-slate-900">{category.name}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Explore handpicked styles and everyday essentials.</p>
                </div>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-500 transition group-hover:border-sky-200 group-hover:text-sky-700">
                Shop
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
