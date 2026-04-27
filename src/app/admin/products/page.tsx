export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import DataTable, { TableCell, TableRow } from "@/components/admin/DataTable";
import DeleteButton from "@/components/admin/DeleteButton";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
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

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = String(searchParams.q || "").trim();
  const categoryId = String(searchParams.categoryId || "").trim();
  const status = String(searchParams.status || "").trim();
  const productType = String(searchParams.productType || "").trim();
  const page = parsePage(String(searchParams.page || "1"), 1);
  const limit = parseLimit(String(searchParams.limit || "10"), 10, 50);

  const where: Prisma.ProductWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status: status as any } : {}),
    ...(productType ? { productType: productType as any } : {}),
  };

  const [items, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        productColors: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Products</CardTitle>
            <Button asChild>
              <Link href="/admin/products/new">New Product</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-2 md:grid-cols-5">
            <input name="q" defaultValue={q} className="ro-input md:col-span-2" placeholder="Search name, slug, description" />
            <select name="categoryId" defaultValue={categoryId} className="ro-input h-10">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={status} className="ro-input h-10">
              <option value="">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Draft</option>
            </select>
            <select name="productType" defaultValue={productType} className="ro-input h-10">
              <option value="">All types</option>
              <option value="EYEGLASSES">Eyeglasses</option>
              <option value="SUNGLASSES">Sunglasses</option>
              <option value="CONTACT_LENSES">Contact Lenses</option>
              <option value="KIDS_EYEWEAR">Kids Eyewear</option>
              <option value="ACCESSORIES">Accessories</option>
            </select>
            <div className="md:col-span-5 flex items-center justify-between">
              <p className="text-xs text-slate-500">{total} total products</p>
              <Button type="submit" variant="outline">
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="No products found" description="Try changing filters or create a new product." action={<Button asChild><Link href="/admin/products/new">Create Product</Link></Button>} />
      ) : (
        <DataTable
          headers={[
            { key: "product", label: "Product" },
            { key: "category", label: "Category" },
            { key: "type", label: "Type" },
            { key: "price", label: "Price" },
            { key: "stock", label: "Stock" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
        >
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.mainImage || item.images[0]?.url || "/frame-square.png"}
                    alt={item.name}
                    className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                  />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.slug}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{item.category.name}</TableCell>
              <TableCell>{String(item.productType || item.customizationType).replaceAll("_", " ")}</TableCell>
              <TableCell>{formatINR(Number(item.price))}</TableCell>
              <TableCell>
                <StatusBadge value={item.stock <= 5 ? "PENDING" : item.stock <= 20 ? "CONFIRMED" : "ACTIVE"} />
                <p className="mt-1 text-xs text-slate-500">{item.stock} units</p>
              </TableCell>
              <TableCell>
                <StatusBadge value={item.status || "DRAFT"} />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/products/${item.id}/edit`}>Edit</Link>
                  </Button>
                  <DeleteButton
                    endpoint={`/api/admin/products/${item.id}`}
                    title="Delete product?"
                    description="This product and its linked images/colors will be removed."
                  />
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
            <Link href={`/admin/products?${buildQuery(searchParams, page - 1)}`}>Previous</Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
            <Link href={`/admin/products?${buildQuery(searchParams, page + 1)}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
