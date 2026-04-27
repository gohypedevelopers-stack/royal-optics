"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    rating: number;
    customizationType: string;
    images: { url: string; alt: string | null }[];
    colors: string[];
  };
};

export default function ProductCard({ product }: ProductCardProps) {
  async function addToWishlist() {
    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });

    if (!response.ok) {
      toast.error("Failed to add to wishlist");
      return;
    }

    toast.success("Added to Wishlist");
  }

  async function quickAddToCart() {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    });

    if (!response.ok) {
      toast.error("Failed to add to cart");
      return;
    }

    toast.success("Added to cart");
  }

  return (
    <article className="group overflow-hidden rounded-md border border-slate-200 bg-white card-shadow">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={product.images[0]?.url || "/frame-square.png"}
            alt={product.images[0]?.alt || product.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <div className="space-y-3 p-3">
        <div>
          <Link href={`/products/${product.slug}`} className="line-clamp-1 text-base font-semibold text-slate-900 hover:underline">
            {product.name}
          </Link>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-500">{product.customizationType.replace("_", " ")}</p>
          <p className="mt-1 text-xs text-slate-600">Rating {Number(product.rating).toFixed(1)} / 5</p>
        </div>

        <div className="text-lg font-bold text-slate-900">{formatINR(Number(product.price))}</div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={quickAddToCart}
            className="flex-1 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingCart size={16} /> Add
            </span>
          </button>
          <button
            type="button"
            onClick={addToWishlist}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            aria-label="Add to wishlist"
          >
            <Heart size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
