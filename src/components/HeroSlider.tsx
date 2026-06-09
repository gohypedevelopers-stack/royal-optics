"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Feather, Shield, Zap } from "lucide-react";
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
    return value;
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
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  const nextSlide = () => setIndex((prev) => (prev + 1) % slides.length);

  return (
    <section className="store-shell mt-4">
      <div className="group/slider relative h-[400px] overflow-hidden rounded-[2.5rem] border border-slate-200/80 bg-slate-950 shadow-[0_24px_70px_-15px_rgba(15,23,42,0.25)] transition-all duration-500 md:h-[580px]">
        {/* Background Images */}
        <div className="relative h-full w-full">
          {slides.map((banner, i) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                i === index ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-105 pointer-events-none"
              }`}
            >
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                priority={i === 0}
                quality={85}
                sizes="(max-width: 768px) 100vw, 1240px"
                className="object-cover object-center transition-transform duration-[5000ms] ease-out"
              />
              {/* Dark sophisticated overlays for high legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.18),transparent_50%)]" />
            </div>
          ))}
        </div>

        {/* Content Box */}
        <div className="absolute inset-0 z-10 flex items-center px-8 md:px-20">
          <div className="max-w-[720px] text-white">
            <div className="overflow-hidden">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-amber-300 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.1)] md:text-[0.78rem] animate-hero-fade-up">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Royal Optics Premium
              </span>
            </div>
            
            <h1 className="mt-2 text-[2.4rem] font-extrabold leading-[1.05] tracking-[-0.04em] drop-shadow-md md:text-[4.6rem] bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              {slides[index].title}
            </h1>
            
            {slides[index].subtitle && (
              <p className="mt-5 max-w-[580px] text-[0.98rem] leading-relaxed text-slate-300 md:text-[1.15rem] font-medium drop-shadow-sm">
                {slides[index].subtitle}
              </p>
            )}
            
            {slides[index].ctaHref && slides[index].ctaLabel && (
              <div className="mt-8 flex flex-wrap gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-6 text-[0.98rem] font-bold text-slate-950 shadow-[0_10px_25px_-5px_rgba(245,158,11,0.4)] transition-all duration-300 hover:scale-[1.03] hover:from-amber-300 hover:to-amber-400 hover:shadow-[0_15px_30px_-5px_rgba(245,158,11,0.5)] active:scale-[0.98]"
                >
                  <Link href={slides[index].ctaHref}>{slides[index].ctaLabel}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Arrow Navigation */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous slide"
              className="absolute left-4 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/40 text-white backdrop-blur-md transition-all duration-300 opacity-0 group-hover/slider:opacity-100 hover:bg-slate-950/75 hover:scale-105 active:scale-95 md:left-6"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/40 text-white backdrop-blur-md transition-all duration-300 opacity-0 group-hover/slider:opacity-100 hover:bg-slate-950/75 hover:scale-105 active:scale-95 md:right-6"
            >
              <ChevronRight size={22} />
            </button>
            
            {/* Bottom dots */}
            <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-white/10 bg-slate-950/35 px-4 py-2 backdrop-blur-md">
              {slides.map((slide, dotIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to slide ${dotIndex + 1}`}
                  onClick={() => setIndex(dotIndex)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dotIndex === index ? "w-8 bg-amber-400" : "w-2 bg-white/50 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Feature Highlight Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="store-card store-card-hover p-6 flex items-start gap-4 border border-slate-100 bg-white hover:border-amber-200">
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 shadow-sm">
            <Feather size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">Ultra Light Frames</h4>
            <p className="mt-1.5 text-[0.92rem] leading-relaxed text-slate-500">Premium build quality with all-day comfort for daily wear.</p>
          </div>
        </div>

        <div className="store-card store-card-hover p-6 flex items-start gap-4 border border-slate-100 bg-white hover:border-amber-200">
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 shadow-sm">
            <Shield size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">Blue Cut & UV Lenses</h4>
            <p className="mt-1.5 text-[0.92rem] leading-relaxed text-slate-500">High-clarity lenses designed to protect your eyes indoors and outdoors.</p>
          </div>
        </div>

        <div className="store-card store-card-hover p-6 flex items-start gap-4 border border-slate-100 bg-white hover:border-amber-200 sm:col-span-2 md:col-span-1">
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm">
            <Zap size={22} />
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-800">Fast Dispatch</h4>
            <p className="mt-1.5 text-[0.92rem] leading-relaxed text-slate-500">Quick fulfillment on top-selling collections with secure packaging.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

