export const dynamic = "force-dynamic";

import CategoryForm from "@/components/admin/CategoryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminCategoryNewPage() {
  const parentOptions = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { children: true } },
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Category</CardTitle>
      </CardHeader>
      <CardContent>
        <CategoryForm
          parentOptions={parentOptions.map((item) => ({
            id: item.id,
            name: item.name,
            childCount: item._count.children,
          }))}
        />
      </CardContent>
    </Card>
  );
}
