export const revalidate = 180;

import Link from "next/link";
import Image from "next/image";
import { Flame, Glasses, Eye, HandHeart, Tag, MessageCircle, Contact, Package } from "lucide-react";
import CategoryGrid from "@/components/CategoryGrid";
import HeroSlider from "@/components/HeroSlider";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";

function isSchemaMismatch(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "P2021" || code === "P2022";
}

async function getBanners() {
  try {
    return await prisma.heroBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        ctaLabel: true,
        ctaHref: true,
      },
    });
  } catch (error) {
    if (isSchemaMismatch(error)) return [];
    throw error;
  }
}

async function getCategories() {
  try {
    return await prisma.category.findMany({
      where: { parentId: null },
      select: { id: true, name: true, slug: true, imageUrl: true },
      orderBy: { name: "asc" },
      take: 4,
    });
  } catch (error) {
    if (!isSchemaMismatch(error)) throw error;
    const fallback = await prisma.category.findMany({
      where: { parentId: null },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
      take: 4,
    });
    return fallback.map((item) => ({ ...item, imageUrl: null as string | null }));
  }
}

async function getTrendingProducts() {
  try {
    return await prisma.product.findMany({
      where: { status: "ACTIVE", isTrending: true },
      orderBy: { createdAt: "desc" },
      take: 16,
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: {
            url: true,
            alt: true,
          },
        },
      },
    });
  } catch (error) {
    if (isSchemaMismatch(error)) return [];
    throw error;
  }
}

async function getTestimonials() {
  try {
    return await prisma.testimonial.findMany({
      where: { isApproved: true, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        message: true,
        rating: true,
      },
    });
  } catch (error) {
    if (isSchemaMismatch(error)) {
      return await prisma.testimonial.findMany({
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          name: true,
          message: true,
          rating: true,
        },
      });
    }
    throw error;
  }
}

async function getWhyChooseItems() {
  try {
    return await prisma.whyChooseItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 8,
      select: {
        title: true,
        description: true,
        iconName: true,
      },
    });
  } catch (error) {
    if (isSchemaMismatch(error)) return [];
    throw error;
  }
}

export default async function HomePage() {
  const [banners, categories, trendingProducts, testimonials, whyChooseItems] = await Promise.all([
    getBanners(),
    getCategories(),
    getTrendingProducts(),
    getTestimonials(),
    getWhyChooseItems(),
  ]);

  const defaultWhy = [
    {
      title: "Expert Curation",
      description:
        "We travel the world virtually and physically to handpick a diverse collection of frames that are both timeless and on-trend.",
      iconName: "glasses",
    },
    {
      title: "Precision Lenses",
      description:
        "Your vision is our top priority. We use state-of-the-art technology to ensure your lenses are crafted with precision and clarity.",
      iconName: "eye",
    },
    {
      title: "Personalized Service",
      description:
        "We are not just salespeople, we are style consultants and vision experts dedicated to helping you find the perfect pair.",
      iconName: "service",
    },
    {
      title: "Fair & Transparent Pricing",
      description:
        "Great style should not break the bank. We believe in offering premium eyewear at prices that make sense.",
      iconName: "tag",
    },
  ];

  const distinctWhy = whyChooseItems.filter((item, index, array) => {
    const current = String(item.title || "").trim().toLowerCase();
    if (!current) return false;
    return array.findIndex((candidate) => String(candidate.title || "").trim().toLowerCase() === current) === index;
  });

  const whyItems = distinctWhy.length >= 4 ? distinctWhy.slice(0, 4) : defaultWhy;

  const findCategoryHref = (keywords: string[], fallback: string) => {
    const category = categories.find((item) => {
      const key = `${item.name} ${item.slug}`.toLowerCase();
      return keywords.some((keyword) => key.includes(keyword));
    });
    return category ? `/products?category=${category.slug}` : fallback;
  };

  const showcaseCards = [
    {
      title: "Sunglasses",
      description: "Explore UV protected stylish sunglasses.",
      image: "/Sunglasses.jpg",
      href: findCategoryHref(["sun"], "/products?q=sunglasses"),
      cta: "View Collection",
      icon: <Glasses size={16} />,
    },
    {
      title: "Eyeglasses",
      description: "Trendy and durable eyeglass frames for everyone.",
      image: "/Eyeglasses.jpg",
      href: findCategoryHref(["eye", "frame", "eyewear"], "/products?q=eyeglasses"),
      cta: "Shop Eyeglasses",
      icon: <Glasses size={16} />,
    },
    {
      title: "Contact Lenses",
      description: "Comfortable and clear contact lenses for daily use.",
      image: "/category-contact-lenses.png",
      href: findCategoryHref(["contact", "lens"], "/products?q=contact+lenses"),
      cta: "Browse Lenses",
      icon: <Contact size={16} />,
    },
    {
      title: "Accessories",
      description: "Fun and durable eyewear accessories for everyone.",
      image: "/category-accessories.png",
      href: findCategoryHref(["accessor"], "/products?q=accessories"),
      cta: "Shop Accessories",
      icon: <Package size={16} />,
    },
  ];

  return (
    <div className="pb-12">
      <HeroSlider banners={banners} />

      <div className="mt-12 w-full space-y-14 px-3 md:px-4 lg:px-5">
        <CategoryGrid categories={categories} />

        <section className="w-full">
          <h2 className="flex items-center justify-center gap-2 text-center text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            <Flame size={26} className="text-amber-500" /> Trending Products
          </h2>
          {trendingProducts.length === 0 ? (
            <p className="mt-6 text-center text-sm text-slate-500">No trending products available right now.</p>
          ) : (
            <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {trendingProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="relative h-[150px] w-full overflow-hidden rounded-xl bg-slate-100 md:h-[190px]">
                    <Image
                      src={product.images[0]?.url || "/frame-square.png"}
                      alt={product.images[0]?.alt || product.name}
                      fill
                      quality={78}
                      sizes="(max-width: 768px) 45vw, (max-width: 1200px) 30vw, 22vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.06]"
                    />
                  </div>
                  <p className="mt-3.5 line-clamp-1 text-sm font-semibold text-slate-900 md:text-base">{product.name}</p>
                  <p className="mt-0.5 text-base font-semibold text-emerald-700">{formatINR(Number(product.price))}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="w-full">
          <div className="grid gap-5 md:grid-cols-2">
            {showcaseCards.map((card) => (
              <article
                key={card.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-[230px] w-full bg-slate-100 md:h-[280px]">
                  <Image src={card.image} alt={card.title} fill quality={80} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                </div>
                <div className="space-y-2.5 px-6 py-6">
                  <h3 className="flex items-center gap-2 text-2xl font-semibold leading-none text-slate-900 md:text-[34px]">
                    {card.icon}
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-600 md:text-base">{card.description}</p>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href={card.href}>{card.cta}</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="w-full">
          <h2 className="flex items-center justify-center gap-2 text-center text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            <MessageCircle size={24} className="text-blue-700" /> What Our Customers Say
          </h2>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-sm md:px-7">
            {testimonials.length === 0 ? (
              <p className="text-center text-sm text-slate-500">No testimonials yet. Be the first to add one.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {testimonials.slice(0, 3).map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                    <p className="line-clamp-3 text-sm text-slate-700">&quot;{item.message}&quot;</p>
                    <p className="mt-1 text-xs text-slate-500">Rating {item.rating}/5</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{item.name}</p>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild variant="secondary" className="rounded-xl">
                <Link href="/testimonials#add-form">Add Your Testimonial</Link>
              </Button>
              <Button asChild className="rounded-xl bg-blue-700 hover:bg-blue-800">
                <Link href="/testimonials">Show More Reviews</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-16 border-y border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] py-14">
        <div className="w-full px-3 md:px-4 lg:px-5">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">Why Choose Us?</h2>
          <div className="mt-9 grid gap-4 md:grid-cols-4 md:gap-5">
            {whyItems.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  {String(item.iconName).toLowerCase().includes("glass") ? <Glasses size={23} /> : null}
                  {String(item.iconName).toLowerCase().includes("eye") ? <Eye size={23} /> : null}
                  {String(item.iconName).toLowerCase().includes("service") ? <HandHeart size={23} /> : null}
                  {String(item.iconName).toLowerCase().includes("tag") ? <Tag size={23} /> : null}
                  {!["glass", "eye", "service", "tag"].some((key) => String(item.iconName).toLowerCase().includes(key)) ? (
                    <Glasses size={23} />
                  ) : null}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 md:text-2xl">{item.title}</h3>
                <p className="mx-auto mt-2 max-w-[250px] text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
