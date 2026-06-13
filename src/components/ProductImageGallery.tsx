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
      <div className="space-y-4 text-[0.98rem] text-slate-700 xl:sticky xl:top-24">
        <div className="relative overflow-hidden bg-transparent p-0">
          <button
            type="button"
            onClick={() => setFullscreenOpen(true)}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            aria-label="Open image in fullscreen"
            className="group relative block w-full overflow-hidden rounded-2xl bg-transparent text-left"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <SafeImage
                src={activeImage?.url || "/frame-square.png"}
                alt={activeImage?.alt || name}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority
                className={`object-contain p-0 transition-transform duration-500 ease-out ${
                  isZoomed ? "scale-[1.12]" : "scale-100"
                }`}
              />
            </div>
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActive(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-white transition ${
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

      {fullscreenOpen && (
        <div
          onClick={() => setFullscreenOpen(false)}
          className="fixed inset-0 z-[130] flex flex-col justify-between bg-slate-950/96 p-6 md:p-8 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setFullscreenOpen(false)}
            className="absolute right-6 top-6 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95"
            aria-label="Close fullscreen image"
          >
            <X className="h-6 w-6" />
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
                className="absolute left-6 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95 sm:left-8"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              {/* Next button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-6 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-white/15 hover:text-white hover:scale-105 active:scale-95 sm:right-8"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto flex h-full w-full max-w-5xl flex-col justify-between gap-6 pt-10"
          >
            {/* Main Image Frame (No Box Borders) */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
              <div className="relative w-full h-full max-h-[68vh]">
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
            <div className="mx-auto flex max-w-full gap-3 overflow-x-auto pb-2 px-4">
              {safeImages.map((image, index) => (
                <button
                  key={`${image.id}-fullscreen`}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
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
