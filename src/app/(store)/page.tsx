export const revalidate = 180;

import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { Flame, Glasses, Eye, HandHeart, Tag, Contact, Package } from "lucide-react";
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

function isDatabaseUnavailable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const details = error as { code?: string; errorCode?: string; message?: string };
  if (details.code === "P1001" || details.errorCode === "P1001") return true;
  const message = String(details.message || "").toLowerCase();
  return message.includes("can't reach database server");
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
    if (isSchemaMismatch(error) || isDatabaseUnavailable(error)) return [];
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
    if (isDatabaseUnavailable(error)) return [];
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
      take: 24,
      select: {
        id: true,
        slug: true,
        name: true,
        price: true,
        mainImage: true,
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
    if (isSchemaMismatch(error) || isDatabaseUnavailable(error)) return [];
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
    if (isDatabaseUnavailable(error)) return [];
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
    if (isSchemaMismatch(error) || isDatabaseUnavailable(error)) return [];
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

      <div className="store-shell mt-12 space-y-14">
        <CategoryGrid categories={categories} />

        <section className="store-section">
          <h2 className="store-section-title flex items-center justify-center gap-2">
            <Flame size={26} className="text-amber-500" /> Trending Products
          </h2>
          {trendingProducts.length === 0 ? (
            <p className="mt-6 text-center text-[0.96rem] text-slate-500">No trending products available right now.</p>
          ) : (
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {trendingProducts.map((product) => (
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
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/40 to-transparent" />
                        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-sm">
                          <Flame size={11} className="fill-white animate-pulse" />
                          <span>Trending</span>
                        </div>
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
                        <span className="text-[1.1rem] font-bold text-slate-900">{formatINR(Number(product.price))}</span>
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
        </section>

        <section className="store-section">
          <div className="grid gap-5 md:grid-cols-2">
            {showcaseCards.map((card, index) => (
              <article
                key={card.title}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200/90 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_65px_rgba(15,23,42,0.14)]"
              >
                <div className="relative h-[270px] w-full bg-slate-100 md:h-[330px]">
                  <SafeImage src={card.image} alt={card.title} fill quality={80} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/10 to-transparent" />
                  <div className="absolute left-6 top-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/10 text-white backdrop-blur-sm">
                    {card.icon}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-7">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">Featured Collection</p>
                    <h3 className="mt-2 text-[1.9rem] font-semibold leading-none tracking-[-0.04em] md:text-[2.4rem]">
                      {card.title}
                    </h3>
                  </div>
                </div>
                <div className="space-y-4 p-6 md:p-7">
                  <p className="text-[1rem] leading-7 text-slate-600">{card.description}</p>
                  <Button asChild variant={index % 2 === 0 ? "default" : "outline"} className="rounded-full px-6">
                    <Link href={card.href}>{card.cta}</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="store-section">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.1),transparent_52%)] px-5 py-10 md:px-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-blue-200/35 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-amber-200/30 blur-3xl" />

            <div className="relative text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-blue-600">Testimonials</p>
              <h2 className="mt-3 text-[2.1rem] font-semibold leading-tight tracking-[-0.03em] text-slate-900 md:text-[2.6rem]">
                What Our Customers Say
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-[0.98rem] leading-7 text-slate-600">
                Honest feedback from customers who found their perfect pair.
              </p>
            </div>

            <div className="relative mt-8">
              {testimonials.length === 0 ? (
                <p className="text-center text-[0.96rem] text-slate-500">No testimonials yet. Be the first to add one.</p>
              ) : (
                <div className="grid gap-5 md:grid-cols-3">
                  {testimonials.slice(0, 3).map((item) => {
                    const initials = item.name
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <article
                        key={item.id}
                        className="relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-600">
                            "
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Rating {item.rating}/5
                          </span>
                        </div>
                        <p className="mt-4 line-clamp-4 text-[0.98rem] leading-7 text-slate-700">"{item.message}"</p>
                        <div className="mt-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-400 text-sm font-semibold text-white">
                            {initials || "CU"}
                          </div>
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild variant="secondary" className="rounded-full px-6">
                <Link href="/testimonials#add-form">Add Your Testimonial</Link>
              </Button>
              <Button asChild className="rounded-full bg-blue-700 px-6 hover:bg-blue-800">
                <Link href="/testimonials">Show More Reviews</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      <section className="relative mt-16 border-y border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="store-shell relative">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-blue-600">Why Royal Optics</p>
            <h2 className="mt-3 text-[2.1rem] font-semibold leading-tight tracking-[-0.03em] text-slate-900 md:text-[2.6rem]">Why Choose Us?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-[0.98rem] leading-7 text-slate-600">
              We pair premium materials with precise fittings and clear guidance, so every pair feels like it was made for you.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-4 md:gap-5">
            {whyItems.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white/90 p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.12)]"
              >
                <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 transition duration-300 group-hover:bg-blue-600 group-hover:text-white">
                  {String(item.iconName).toLowerCase().includes("glass") ? <Glasses size={23} /> : null}
                  {String(item.iconName).toLowerCase().includes("eye") ? <Eye size={23} /> : null}
                  {String(item.iconName).toLowerCase().includes("service") ? <HandHeart size={23} /> : null}
                  {String(item.iconName).toLowerCase().includes("tag") ? <Tag size={23} /> : null}
                  {!['glass', 'eye', 'service', 'tag'].some((key) => String(item.iconName).toLowerCase().includes(key)) ? (
                    <Glasses size={23} />
                  ) : null}
                </div>
                <h3 className="text-[1.15rem] font-semibold tracking-[-0.02em] text-slate-900 md:text-[1.25rem]">{item.title}</h3>
                <p className="mx-auto mt-3 max-w-[250px] text-[0.95rem] leading-6 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
