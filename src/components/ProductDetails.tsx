"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Heart, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import LensSelector from "@/components/LensSelector";
import { formatINR } from "@/lib/format";
import { useRouter } from "next/navigation";

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

function parseDescriptionTable(description: string) {
  if (!description.includes(":")) {
    return [];
  }

  const lines = description.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const result: { key: string; value: string }[] = [];

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*-?\s*(.*)$/);
    if (match && match[1].length <= 40) {
      result.push({
        key: match[1].trim(),
        value: match[2].trim() || "-",
      });
    } else {
      if (result.length > 0) {
        result[result.length - 1].value += " " + line;
      }
    }
  }

  if (result.length > 1) {
    return result;
  }

  return [];
}

export default function ProductDetails({ product, lensPrices, supportPhone }: ProductDetailsProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");

  const colorOptions = useMemo(() => (product.colors.length ? product.colors : ["#1d4ed8"]), [product.colors]);
  const categoryLabel = product.categoryName || product.customizationType.replace(/_/g, " ");
  const fullStars = Math.max(0, Math.min(5, Math.round(Number(product.rating) || 0)));
  const isOutOfStock = product.stock <= 0;
  const descriptionTable = parseDescriptionTable(product.description);

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
    router.refresh();
  }

  return (
    <div className="xl:sticky xl:top-24">
      <div className="store-card space-y-5 p-4 text-[0.98rem] text-slate-700 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-500/10 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-blue-600">
            {categoryLabel}
          </span>
          <span className={`rounded-full border px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider ${stockMeta.className}`}>
            {stockMeta.label}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold leading-tight text-slate-900 tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="text-3xl font-extrabold leading-none text-slate-900 tracking-tight">{formatINR(Number(product.price))}</p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((index) => (
              <Star
                key={index}
                size={16}
                className={index < fullStars ? "fill-amber-400 text-amber-400" : "text-slate-200"}
              />
            ))}
          </div>
          <span className="font-bold text-slate-800">{Number(product.rating).toFixed(1)}</span>
          <span className="text-slate-400">/ 5.0 rating</span>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Color</p>
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
                  className={`h-9 w-9 rounded-full border-2 transition-all duration-300 ${
                    active ? "scale-105 border-slate-900 ring-2 ring-slate-200" : "border-slate-200 hover:border-slate-400"
                  }`}
                  style={{ backgroundColor: colorValue(color) }}
                />
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</p>
          {descriptionTable.length ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/60 bg-white">
              <table className="w-full text-sm">
                <tbody>
                  {descriptionTable.map((item, index) => (
                    <tr key={`${item.key}-${index}`} className="border-b last:border-b-0 border-slate-100">
                      <th className="w-1/2 bg-slate-50/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {item.key}
                      </th>
                      <td className="px-3 py-2 text-sm font-medium text-slate-700">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-base leading-7 text-slate-700">{product.description}</p>
          )}
        </div>

        {/* Trust elements */}
        <div className="grid gap-3 text-xs font-bold uppercase tracking-wider text-slate-500 sm:grid-cols-3">
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 text-center transition-all hover:bg-slate-50 shadow-sm">
            <Truck className="h-5 w-5 text-blue-600" />
            <span>Fast Shipping</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 text-center transition-all hover:bg-slate-50 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>Quality Check</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 text-center transition-all hover:bg-slate-50 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
            <span>Easy Returns</span>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            disabled={isOutOfStock}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-blue-600 hover:shadow-[0_8px_20px_-4px_rgba(37,99,235,0.3)] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 active:scale-[0.98]"
          >
            <ShoppingCart size={17} /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>

          <button
            type="button"
            onClick={addWishlist}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:text-slate-950 hover:border-slate-300 active:scale-[0.98]"
          >
            <Heart size={17} className="text-slate-500" /> Add to Wishlist
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
