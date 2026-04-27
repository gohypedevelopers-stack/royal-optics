"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AddToCartButton({
  productId,
  quantity = 1,
  className,
}: {
  productId: string;
  quantity?: number;
  className?: string;
}) {
  const router = useRouter();

  async function onAddToCart() {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });

    if (!response.ok) {
      toast.error("Failed to add to cart");
      return;
    }

    toast.success("Added to cart");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onAddToCart}
      className={
        className || "rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      }
    >
      Add to Cart
    </button>
  );
}
