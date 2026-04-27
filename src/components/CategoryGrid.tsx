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
    <section className="w-full">
      <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">Shop By Category</h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600 md:text-base">
        Curated categories to help customers discover the right eyewear faster.
      </p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayCategories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="group flex min-h-[104px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-4 py-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
          >
            <span className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition group-hover:border-amber-300 group-hover:text-amber-600">
              {iconForCategory(category.name)}
            </span>
            <span className="text-base font-semibold leading-none text-slate-900">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
