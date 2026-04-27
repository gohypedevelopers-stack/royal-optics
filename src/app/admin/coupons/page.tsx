export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import DataTable, { TableCell, TableRow } from "@/components/admin/DataTable";
import DeleteButton from "@/components/admin/DeleteButton";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseLimit, parsePage } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";

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

function formatDiscount(discountType: string, discountValue: number) {
  return discountType === "PERCENTAGE" ? `${discountValue}%` : formatINR(discountValue);
}

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = String(searchParams.q || "").trim();
  const active = String(searchParams.active || "").trim();
  const discountType = String(searchParams.discountType || "").trim();
  const page = parsePage(String(searchParams.page || "1"), 1);
  const limit = parseLimit(String(searchParams.limit || "10"), 10, 50);

  const where: Prisma.PromoCodeWhereInput = {
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(active === "active" ? { isActive: true } : {}),
    ...(active === "inactive" ? { isActive: false } : {}),
    ...(discountType ? { discountType: discountType as any } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.promoCode.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Coupons</CardTitle>
            <Button asChild>
              <Link href="/admin/coupons/new">Create Coupon</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-3">
            <input name="q" defaultValue={q} className="ro-input md:col-span-2" placeholder="Search code or description" />
            <select name="discountType" defaultValue={discountType} className="ro-input h-10">
              <option value="">All discount types</option>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FLAT">Flat</option>
            </select>
            <select name="active" defaultValue={active} className="ro-input h-10">
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="md:col-span-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">{total} total coupons</p>
              <Button type="submit" variant="outline">
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          title="No coupons found"
          description="Create your first coupon to run promotions."
          action={
            <Button asChild>
              <Link href="/admin/coupons/new">Create Coupon</Link>
            </Button>
          }
        />
      ) : (
        <DataTable
          headers={[
            { key: "code", label: "Code" },
            { key: "discount", label: "Discount" },
            { key: "limits", label: "Limits" },
            { key: "usage", label: "Usage" },
            { key: "window", label: "Validity" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
        >
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <p className="font-semibold">{item.code}</p>
                <p className="line-clamp-1 text-xs text-slate-500">{item.description || "-"}</p>
              </TableCell>
              <TableCell>
                <p className="font-medium">{formatDiscount(item.discountType, Number(item.discountValue))}</p>
                <p className="text-xs text-slate-500">{item.discountType}</p>
              </TableCell>
              <TableCell>
                <p className="text-sm">Min: {item.minOrderAmount ? formatINR(Number(item.minOrderAmount)) : "-"}</p>
                <p className="text-xs text-slate-500">Max: {item.maxDiscountAmount ? formatINR(Number(item.maxDiscountAmount)) : "-"}</p>
              </TableCell>
              <TableCell>
                <p className="text-sm">{item.usedCount} used</p>
                <p className="text-xs text-slate-500">Limit: {item.usageLimit ?? "Unlimited"}</p>
              </TableCell>
              <TableCell>
                <p className="text-sm">{item.startsAt ? new Date(item.startsAt).toLocaleDateString("en-IN") : "-"}</p>
                <p className="text-xs text-slate-500">{item.endsAt ? new Date(item.endsAt).toLocaleDateString("en-IN") : "No expiry"}</p>
              </TableCell>
              <TableCell>
                <StatusBadge value={item.isActive ? "ACTIVE" : "INACTIVE"} />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/coupons/${item.id}/edit`}>Edit</Link>
                  </Button>
                  <DeleteButton endpoint={`/api/admin/coupons/${item.id}`} title="Delete coupon?" description="This coupon will no longer be available." />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" disabled={page <= 1}>
            <Link href={`/admin/coupons?${buildQuery(searchParams, page - 1)}`}>Previous</Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
            <Link href={`/admin/coupons?${buildQuery(searchParams, page + 1)}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

