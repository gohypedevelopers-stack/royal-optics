export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import DataTable, { TableCell, TableRow } from "@/components/admin/DataTable";
import DeleteButton from "@/components/admin/DeleteButton";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import OrderStatusSelect from "@/components/OrderStatusSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { parseLimit, parsePage } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function buildQuery(searchParams: Record<string, string | string[] | undefined>, nextPage: number) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (key !== "page") {
      params.set(key, value);
    }
  });
  params.set("page", String(nextPage));
  return params.toString();
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = String(searchParams.q || "").trim();
  const status = String(searchParams.status || "").trim();
  const dateFrom = String(searchParams.dateFrom || "").trim();
  const dateTo = String(searchParams.dateTo || "").trim();
  const page = parsePage(String(searchParams.page || "1"), 1);
  const limit = parseLimit(String(searchParams.limit || "10"), 10, 50);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status: status as any } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
            ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { user: { username: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { user: { phone: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { username: true, email: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-5">
            <input name="q" defaultValue={q} className="ro-input md:col-span-2" placeholder="Search by order, customer, phone or email" />
            <select name="status" defaultValue={status} className="ro-input h-10">
              <option value="">All status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <input name="dateFrom" defaultValue={dateFrom} className="ro-input h-10" type="date" />
            <input name="dateTo" defaultValue={dateTo} className="ro-input h-10" type="date" />
            <div className="md:col-span-5 flex items-center justify-between">
              <p className="text-xs text-slate-500">{total} orders found</p>
              <Button type="submit" variant="outline">
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="No orders found" description="Try adjusting search and filter criteria." />
      ) : (
        <DataTable
          headers={[
            { key: "order", label: "Order" },
            { key: "customer", label: "Customer" },
            { key: "address", label: "Address" },
            { key: "payment", label: "Payment" },
            { key: "total", label: "Amount" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
        >
          {items.map((item) => {
            const shipping = (item.shippingSnapshot || {}) as any;
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <Link href={`/admin/orders/${item.id}`} className="font-semibold text-blue-700 hover:underline">
                    {item.orderNumber}
                  </Link>
                  <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("en-IN")}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.items.length} item(s)</p>
                  <p className="line-clamp-1 text-xs text-slate-500">
                    {item.items.map((orderItem) => `${orderItem.productName} x${orderItem.quantity}`).join(", ")}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{item.user.username}</p>
                  <p className="text-xs text-slate-500">{item.user.email}</p>
                  <p className="text-xs text-slate-500">{item.user.phone}</p>
                </TableCell>
                <TableCell>
                  <p className="text-xs text-slate-600">{shipping.fullName || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {[shipping.addressLine1, shipping.addressLine2, shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(", ")}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{item.paymentMethod}</p>
                  <p className="text-xs text-slate-500">{item.paymentStatus}</p>
                </TableCell>
                <TableCell>{formatINR(Number(item.grandTotal))}</TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <StatusBadge value={item.status} />
                    <OrderStatusSelect orderId={item.id} status={item.status as any} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/orders/${item.id}`}>View</Link>
                    </Button>
                    <DeleteButton endpoint={`/api/orders/${item.id}`} label="Cancel/Delete" title="Delete order?" description="This order record will be deleted permanently." />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </DataTable>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" disabled={page <= 1}>
            <Link href={`/admin/orders?${buildQuery(searchParams, page - 1)}`}>Previous</Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
            <Link href={`/admin/orders?${buildQuery(searchParams, page + 1)}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
