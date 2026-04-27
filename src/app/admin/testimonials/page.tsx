export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import DataTable, { TableCell, TableRow } from "@/components/admin/DataTable";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import TestimonialActions from "@/components/admin/TestimonialActions";
import { Badge } from "@/components/ui/badge";
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

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = String(searchParams.q || "").trim();
  const status = String(searchParams.status || "").trim();
  const page = parsePage(String(searchParams.page || "1"), 1);
  const limit = parseLimit(String(searchParams.limit || "10"), 10, 50);

  const where: Prisma.TestimonialWhereInput = {
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status: status as any } : {}),
  };

  const [items, total, pending] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.testimonial.count({ where }),
    prisma.testimonial.count({ where: { status: "PENDING" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Testimonials</CardTitle>
            <Badge variant={pending > 0 ? "warning" : "success"}>{pending} pending</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-2 md:grid-cols-3">
            <input name="q" defaultValue={q} className="ro-input md:col-span-2" placeholder="Search name, email, message" />
            <select name="status" defaultValue={status} className="ro-input h-10">
              <option value="">All status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <div className="md:col-span-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">{total} testimonials found</p>
              <Button type="submit" variant="outline">
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="No testimonials found" description="Incoming customer testimonials will appear here." />
      ) : (
        <DataTable
          headers={[
            { key: "name", label: "Name" },
            { key: "rating", label: "Rating" },
            { key: "message", label: "Message" },
            { key: "status", label: "Status" },
            { key: "date", label: "Created" },
            { key: "actions", label: "Actions" },
          ]}
        >
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-slate-500">{item.email || "No email"}</p>
              </TableCell>
              <TableCell>{item.rating}/5</TableCell>
              <TableCell className="max-w-[340px]">
                <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{item.message}</p>
              </TableCell>
              <TableCell>
                <StatusBadge value={item.status} />
              </TableCell>
              <TableCell>{new Date(item.createdAt).toLocaleDateString("en-IN")}</TableCell>
              <TableCell>
                <TestimonialActions id={item.id} />
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
            <Link href={`/admin/testimonials?${buildQuery(searchParams, page - 1)}`}>Previous</Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
            <Link href={`/admin/testimonials?${buildQuery(searchParams, page + 1)}`}>Next</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
