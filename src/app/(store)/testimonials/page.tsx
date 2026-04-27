export const revalidate = 180;

import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import TestimonialSubmitForm from "@/components/TestimonialSubmitForm";

function isSchemaMismatch(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "P2021" || code === "P2022";
}

async function getApprovedTestimonials() {
  try {
    return await prisma.testimonial.findMany({
      where: { isApproved: true, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: {
        id: true,
        name: true,
        rating: true,
        message: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (isSchemaMismatch(error)) {
      return await prisma.testimonial.findMany({
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 24,
        select: {
          id: true,
          name: true,
          rating: true,
          message: true,
          createdAt: true,
        },
      });
    }
    throw error;
  }
}

function stars(count: number) {
  return Array.from({ length: 5 }, (_, index) => index < count);
}

export default async function TestimonialsPage() {
  const testimonials = await getApprovedTestimonials();

  return (
    <div className="w-full px-3 py-8 md:px-4 md:py-10 lg:px-5">
      <h1 className="text-center text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">Customer Reviews</h1>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600 md:text-base">
        Real feedback from customers who trust Royal Optics for daily eyewear.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            No approved reviews yet. Be the first to submit one below.
          </p>
        ) : (
          testimonials.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-900">{item.name}</h2>
                <span className="text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="mt-2 flex gap-1 text-amber-400">
                {stars(item.rating).map((active, index) => (
                  <Star key={`${item.id}-${index}`} size={15} fill={active ? "currentColor" : "none"} className={active ? "" : "text-slate-300"} />
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">&quot;{item.message}&quot;</p>
            </article>
          ))
        )}
      </div>

      <div id="add-form" className="mt-10">
        <TestimonialSubmitForm />
      </div>
    </div>
  );
}
