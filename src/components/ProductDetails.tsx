"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Heart,
  Loader2,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
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
    discount?: number;
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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");

  const colorOptions = useMemo(() => (product.colors.length ? product.colors : ["#1d4ed8"]), [product.colors]);
  const categoryLabel = product.categoryName || product.customizationType.replace(/_/g, " ");
  const fullStars = Math.max(0, Math.min(5, Math.round(Number(product.rating) || 0)));
  const isOutOfStock = product.stock <= 0;
  const isContactLens = product.customizationType === "CONTACT_LENSES";
  const isAccessory = product.customizationType === "ACCESSORIES";
  const descriptionText = product.description.trim();
  const descriptionTable = parseDescriptionTable(descriptionText);
  const collapsedTableRows = 5;
  const hasExpandableDescription = descriptionTable.length
    ? descriptionTable.length > collapsedTableRows
    : descriptionText.length > 340 || descriptionText.split(/\r?\n/).length > 6;
  const visibleDescriptionTable = descriptionExpanded ? descriptionTable : descriptionTable.slice(0, collapsedTableRows);
  const hiddenDescriptionRows = Math.max(0, descriptionTable.length - collapsedTableRows);
  const supportDisplayPhone = supportPhone?.trim() || "+91 9911522006";
  const phoneHref = supportDisplayPhone.replace(/[^\d+]/g, "");
  const whatsappHref = `https://wa.me/${supportDisplayPhone.replace(/\D/g, "")}`;
  const primaryActionLabel = isAccessory ? "Choose Options" : isContactLens ? "Choose Power" : "Choose Lens";
  const primaryActionCopy = isAccessory
    ? "Confirm your preferred color and quantity in the next step."
    : isContactLens
      ? "Select your contact-lens power and quantity before adding to cart."
      : "Frame price is shown here. Lens choices and final pricing are handled in the next step.";
  const productHighlights = [
    product.powerRange ? `Power range: ${product.powerRange}` : null,
    `${colorOptions.length} color option${colorOptions.length > 1 ? "s" : ""}`,
    isAccessory ? "Ready-to-order product" : "Lens customization available",
  ].filter((item): item is string => Boolean(item));

  const stockMeta = useMemo(() => {
    if (isOutOfStock) {
      return {
        label: "Out of stock",
        className: "border-rose-200 bg-rose-50 text-rose-700",
      };
    }

    if (product.stock < 5) {
      return {
        label: `Only ${product.stock} left, hurry buying`,
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    }

    if (product.stock < 10) {
      return {
        label: `Only ${product.stock} left`,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    }

    return null;
  }, [isOutOfStock, product.stock]);

  async function addWishlist() {
    if (wishlistPending) return;

    try {
      setWishlistPending(true);
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, selectedColor }),
      });

      if (!response.ok) {
        throw new Error("Wishlist request failed");
      }

      toast.success("Added to Wishlist");
      router.refresh();
    } catch {
      toast.error("Failed to add to wishlist");
    } finally {
      setWishlistPending(false);
    }
  }

  return (
    <>
      <div className="space-y-4 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:space-y-5 lg:pb-0">
        <div className="store-card space-y-5 p-3.5 text-[0.98rem] text-slate-700 sm:space-y-6 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-500/10 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-blue-600 sm:px-3.5 sm:text-[0.7rem]">
              {categoryLabel}
            </span>
            {stockMeta ? (
              <span className={`rounded-full border px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider sm:px-3.5 sm:text-[0.7rem] ${stockMeta.className}`}>
                {stockMeta.label}
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            <h1 className="text-[1.35rem] font-bold leading-snug tracking-tight text-slate-900 sm:text-4xl sm:leading-tight">{product.name}</h1>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                {formatINR(product.discount ? product.price - (product.price * product.discount) / 100 : product.price)}
              </p>
              {!!product.discount && product.discount > 0 && (
                <>
                  <p className="text-lg font-medium text-slate-400 line-through">
                    {formatINR(product.price)}
                  </p>
                  <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-green-700">
                    {product.discount}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="max-w-xl text-[0.84rem] leading-5 text-slate-500 sm:text-sm sm:leading-6">{primaryActionCopy}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {productHighlights.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-slate-600 sm:px-3 sm:text-[0.72rem]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((index) => (
                <Star
                  key={index}
                  size={14}
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
                    className={`h-8 w-8 rounded-full border-2 transition-all duration-300 sm:h-9 sm:w-9 ${
                      active ? "scale-105 border-slate-900 ring-2 ring-slate-200" : "border-slate-200 hover:border-slate-400"
                    }`}
                    style={{ backgroundColor: colorValue(color) }}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-slate-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:rounded-[1.75rem] sm:p-4">
            <div className="rounded-[1.2rem] border border-white/80 bg-white/90 p-3.5 shadow-sm backdrop-blur sm:rounded-[1.4rem] sm:p-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Ready To Order</p>
                    <p className="mt-1 text-[0.84rem] leading-5 text-slate-600 sm:text-sm sm:leading-6">
                      {isOutOfStock
                        ? "This item is currently unavailable. You can still save it to your wishlist."
                        : "Start the guided order flow or save this product before you continue reading the details."}
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: colorValue(selectedColor) }} />
                    {selectedColor || "Default color"}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    disabled={isOutOfStock}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:bg-blue-600 hover:shadow-[0_8px_20px_-4px_rgba(37,99,235,0.3)] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 active:scale-[0.98]"
                  >
                    <ShoppingCart size={17} /> {isOutOfStock ? "Out of Stock" : `${primaryActionLabel} & Add to Cart`}
                  </button>

                  <button
                    type="button"
                    onClick={addWishlist}
                    disabled={wishlistPending}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]"
                  >
                    {wishlistPending ? <Loader2 size={17} className="animate-spin text-slate-500" /> : <Heart size={17} className="text-slate-500" />}
                    {wishlistPending ? "Saving..." : "Add to Wishlist"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500 sm:grid-cols-3 sm:gap-2.5 sm:text-xs">
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-2.5 py-3 text-center shadow-sm sm:px-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <span>Dispatch Support</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-2.5 py-3 text-center shadow-sm sm:px-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-2.5 py-3 text-center shadow-sm sm:col-span-1 sm:px-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-600" />
                    <span>Order Guidance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.45rem] border border-slate-200/80 bg-white p-3.5 shadow-[0_12px_34px_rgba(15,23,42,0.05)] sm:rounded-[1.6rem] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Description</p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Product Details</h2>
            </div>
            {hasExpandableDescription ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {descriptionExpanded ? "Full view" : "Quick view"}
              </span>
            ) : null}
          </div>

          {descriptionTable.length ? (
            <>
            <div className="mt-4 space-y-2 sm:hidden">
              {visibleDescriptionTable.map((item, index) => (
                <div key={`${item.key}-${index}`} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3">
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-slate-500">{item.key}</p>
                  <p className="mt-1.5 text-[0.92rem] font-medium leading-6 text-slate-700">{item.value}</p>
                </div>
              ))}
            </div>

              <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200/70 bg-slate-50/80 sm:block">
                <table className="w-full min-w-[540px] text-sm">
                  <tbody>
                    {visibleDescriptionTable.map((item, index) => (
                      <tr key={`${item.key}-${index}`} className="border-b border-slate-100 last:border-b-0">
                        <th className="w-[42%] bg-white/70 px-4 py-3 text-left text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                          {item.key}
                        </th>
                        <td className="px-4 py-3 text-sm font-medium leading-6 text-slate-700">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="relative mt-4">
              <div className={descriptionExpanded || !hasExpandableDescription ? "" : "max-h-44 overflow-hidden"}>
                <p className="whitespace-pre-wrap text-[0.92rem] leading-6 text-slate-700 sm:text-[0.98rem] sm:leading-7">{descriptionText}</p>
              </div>
              {!descriptionExpanded && hasExpandableDescription ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/95 to-transparent" />
              ) : null}
            </div>
          )}

          {hasExpandableDescription ? (
            <div className={`mt-4 flex flex-wrap items-center gap-3 ${descriptionTable.length && !descriptionExpanded ? "justify-between" : "justify-end"}`}>
              {descriptionTable.length && !descriptionExpanded ? (
                <p className="text-[0.88rem] text-slate-500 sm:text-sm">+{hiddenDescriptionRows} more product details available</p>
              ) : null}
              <button
                type="button"
                onClick={() => setDescriptionExpanded((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[0.92rem] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950 sm:text-sm"
              >
                {descriptionExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {descriptionExpanded ? "Show Less" : "Read More"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.3rem] border border-slate-200/80 bg-slate-50/80 p-3 sm:rounded-[1.35rem] sm:p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Need Help Choosing?</p>
              <p className="mt-1 text-[0.86rem] leading-5 text-slate-600 sm:text-sm sm:leading-6">
                Talk to our team for size, lens, and order guidance before checkout.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-none sm:flex sm:flex-wrap">
              <a
                href={`tel:${phoneHref}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[0.88rem] font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 sm:px-4 sm:text-sm"
              >
                <PhoneCall size={16} className="text-blue-600" />
                Call Now
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-[0.88rem] font-semibold text-white transition hover:bg-emerald-700 sm:px-4 sm:text-sm"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">Support: {supportDisplayPhone}</p>
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-14px_34px_rgba(15,23,42,0.12)] backdrop-blur sm:px-3 sm:pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pt-3 lg:hidden">
        <div className="mx-auto flex max-w-[1500px] items-center gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-slate-500 sm:text-[0.68rem]">
              {isAccessory ? "Price" : "From"}
            </p>
            <p className="truncate text-[1rem] font-extrabold tracking-tight text-slate-950 sm:text-lg">
              {formatINR(product.discount ? product.price - (product.price * product.discount) / 100 : product.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            disabled={isOutOfStock}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-slate-950 px-3 text-[0.78rem] font-bold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:h-12 sm:px-4 sm:text-sm"
          >
            {isOutOfStock ? "Out of Stock" : primaryActionLabel}
          </button>
          <button
            type="button"
            onClick={addWishlist}
            disabled={wishlistPending}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 sm:h-12 sm:w-12"
            aria-label="Add to wishlist"
          >
            {wishlistPending ? <Loader2 size={17} className="animate-spin sm:h-[18px] sm:w-[18px]" /> : <Heart size={17} className="sm:h-[18px] sm:w-[18px]" />}
          </button>
        </div>
      </div>
    </>
  );
}
