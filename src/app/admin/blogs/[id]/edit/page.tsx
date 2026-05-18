export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import BlogForm from "@/components/admin/BlogForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminBlogsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.blogPost.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Blog</CardTitle>
      </CardHeader>
      <CardContent>
        <BlogForm
          initial={{
            id: item.id,
            title: item.title,
            slug: item.slug,
            content: item.content,
            author: item.author,
            featuredImage: item.featuredImage || "",
            status: item.status as any,
          }}
        />
      </CardContent>
    </Card>
  );
}
