"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import { buildLensDisplayRows, formatColorLabel } from "@/lib/lens-display";
import { computeDeliveryFee } from "@/lib/shipping";

type CartItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selectedColor: string;
  lensDetails: any;
  product: {
    id: string;
    name: string;
    slug: string;
    customizationType: string;
    images: { url: string; alt: string | null }[];
  };
};

export default function CartList({ items }: { items: CartItem[] }) {
  const router = useRouter();

  const subTotal = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
  const shippingFee = computeDeliveryFee(
    items.map((item) => ({
      customizationType: item.product.customizationType,
      lensDetails: item.lensDetails,
    })),
  );
  const grandTotal = subTotal + shippingFee;

  async function updateQuantity(itemId: string, quantity: number) {
    const response = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId: itemId, quantity }),
    });

    if (!response.ok) {
      toast.error("Failed to update quantity");
      return;
    }

    router.refresh();
  }

  async function removeItem(itemId: string) {
    const response = await fetch(`/api/cart?id=${itemId}`, { method: "DELETE" });

    if (!response.ok) {
      toast.error("Failed to remove item");
      return;
    }

    toast.success("Removed from cart");
    router.refresh();
  }

  if (!items.length) {
    return (
      <div className="ro-card p-8 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Your cart is empty</h2>
        <p className="mt-2 text-sm text-slate-500">Start exploring products and add your first frame.</p>
        <Link href="/products" className="ro-btn-primary mt-5">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="ro-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-3 font-semibold">Product</th>
                <th className="px-3 py-3 font-semibold">Customization</th>
                <th className="px-3 py-3 font-semibold">Qty</th>
                <th className="px-3 py-3 font-semibold">Unit Price</th>
                <th className="px-3 py-3 font-semibold">Subtotal</th>
                <th className="px-3 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isContactLens = item.product.customizationType === "CONTACT_LENSES";
                const displayQuantity = isContactLens ? 1 : item.quantity;

                return (
                  <tr key={item.id} className="border-t border-slate-200 align-top">
                  <td className="px-3 py-3">
                    <div className="flex min-w-[240px] items-start gap-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md border border-slate-200">
                        <Image
                          src={item.product.images[0]?.url || "/frame-square.png"}
                          alt={item.product.images[0]?.alt || item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <Link href={`/products/${item.product.slug}`} className="font-semibold text-slate-900 hover:underline">
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-slate-600">Frame Color: {formatColorLabel(item.selectedColor) || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {(() => {
                      const selectionRows = buildLensDisplayRows({
                        lensDetails: item.lensDetails,
                        selectedColor: item.selectedColor,
                      }).filter((row) => {
                        if (row.label === "Frame Color") return false;
                        if (isContactLens && (row.label === "Right Boxes" || row.label === "Left Boxes")) return false;
                        return true;
                      });

                      if (!selectionRows.length) {
                        return <p className="min-w-[180px] text-xs text-slate-700">Standard configuration</p>;
                      }

                      return (
                        <div className="min-w-[210px] space-y-1">
                          {selectionRows.map((row) => (
                            <p key={`${item.id}-${row.label}-${row.value}`} className="text-xs text-slate-700">
                              <span className="font-semibold text-slate-900">{row.label}:</span> {row.value}
                            </p>
                          ))}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-3">
                    <div className="inline-flex items-center gap-1 rounded-md border border-slate-300 p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isContactLens}
                        className="rounded p-1 hover:bg-slate-100"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{displayQuantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isContactLens}
                        className="rounded p-1 hover:bg-slate-100"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-700">
                    {isContactLens ? (
                      <span>
                        {formatINR(Number(item.unitPrice))} <span className="text-xs text-slate-500">x 2 (Contact Lens)</span>
                      </span>
                    ) : (
                      formatINR(Number(item.unitPrice))
                    )}
                  </td>
                  <td className="px-3 py-3 font-semibold text-slate-900">{formatINR(Number(item.lineTotal))}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="ro-card h-fit p-5">
        <h3 className="text-lg font-semibold text-slate-900">Order Summary</h3>

        <div className="mt-4 space-y-2 text-sm">
          <p className="flex items-center justify-between">
            <span>Subtotal</span>
            <strong>{formatINR(subTotal)}</strong>
          </p>
          <p className="flex items-center justify-between">
            <span>Shipping</span>
            <strong>{shippingFee > 0 ? formatINR(shippingFee) : "Free"}</strong>
          </p>
          <p className="flex items-center justify-between border-t border-slate-200 pt-3 text-base">
            <span>Grand Total</span>
            <strong>{formatINR(grandTotal)}</strong>
          </p>
        </div>

        <Link href="/checkout" className="ro-btn-primary mt-5 w-full">
          Proceed to Checkout
        </Link>
      </aside>
    </div>
  );
}
