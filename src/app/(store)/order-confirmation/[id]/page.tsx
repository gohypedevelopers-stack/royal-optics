export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock3, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { buildLensDisplayRows, formatColorLabel } from "@/lib/lens-display";
import { prisma } from "@/lib/prisma";

function paymentStatusLabel(value: string) {
  if (value === "PAID") return "Paid";
  if (value === "PENDING") return "Pending";
  if (value === "FAILED") return "Failed";
  if (value === "REFUNDED") return "Refunded";
  return value;
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      payment: true,
      address: true,
    },
  });

  if (!order) {
    notFound();
  }

  if (session?.role === "USER" && order.userId !== session.userId) {
    notFound();
  }

  const shipping = (order.shippingSnapshot || {}) as Record<string, any>;

  return (
    <div className="relative mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.1),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.1),transparent_40%)]" />

      <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-blue-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Order Placed
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Thank You for Your Order!</h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Order <span className="font-semibold text-slate-900">{order.orderNumber}</span> received successfully.
              Aap status <span className="font-semibold text-slate-900">My Orders</span> me track kar sakte ho.
            </p>
          </div>

          <div className="grid gap-2 sm:min-w-[250px]">
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
            <Link
              href="/orders"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <PackageCheck className="h-4 w-4" />
              View My Orders
            </Link>
          </div>
        </div>
      </section>

      <div className="relative mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Items in This Order</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => {
              const selectionRows = buildLensDisplayRows({
                lensDetails: item.lensDetails,
                selectedColor: item.selectedColor,
                includeDefaultMode: true,
              }).filter((row) => row.label !== "Frame Color");

              return (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.productName}</p>
                      <p className="text-slate-600">Qty: {item.quantity}</p>
                      <p className="text-slate-600">Frame Color: {formatColorLabel(item.selectedColor) || "-"}</p>
                    </div>
                    <p className="text-base font-bold text-slate-900">{formatINR(Number(item.lineTotal))}</p>
                  </div>

                  {selectionRows.length > 0 && (
                    <div className="mt-3 grid gap-1 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 sm:grid-cols-2">
                      {selectionRows.map((row) => (
                        <p key={`${item.id}-${row.label}-${row.value}`}>
                          <span className="font-semibold text-slate-900">{row.label}:</span> {row.value}
                        </p>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <Clock3 className="h-4 w-4" />
                Status
              </span>
              <strong className="text-slate-900">{order.status.replaceAll("_", " ")}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span>Payment</span>
              <strong className="text-slate-900">{paymentStatusLabel(order.paymentStatus)}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span>Method</span>
              <strong className="text-slate-900">{order.paymentMethod}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span>Subtotal</span>
              <strong>{formatINR(Number(order.subTotal))}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span>Discount</span>
              <strong>-{formatINR(Number(order.discountTotal))}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span>Shipping</span>
              <strong>{Number(order.shippingFee) > 0 ? formatINR(Number(order.shippingFee)) : "Free"}</strong>
            </p>
            <p className="flex items-center justify-between border-t border-slate-200 pt-2 text-base">
              <span>Grand Total</span>
              <strong>{formatINR(Number(order.grandTotal))}</strong>
            </p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
            <p className="inline-flex items-center gap-2 font-semibold">
              <Truck className="h-4 w-4" />
              Shipping Address
            </p>
            <p className="mt-1 text-slate-700">{shipping.fullName || order.address?.fullName || "-"}</p>
            <p className="text-slate-600">
              {[
                shipping.addressLine1,
                shipping.addressLine2,
                shipping.city,
                shipping.state,
                shipping.postalCode,
                shipping.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="text-slate-600">{shipping.phone || order.address?.phone || "-"}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
