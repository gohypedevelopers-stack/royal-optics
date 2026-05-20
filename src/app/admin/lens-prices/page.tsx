export const dynamic = "force-dynamic";

import LensPriceEditor from "@/components/admin/LensPriceEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminLensPricesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = String(resolvedSearchParams.q || "").trim();
  const items = await prisma.lensPrice.findMany({
    where: q
      ? {
          OR: [
            { key: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { group: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    orderBy: [{ category: "asc" }, { group: "asc" }, { sortOrder: "asc" }, { key: "asc" }],
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Manage Lens Prices</CardTitle>
      </CardHeader>
      <CardContent>
        <LensPriceEditor
          initialItems={items.map((item) => ({
            ...item,
            value: Number(item.value),
          }))}
        />
      </CardContent>
    </Card>
  );
}
