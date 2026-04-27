"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { categorySchema } from "@/lib/validators";
import { toSlug } from "@/lib/admin";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormValues = z.input<typeof categorySchema>;

export default function CategoryForm({
  parentOptions,
  initial,
}: {
  parentOptions: Array<{ id: string; name: string; childCount: number }>;
  initial?: Partial<FormValues> & { id?: string };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initial?.name || "",
      slug: initial?.slug || "",
      description: initial?.description || "",
      imageUrl: initial?.imageUrl || "",
      status: initial?.status || "ACTIVE",
      parentId: initial?.parentId || null,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        slug: values.slug?.trim() ? toSlug(values.slug) : toSlug(values.name),
      };

      const endpoint = initial?.id ? `/api/admin/categories/${initial.id}` : "/api/admin/categories";
      const method = initial?.id ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save category");

      toast.success(initial?.id ? "Category updated" : "Category created");
      router.push("/admin/categories");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Unable to save category");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input {...form.register("name")} placeholder="Sunglasses" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Slug</label>
          <div className="flex gap-2">
            <Input {...form.register("slug")} placeholder="sunglasses" />
            <Button type="button" variant="outline" onClick={() => form.setValue("slug", toSlug(form.getValues("name")))}>
              Auto
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select className="ro-input h-10" {...form.register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Parent Category</label>
          <select
            className="ro-input h-10"
            value={form.watch("parentId") || ""}
            onChange={(event) => form.setValue("parentId", event.target.value || null)}
          >
            <option value="">No parent</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.childCount > 0 ? ` (${item.childCount} children)` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Create parent first, then assign child categories under it.
          </p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Image URL</label>
          <Input {...form.register("imageUrl")} placeholder="/category-sunglasses.png" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea rows={4} {...form.register("description")} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : initial?.id ? "Update Category" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
