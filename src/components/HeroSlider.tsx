"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  ctaLabel: string | null;
  ctaHref: string | null;
};

export default function HeroSlider({ banners }: { banners: Banner[] }) {
  const normalizeLegacyYear = (value: string | null) => {
    if (!value) return value;
    return value.replace(/1932/g, "1980");
  };

  const fallbackBanners: Banner[] = [
    {
      id: "fallback-1",
      title: "Luxury Eyewear Collection 2026",
      subtitle: "Premium sunglasses and prescription-ready frames with a modern finish.",
      imageUrl: "/ban1.jpg",
      ctaLabel: "Explore Collection",
      ctaHref: "/products?q=sunglasses",
    },
    {
      id: "fallback-2",
      title: "Fresh Arrivals For Every Face Shape",
      subtitle: "Find lightweight, stylish eyewear designed for all-day comfort.",
      imageUrl: "/ban2.jpg",
      ctaLabel: "Shop New Arrivals",
      ctaHref: "/products",
    },
    {
      id: "fallback-3",
      title: "Clarity Meets Style",
      subtitle: "Discover crafted eyeglasses, lenses, and accessories in one place.",
      imageUrl: "/ban3.jpg",
      ctaLabel: "Start Shopping",
      ctaHref: "/products?q=eyeglasses",
    },
  ];

  const slides = fallbackBanners.map((slide, idx) => {
    const fromDb = banners[idx];
    if (!fromDb) return slide;
    return {
      ...slide,
      title: normalizeLegacyYear(fromDb.title) || slide.title,
      subtitle: normalizeLegacyYear(fromDb.subtitle) || slide.subtitle,
      ctaLabel: fromDb.ctaLabel || slide.ctaLabel,
      ctaHref: fromDb.ctaHref || slide.ctaHref,
    };
  });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  const nextSlide = () => setIndex((prev) => (prev + 1) % slides.length);

  return (
    <section className="mt-3 w-full px-3 md:px-4 lg:px-5">
      <div className="relative h-[380px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.15)] md:h-[560px]">
        <div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((banner, i) => (
            <article key={banner.id} className="relative h-full min-w-full">
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                priority={i === 0}
                quality={82}
                sizes="(max-width: 768px) 100vw, 1240px"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.25),transparent_40%)]" />
            </article>
          ))}
        </div>

        <div className="absolute inset-0 z-10 flex items-center px-6 md:px-14">
          <div key={slides[index].id} className="max-w-[680px] text-white animate-hero-fade-up">
            <p className="mb-3 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/90 md:text-sm">
              ROYAL OPTICS PREMIUM
            </p>
            <h1 className="text-3xl font-bold leading-tight drop-shadow md:text-6xl">{slides[index].title}</h1>
            {slides[index].subtitle && (
              <p className="mt-3 max-w-[580px] text-sm text-white/90 md:text-lg">{slides[index].subtitle}</p>
            )}
            {slides[index].ctaHref && slides[index].ctaLabel && (
              <div className="mt-6">
                <Button asChild size="lg" className="rounded-xl bg-amber-400 px-6 text-slate-900 hover:bg-amber-300">
                  <Link href={slides[index].ctaHref}>{slides[index].ctaLabel}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white transition hover:bg-black/45 md:left-5"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white transition hover:bg-black/45 md:right-5"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {slides.map((slide, dotIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to slide ${dotIndex + 1}`}
                  onClick={() => setIndex(dotIndex)}
                  className={`h-2.5 rounded-full transition-all ${dotIndex === index ? "w-8 bg-amber-400" : "w-2.5 bg-white/70 hover:bg-white"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ultra Light Frames</p>
          <p className="mt-1.5 text-sm text-slate-700">Premium build quality with all-day comfort for daily wear.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Blue Cut & UV Lenses</p>
          <p className="mt-1.5 text-sm text-slate-700">High-clarity lenses designed to protect your eyes indoors and outdoors.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Fast Dispatch</p>
          <p className="mt-1.5 text-sm text-slate-700">Quick fulfillment on top-selling collections with secure packaging.</p>
        </div>
      </div>
    </section>
  );
}
