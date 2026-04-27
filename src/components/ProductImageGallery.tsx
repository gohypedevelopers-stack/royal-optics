"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

type ProductImage = {
  id: string;
  url: string;
  alt: string | null;
};

export default function ProductImageGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });

  const safeImages = useMemo(
    () => (images.length ? images : [{ id: "fallback", url: "/frame-square.png", alt: name }]),
    [images, name],
  );
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
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-slate-200 p-3 shadow-sm sm:p-4">
          <button
            type="button"
            onClick={() => setFullscreenOpen(true)}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => {
              setIsZoomed(false);
              setZoomOrigin({ x: 50, y: 50 });
            }}
            aria-label="Open image in fullscreen"
            className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={activeImage?.url || "/frame-square.png"}
                alt={activeImage?.alt || name}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority
                className={`object-contain p-3 transition duration-300 sm:p-5 ${
                  isZoomed ? "scale-[1.65]" : "scale-100"
                }`}
                style={{ transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }}
              />
            </div>
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              <Expand className="h-3.5 w-3.5" />
              Fullscreen
            </span>
          </button>
          <span className="absolute bottom-5 right-5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            {active + 1}/{safeImages.length}
          </span>
          <span className="absolute bottom-5 left-5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            Hover to zoom
          </span>
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
              <Image src={image.url} alt={image.alt || name} fill sizes="80px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      </div>

      {fullscreenOpen && (
        <div className="fixed inset-0 z-[130] bg-black/92 p-4 sm:p-6" role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={() => setFullscreenOpen(false)}
            className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white transition hover:bg-black/70"
            aria-label="Close fullscreen image"
          >
            <X className="h-5 w-5" />
          </button>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={previousImage}
                className="absolute left-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white transition hover:bg-black/70 sm:left-6"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-3 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white transition hover:bg-black/70 sm:right-6"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
            <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/20 bg-black/30">
              <Image
                src={activeImage?.url || "/frame-square.png"}
                alt={activeImage?.alt || name}
                fill
                sizes="100vw"
                className="object-contain p-4 sm:p-8"
              />
            </div>

            <div className="mx-auto flex max-w-full gap-2 overflow-x-auto pb-2">
              {safeImages.map((image, index) => (
                <button
                  key={`${image.id}-fullscreen`}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border sm:h-20 sm:w-20 ${
                    index === active ? "border-blue-400 ring-2 ring-blue-300/80" : "border-white/40"
                  }`}
                  aria-label={`View fullscreen image ${index + 1}`}
                >
                  <Image src={image.url} alt={image.alt || name} fill sizes="80px" className="object-contain p-1 bg-white" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
