"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

type WishlistItem = {
  id: string;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    images: { url: string; alt: string | null }[];
  };
};

export default function WishlistList({ items }: { items: WishlistItem[] }) {
  const router = useRouter();

  async function removeItem(id: string) {
    const response = await fetch(`/api/wishlist?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Failed to remove item");
      return;
    }

    toast.success("Removed from wishlist");
    router.refresh();
  }

  async function moveToCart(productId: string, wishlistId: string) {
    const addResponse = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });

    if (!addResponse.ok) {
      toast.error("Failed to add to cart");
      return;
    }

    await fetch(`/api/wishlist?id=${wishlistId}`, { method: "DELETE" });
    toast.success("Moved to cart");
    router.refresh();
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Your wishlist is empty</h2>
        <p className="mt-2 text-sm text-slate-600">Save products here for quick access later.</p>
        <Link
          href="/products"
          className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="rounded-xl border bg-white p-4">
          <Link href={`/products/${item.product.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-lg border">
            <Image
              src={item.product.images[0]?.url || "/frame-square.png"}
              alt={item.product.images[0]?.alt || item.product.name}
              fill
              className="object-cover"
            />
          </Link>
          <Link href={`/products/${item.product.slug}`} className="mt-3 block text-base font-semibold text-slate-900 hover:underline">
            {item.product.name}
          </Link>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatINR(Number(item.product.price))}</p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => moveToCart(item.product.id, item.id)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <ShoppingCart size={14} /> Move to Cart
            </button>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="rounded-lg border px-3 py-2 text-slate-700 hover:bg-slate-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
