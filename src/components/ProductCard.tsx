"use client";

import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import { useRouter } from "next/navigation";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    rating: number;
    customizationType: string;
    mainImage?: string | null;
    images: { url: string; alt: string | null }[];
    colors: string[];
  };
};


export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
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
    router.refresh();
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
    router.refresh();
  }

  return (
    <article className="store-card store-card-hover group overflow-hidden text-[0.98rem] text-slate-700">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <SafeImage
            src={product.mainImage || product.images[0]?.url || "/frame-square.png"}
            alt={product.images[0]?.alt || product.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div>
          <Link href={`/products/${product.slug}`} className="store-card-title line-clamp-1 hover:underline">
            {product.name}
          </Link>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{product.customizationType.replace("_", " ")}</p>
          <p className="mt-1 text-xs text-slate-500">Rating {Number(product.rating).toFixed(1)} / 5</p>
        </div>

        <div className="text-[1.2rem] font-semibold text-slate-900">{formatINR(Number(product.price))}</div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={quickAddToCart}
            className="ro-btn-primary flex-1"
          >
            <span className="inline-flex items-center gap-2">
              <ShoppingCart size={16} /> Add
            </span>
          </button>
          <button
            type="button"
            onClick={addToWishlist}
            className="ro-btn-secondary px-3"
            aria-label="Add to wishlist"
          >
            <Heart size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
