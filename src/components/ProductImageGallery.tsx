"use client";

import SafeImage from "@/components/SafeImage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
};

export default function ProductImageGallery({ images, name, mainImage }: { images: ProductImage[]; name: string; mainImage?: string | null }) {
  const [active, setActive] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  const safeImages = useMemo(() => {
    const combined: ProductImage[] = [];
    if (mainImage) {
      combined.push({ id: "main", url: mainImage, alt: name });
    }
    images.forEach((img) => {
      if (img.url !== mainImage) {
        combined.push(img);
      }
    });
    if (combined.length) return combined;
    return [{ id: "fallback", url: "/frame-square.png", alt: name }];
  }, [images, mainImage, name]);
  const activeImage = safeImages[active] || safeImages[0];
  const hasMultiple = safeImages.length > 1;

  const previousImage = useCallback(() => {
    setActive((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  }, [safeImages.length]);

  const nextImage = useCallback(() => {
    setActive((prev) => (prev + 1) % safeImages.length);
  }, [safeImages.length]);

  function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }

  useEffect(() => {
    if (!fullscreenOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFullscreenOpen(false);
      if (!hasMultiple) return;
      if (event.key === "ArrowLeft") previousImage();
      if (event.key === "ArrowRight") nextImage();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreenOpen, hasMultiple, nextImage, previousImage]);

  return (
    <>
      <div className="space-y-3 text-[0.98rem] text-slate-700 sm:space-y-4 lg:sticky lg:top-24">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-[radial-gradient(circle_at_top,rgba(255,255,255,1),rgba(248,250,252,1)_58%,rgba(226,232,240,0.8))] p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:rounded-[2rem] sm:p-2">
          <div className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[0.64rem] font-bold uppercase tracking-[0.16em] text-slate-600 shadow-sm backdrop-blur sm:left-5 sm:top-5 sm:px-3 sm:py-1.5 sm:text-[0.72rem]">
            View {active + 1}/{safeImages.length}
          </div>

          <button
            type="button"
            onClick={() => setFullscreenOpen(true)}
            className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:scale-105 hover:text-slate-950 active:scale-95 sm:right-5 sm:top-5 sm:h-11 sm:w-11"
            aria-label="Open image in fullscreen"
          >
            <Expand className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {hasMultiple ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  previousImage();
                }}
                className="absolute bottom-3 left-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:scale-105 hover:text-slate-950 active:scale-95 sm:bottom-auto sm:left-4 sm:top-1/2 sm:h-11 sm:w-11 sm:-translate-y-1/2"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  nextImage();
                }}
                className="absolute bottom-3 right-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:scale-105 hover:text-slate-950 active:scale-95 sm:bottom-auto sm:right-4 sm:top-1/2 sm:h-11 sm:w-11 sm:-translate-y-1/2"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => setFullscreenOpen(true)}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            aria-label="Open image in fullscreen"
            className="group relative block w-full overflow-hidden rounded-[1.25rem] bg-transparent text-left sm:rounded-[1.55rem]"
          >
            <div className="relative aspect-square overflow-hidden rounded-[1.2rem] bg-white sm:aspect-[4/3] sm:rounded-[1.45rem]">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-t from-slate-100/80 via-white/10 to-transparent" />
              <SafeImage
                src={activeImage?.url || "/frame-square.png"}
                alt={activeImage?.alt || name}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority
                style={{ transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }}
                className={`object-contain p-0 transition-transform duration-500 ease-out ${
                  isZoomed ? "scale-[1.12]" : "scale-100"
                }`}
              />
            </div>
          </button>

          <div className="mt-2 flex gap-2 overflow-x-auto px-1 pb-1 sm:hidden">
            {safeImages.map((image, index) => (
              <button
                key={`${image.id}-mobile`}
                onClick={() => setActive(index)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border bg-white transition ${
                  index === active
                    ? "border-blue-600 ring-2 ring-blue-200"
                    : "border-slate-300 hover:border-slate-400 hover:shadow-sm"
                }`}
                type="button"
                aria-label={`View image ${index + 1}`}
              >
                <SafeImage src={image.url} alt={image.alt || name} fill sizes="56px" className="object-contain p-1.5" />
              </button>
            ))}
          </div>
        </div>

        <div className="hidden rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-3 shadow-sm sm:block">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-slate-500">Product Gallery</p>
              <p className="mt-1 text-sm text-slate-600">Tap any thumbnail to switch the view.</p>
            </div>
            <button
              type="button"
              onClick={() => setFullscreenOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950 sm:inline-flex"
            >
              <Expand className="h-4 w-4" />
              Fullscreen
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {safeImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setActive(index)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-white transition sm:h-20 sm:w-20 ${
                  index === active
                    ? "border-blue-600 ring-2 ring-blue-200"
                    : "border-slate-300 hover:border-slate-400 hover:shadow-sm"
                }`}
                type="button"
                aria-label={`View image ${index + 1}`}
              >
                <SafeImage src={image.url} alt={image.alt || name} fill sizes="80px" className="object-contain p-1.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {fullscreenOpen && (
        <div
          onClick={() => setFullscreenOpen(false)}
          className="fixed inset-0 z-[130] flex flex-col justify-between bg-slate-950/96 p-3 sm:p-6 md:p-8 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setFullscreenOpen(false)}
            className="absolute right-3 top-3 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 bg-white text-slate-900 shadow-[0_10px_28px_rgba(15,23,42,0.22)] transition-all duration-300 hover:scale-105 hover:bg-slate-100 active:scale-95 sm:right-6 sm:top-6 sm:h-12 sm:w-12"
            aria-label="Close fullscreen image"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.4} />
          </button>

          {hasMultiple && (
            <>
              {/* Prev button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  previousImage();
                }}
                className="absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95 sm:left-8 sm:h-12 sm:w-12"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              {/* Next button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95 sm:right-8 sm:h-12 sm:w-12"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex h-full w-full max-w-5xl flex-col justify-between gap-4 pt-12 sm:gap-6 sm:pt-10"
          >
            {/* Main Image Frame (No Box Borders) */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
              <div className="relative h-full w-full max-h-[60vh] sm:max-h-[68vh]">
                <SafeImage
                  src={activeImage?.url || "/frame-square.png"}
                  alt={activeImage?.alt || name}
                  fill
                  sizes="100vw"
                  className="object-contain p-2"
                  priority
                />
              </div>
            </div>

            {/* Thumbnail Navigation */}
            <div className="mx-auto flex max-w-full gap-2 overflow-x-auto px-2 pb-2 sm:gap-3 sm:px-4">
              {safeImages.map((image, index) => (
                <button
                  key={`${image.id}-fullscreen`}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 sm:h-16 sm:w-16 ${
                    index === active
                      ? "border-amber-400 scale-105 shadow-lg shadow-amber-400/20"
                      : "border-white/10 opacity-40 hover:opacity-100 hover:border-white/30"
                  }`}
                  aria-label={`View fullscreen image ${index + 1}`}
                >
                  <SafeImage src={image.url} alt={image.alt || name} fill sizes="64px" className="object-contain p-1 bg-slate-900" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
