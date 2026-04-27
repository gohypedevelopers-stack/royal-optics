export const dynamic = "force-dynamic";

import LensPriceEditor from "@/components/admin/LensPriceEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminLensPricesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = String(searchParams.q || "").trim();
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
