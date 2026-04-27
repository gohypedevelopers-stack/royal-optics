export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Clock3, CreditCard, MapPin, UserRound } from "lucide-react";
import StatusBadge from "@/components/admin/StatusBadge";
import OrderStatusSelect from "@/components/OrderStatusSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { buildLensDisplayRows, formatColorLabel } from "@/lib/lens-display";
import { prisma } from "@/lib/prisma";

const STATUS_TIMELINE = ["PENDING", "CONFIRMED", "PENDING_PAYMENT", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default async function AdminOrderDetailsPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          username: true,
          email: true,
          phone: true,
        },
      },
      address: true,
      items: {
        include: {
          prescriptionDetail: true,
          product: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      },
      payment: true,
    },
  });

  if (!order) notFound();

  const shipping = (order.shippingSnapshot || {}) as any;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Order {order.orderNumber}</CardTitle>
              <StatusBadge value={order.status} />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <UserRound size={15} />
                Customer
              </div>
              <p className="text-sm">{order.user.username}</p>
              <p className="text-xs text-slate-500">{order.user.email}</p>
              <p className="text-xs text-slate-500">{order.user.phone}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <MapPin size={15} />
                Shipping Address
              </div>
              <p className="text-sm">{shipping.fullName || order.address?.fullName || "-"}</p>
              <p className="text-xs text-slate-500">
                {[shipping.addressLine1, shipping.addressLine2, shipping.city, shipping.state, shipping.postalCode, shipping.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="text-xs text-slate-500">{shipping.phone || order.address?.phone || "-"}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <CreditCard size={15} />
                Payment
              </div>
              <p className="text-sm">{order.paymentMethod}</p>
              <p className="text-xs text-slate-500">Payment Status: {order.paymentStatus}</p>
              <p className="text-xs text-slate-500">Provider: {order.payment?.provider || "-"}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Clock3 size={15} />
                Totals
              </div>
              <p className="text-xs text-slate-500">Sub Total: {formatINR(Number(order.subTotal))}</p>
              <p className="text-xs text-slate-500">Discount: {formatINR(Number(order.discountTotal))}</p>
              <p className="text-xs text-slate-500">Shipping: {formatINR(Number(order.shippingFee))}</p>
              <p className="mt-2 text-sm font-semibold">Grand Total: {formatINR(Number(order.grandTotal))}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Status Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {STATUS_TIMELINE.map((step) => {
              const currentIndex = STATUS_TIMELINE.indexOf(String(order.status));
              const stepIndex = STATUS_TIMELINE.indexOf(step);
              const isActive = order.status === "CANCELLED" ? step === "CANCELLED" : stepIndex <= currentIndex;
              return (
                <div key={step} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                  <span>{step.replaceAll("_", " ")}</span>
                  <StatusBadge value={isActive ? "ACTIVE" : "INACTIVE"} />
                </div>
              );
            })}
            <div className="pt-2">
              <OrderStatusSelect orderId={order.id} status={order.status as any} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Ordered Items & Customization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item) => {
            const lens = (item.lensDetails || {}) as any;
            const prescription = item.prescriptionDetail;
            const mergedLens = {
              ...lens,
              mainLensType: lens.mainLensType || prescription?.mainLensType || null,
              prescriptionType: lens.prescriptionType || prescription?.prescriptionType || null,
              readerRight: lens.readerRight || prescription?.readerRight || null,
              readerLeft: lens.readerLeft || prescription?.readerLeft || null,
              svRightSph: lens.svRightSph || prescription?.svRightSph || null,
              svRightCyl: lens.svRightCyl || prescription?.svRightCyl || null,
              svRightAxis: lens.svRightAxis || prescription?.svRightAxis || null,
              svLeftSph: lens.svLeftSph || prescription?.svLeftSph || null,
              svLeftCyl: lens.svLeftCyl || prescription?.svLeftCyl || null,
              svLeftAxis: lens.svLeftAxis || prescription?.svLeftAxis || null,
              lensEnhancementOption: lens.lensEnhancementOption || prescription?.lensEnhancementOption || null,
              color: lens.color || prescription?.color || item.selectedColor || null,
            };

            const selectionRows = buildLensDisplayRows({
              lensDetails: mergedLens,
              selectedColor: item.selectedColor,
              includeDefaultMode: true,
            }).filter((row) => row.label !== "Frame Color");

            return (
              <article key={item.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-xs text-slate-500">
                      Qty {item.quantity} x {formatINR(Number(item.price))} = {formatINR(Number(item.lineTotal))}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500">Frame Color: {formatColorLabel(item.selectedColor) || "-"}</div>
                </div>

                {selectionRows.length ? (
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 md:grid-cols-2 xl:grid-cols-3">
                    {selectionRows.map((row) => (
                      <div key={`${item.id}-${row.label}-${row.value}`}>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{row.label}:</span> {row.value}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">Standard configuration</p>
                )}
              </article>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
