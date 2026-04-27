export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, Package2, ShoppingBag, Truck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function orderStatusClass(status: string) {
  if (status === "DELIVERED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "CANCELLED") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "PENDING" || status === "PENDING_PAYMENT") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function paymentStatusClass(status: string) {
  if (status === "PAID") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "FAILED") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "REFUNDED") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default async function OrdersPage() {
  const session = await getSession();

  if (!session || session.role !== "USER" || !session.userId) {
    redirect("/login?redirect=/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    include: { items: true, payment: true },
    orderBy: { createdAt: "desc" },
  });

  const totalSpent = orders.reduce((sum, item) => sum + Number(item.grandTotal), 0);
  const activeOrders = orders.filter((item) => item.status !== "DELIVERED" && item.status !== "CANCELLED").length;

  return (
    <div className="relative mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_40%)]" />

      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">My Orders</h1>
            <p className="mt-2 text-sm text-slate-600">Track status, payments and order details in one place.</p>
          </div>
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total Orders</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{orders.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Active Orders</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{activeOrders}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Total Spent</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatINR(totalSpent)}</p>
          </div>
        </div>
      </section>

      <section className="relative mt-6 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                <p className="mt-1 inline-flex items-center gap-2 text-xs text-slate-500">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {new Date(order.createdAt).toLocaleString("en-IN")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${orderStatusClass(order.status)}`}>
                    {order.status.replaceAll("_", " ")}
                  </span>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusClass(order.paymentStatus)}`}>
                    Payment: {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">Grand Total</p>
                <p className="text-3xl font-bold leading-none text-slate-900">{formatINR(Number(order.grandTotal))}</p>
                <p className="mt-1 text-xs text-slate-500">{order.paymentMethod}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <Package2 className="h-4 w-4" />
                Items
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                    <p className="font-semibold text-slate-900">{item.productName}</p>
                    <p className="text-xs text-slate-600">Qty: {item.quantity}</p>
                    <p className="text-xs text-slate-600">Amount: {formatINR(Number(item.lineTotal))}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-xs text-slate-500">
                <Truck className="h-3.5 w-3.5" />
                Status updates will appear in your order details.
              </p>
              <Link
                href={`/order-confirmation/${order.id}`}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View Details
              </Link>
            </div>
          </article>
        ))}

        {!orders.length && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-900">No orders found yet.</p>
            <p className="mt-1 text-sm text-slate-600">Start shopping and your orders will appear here.</p>
            <Link
              href="/products"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Explore Products
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
