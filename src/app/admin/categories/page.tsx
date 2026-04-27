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

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = String(searchParams.q || "").trim();
  const status = String(searchParams.status || "").trim();
  const page = parsePage(String(searchParams.page || "1"), 1);
  const limit = parseLimit(String(searchParams.limit || "10"), 10, 50);

  const where: Prisma.CategoryWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status: status as any } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.category.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Categories</CardTitle>
            <Button asChild>
              <Link href="/admin/categories/new">New Category</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-3">
            <input name="q" defaultValue={q} className="ro-input md:col-span-2" placeholder="Search name, slug, description" />
            <select name="status" defaultValue={status} className="ro-input h-10">
              <option value="">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <div className="md:col-span-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">{total} total categories</p>
              <Button type="submit" variant="outline">
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="No categories found" description="Try different filters or add a new category." />
      ) : (
        <DataTable
          headers={[
            { key: "name", label: "Category" },
            { key: "hierarchy", label: "Hierarchy" },
            { key: "slug", label: "Slug" },
            { key: "status", label: "Status" },
            { key: "products", label: "Products" },
            { key: "created", label: "Created" },
            { key: "actions", label: "Actions" },
          ]}
        >
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-slate-500 line-clamp-1">{item.description || "No description"}</p>
              </TableCell>
              <TableCell>
                {item.parent ? (
                  <div>
                    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Child
                    </span>
                    <p className="mt-1 text-xs text-slate-500">Parent: {item.parent.name}</p>
                  </div>
                ) : (
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Parent
                  </span>
                )}
              </TableCell>
              <TableCell>{item.slug}</TableCell>
              <TableCell>
                <StatusBadge value={item.status} />
              </TableCell>
              <TableCell>{item._count.products}</TableCell>
              <TableCell>{new Date(item.createdAt).toLocaleDateString("en-IN")}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/categories/${item.id}/edit`}>Edit</Link>
                  </Button>
                  <DeleteButton
                    endpoint={`/api/admin/categories/${item.id}`}
                    title="Delete category?"
                    description="Category with linked products cannot be deleted."
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
            <Link href={`/admin/categories?${buildQuery(searchParams, page - 1)}`}>Previous</Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
            <Link href={`/admin/categories?${buildQuery(searchParams, page + 1)}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
