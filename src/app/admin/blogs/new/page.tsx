export const dynamic = "force-dynamic";

import BlogForm from "@/components/admin/BlogForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminBlogsNewPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Blog</CardTitle>
      </CardHeader>
      <CardContent>
        <BlogForm />
      </CardContent>
    </Card>
  );
}
