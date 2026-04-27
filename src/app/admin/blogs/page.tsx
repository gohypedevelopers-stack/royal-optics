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

export default async function AdminBlogsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = String(searchParams.q || "").trim();
  const status = String(searchParams.status || "").trim();
  const page = parsePage(String(searchParams.page || "1"), 1);
  const limit = parseLimit(String(searchParams.limit || "10"), 10, 50);

  const where: Prisma.BlogPostWhereInput = {
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { author: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status: status as any } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Blogs</CardTitle>
            <Button asChild>
              <Link href="/admin/blogs/new">New Blog</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-3">
            <input name="q" defaultValue={q} className="ro-input md:col-span-2" placeholder="Search title, slug, author" />
            <select name="status" defaultValue={status} className="ro-input h-10">
              <option value="">All status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
            <div className="md:col-span-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">{total} total blog posts</p>
              <Button type="submit" variant="outline">
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="No blog posts found" description="Create a new post to publish content." />
      ) : (
        <DataTable
          headers={[
            { key: "title", label: "Title" },
            { key: "author", label: "Author" },
            { key: "status", label: "Status" },
            { key: "created", label: "Created" },
            { key: "updated", label: "Updated" },
            { key: "actions", label: "Actions" },
          ]}
        >
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-slate-500">{item.slug}</p>
              </TableCell>
              <TableCell>{item.author}</TableCell>
              <TableCell>
                <StatusBadge value={item.status} />
              </TableCell>
              <TableCell>{new Date(item.createdAt).toLocaleDateString("en-IN")}</TableCell>
              <TableCell>{new Date(item.updatedAt).toLocaleDateString("en-IN")}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/blogs/${item.id}/edit`}>Edit</Link>
                  </Button>
                  <DeleteButton endpoint={`/api/admin/blogs/${item.id}`} title="Delete blog?" description="This blog post will be removed." />
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
            <Link href={`/admin/blogs?${buildQuery(searchParams, page - 1)}`}>Previous</Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
            <Link href={`/admin/blogs?${buildQuery(searchParams, page + 1)}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
