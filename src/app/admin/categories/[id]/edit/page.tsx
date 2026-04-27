export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import CategoryForm from "@/components/admin/CategoryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminCategoryEditPage({ params }: { params: { id: string } }) {
  const [item, parentOptions] = await Promise.all([
    prisma.category.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({
      where: { id: { not: params.id }, parentId: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { children: true } },
      },
    }),
  ]);

  if (!item) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Category</CardTitle>
      </CardHeader>
      <CardContent>
        <CategoryForm
          parentOptions={parentOptions.map((option) => ({
            id: option.id,
            name: option.name,
            childCount: option._count.children,
          }))}
          initial={{
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description || "",
            imageUrl: item.imageUrl || "",
            status: item.status as any,
            parentId: item.parentId,
          }}
        />
      </CardContent>
    </Card>
  );
}
