"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Heart, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import LensSelector from "@/components/LensSelector";
import { formatINR } from "@/lib/format";

type ProductDetailsProps = {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    rating: number;
    stock: number;
    customizationType: "EYEGLASSES" | "SUNGLASSES" | "CONTACT_LENSES" | "ACCESSORIES";
    powerRange: string | null;
    colors: string[];
    categoryName?: string | null;
  };
  lensPrices: Record<string, number>;
  supportPhone?: string;
};

function colorValue(color: string) {
  return color.trim() || "#94a3b8";
}

export default function ProductDetails({ product, lensPrices, supportPhone }: ProductDetailsProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");

  const colorOptions = useMemo(() => (product.colors.length ? product.colors : ["#1d4ed8"]), [product.colors]);
  const categoryLabel = product.categoryName || product.customizationType.replace(/_/g, " ");
  const fullStars = Math.max(0, Math.min(5, Math.round(Number(product.rating) || 0)));
  const isOutOfStock = product.stock <= 0;

  const stockMeta = useMemo(() => {
    if (isOutOfStock) {
      return {
        label: "Out of stock",
        className: "border-rose-200 bg-rose-50 text-rose-700",
      };
    }

    if (product.stock <= 5) {
      return {
        label: `Only ${product.stock} left`,
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    }

    return {
      label: `${product.stock} in stock`,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }, [isOutOfStock, product.stock]);

  async function addWishlist() {
    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, selectedColor }),
    });

    if (!response.ok) {
      toast.error("Failed to add to wishlist");
      return;
    }

    toast.success("Added to Wishlist");
  }

  return (
    <div className="xl:sticky xl:top-24">
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            {categoryLabel}
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${stockMeta.className}`}>
            {stockMeta.label}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{product.name}</h1>
          <p className="text-4xl font-bold leading-none text-slate-900 sm:text-5xl">{formatINR(Number(product.price))}</p>
        </div>

        <div className="flex items-center gap-2 text-sm sm:text-base">
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((index) => (
              <Star
                key={index}
                size={18}
                className={index < fullStars ? "fill-amber-400 text-amber-400" : "text-slate-300"}
              />
            ))}
          </div>
          <span className="font-semibold text-slate-700">{Number(product.rating).toFixed(1)}</span>
          <span className="text-slate-500">/ 5.0 rating</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Category</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{categoryLabel}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Price</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{formatINR(Number(product.price))}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Select Color</p>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {colorOptions.map((color) => {
              const active = selectedColor === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  aria-label={color}
                  title={color}
                  className={`h-9 w-9 rounded-full border-2 transition ${
                    active ? "scale-105 border-slate-900 ring-2 ring-slate-200" : "border-slate-300 hover:border-slate-500"
                  }`}
                  style={{ backgroundColor: colorValue(color) }}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Description</p>
          <p className="mt-2 text-base leading-7 text-slate-700">{product.description}</p>
        </div>

        <div className="grid gap-2 text-xs font-semibold text-slate-600 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Truck className="h-4 w-4 text-blue-600" />
            Fast shipping
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Quality checked
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-amber-600" />
            Easy returns
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={addWishlist}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-600 px-5 text-base font-semibold text-white transition hover:bg-blue-700"
          >
            <Heart size={19} className="fill-white" /> Add to Wishlist
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            disabled={isOutOfStock}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-base font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ShoppingCart size={19} /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>

      <LensSelector
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialSelectedColor={selectedColor}
        product={{
          id: product.id,
          name: product.name,
          price: Number(product.price),
          customizationType: product.customizationType,
          powerRange: product.powerRange,
          colors: product.colors,
        }}
        lensPrices={lensPrices}
        supportPhone={supportPhone}
      />
    </div>
  );
}
