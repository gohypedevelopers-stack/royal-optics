"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { blogSchema } from "@/lib/validators";
import { toSlug } from "@/lib/admin";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormValues = z.input<typeof blogSchema>;

export default function BlogForm({
  initial,
}: {
  initial?: Partial<FormValues> & { id?: string };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: initial?.title || "",
      slug: initial?.slug || "",
      content: initial?.content || "",
      author: initial?.author || "Royal Optics",
      featuredImage: initial?.featuredImage || "",
      status: initial?.status || "DRAFT",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        slug: values.slug?.trim() ? toSlug(values.slug) : toSlug(values.title),
      };
      const endpoint = initial?.id ? `/api/admin/blogs/${initial.id}` : "/api/admin/blogs";
      const method = initial?.id ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save blog");
      toast.success(initial?.id ? "Blog updated" : "Blog created");
      router.push("/admin/blogs");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Unable to save blog");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Title</label>
          <Input {...form.register("title")} placeholder="How to pick the right frame for your face shape" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Slug</label>
          <div className="flex gap-2">
            <Input {...form.register("slug")} placeholder="how-to-pick-frame" />
            <Button type="button" variant="outline" onClick={() => form.setValue("slug", toSlug(form.getValues("title")))}>
              Auto
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Author</label>
          <Input {...form.register("author")} placeholder="Royal Optics" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select className="ro-input h-10" {...form.register("status")}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Featured Image</label>
          <Input {...form.register("featuredImage")} placeholder="/blogs/blog-cover.jpg" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Content</label>
          <Textarea rows={14} {...form.register("content")} placeholder="Write rich blog content here..." />
          <p className="text-xs text-slate-500">Basic HTML tags are sanitized and preserved on save.</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : initial?.id ? "Update Blog" : "Create Blog"}
        </Button>
      </div>
    </form>
  );
}
