"use client";

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  message: string;
  rating: number;
};

export default function TestimonialSlider({ testimonials }: { testimonials: Testimonial[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getScrollAmount = () => {
    if (!scrollRef.current) return 340;
    const firstChild = scrollRef.current.firstElementChild as HTMLElement;
    return firstChild ? firstChild.offsetWidth + 20 : 340; // 20px for gap-5
  };

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollRef.current.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
      }
    }
  };

  useEffect(() => {
    if (testimonials.length <= 3) return;
    const timer = setInterval(() => {
      scrollRight();
    }, 4000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="group relative mt-8">
      {testimonials.length > 3 && (
        <button
          onClick={scrollLeft}
          className="absolute -left-5 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all duration-300 hover:bg-slate-50 hover:scale-110 active:scale-95 md:flex opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft size={22} className="text-slate-700" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6 pt-2 px-2 -mx-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}} />
        
        {testimonials.map((item) => {
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
              className="relative w-full shrink-0 snap-start overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1 md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-400 text-sm font-semibold text-white">
                  {initials || "CU"}
                </div>
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
              </div>
            </article>
          );
        })}
      </div>

      {testimonials.length > 3 && (
        <button
          onClick={scrollRight}
          className="absolute -right-5 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all duration-300 hover:bg-slate-50 hover:scale-110 active:scale-95 md:flex opacity-0 group-hover:opacity-100"
        >
          <ChevronRight size={22} className="text-slate-700" />
        </button>
      )}
    </div>
  );
}
