"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { productSchema } from "@/lib/validators";
import { toSlug } from "@/lib/admin";
import { z } from "zod";
import ImageUploader from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormValues = z.input<typeof productSchema>;

export type ProductFormInitial = Partial<
  FormValues & {
    id: string;
  }
>;

export default function ProductForm({
  categories,
  initial,
}: {
  categories: Array<{ id: string; name: string }>;
  initial?: ProductFormInitial;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initial?.name || "",
      slug: initial?.slug || "",
      description: initial?.description || "",
      price: initial?.price || 0,
      stock: initial?.stock || 0,
      rating: initial?.rating || 0,
      categoryId: initial?.categoryId || "",
      productType: initial?.productType || "EYEGLASSES",
      shape: initial?.shape || "",
      colors: initial?.colors || [],
      availableColors: initial?.availableColors || [],
      mainImage: initial?.mainImage || "",
      additionalImages: initial?.additionalImages || [],
      customizationType: initial?.customizationType || "EYEGLASSES",
      powerRange: initial?.powerRange || "",
      status: initial?.status || "ACTIVE",
      isTrending: initial?.isTrending || false,
      isFeatured: initial?.isFeatured || false,
      featured: initial?.featured || false,
      imageUrls: initial?.imageUrls || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "availableColors",
  });

  const additionalImages = form.watch("additionalImages");
  const mainImage = form.watch("mainImage");
  const colorsText = (form.watch("colors") || []).join(", ");

  async function onSubmit(values: FormValues) {
    try {
      setSubmitting(true);
      const payload: FormValues = {
        ...values,
        slug: values.slug?.trim() ? toSlug(values.slug) : toSlug(values.name),
        colors: values.colors,
        imageUrls: values.additionalImages,
      };

      const endpoint = initial?.id ? `/api/admin/products/${initial.id}` : "/api/admin/products";
      const method = initial?.id ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save product");

      toast.success(initial?.id ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Unable to save product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <Input {...form.register("name")} placeholder="Royal Titanium Edge" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Slug</label>
          <div className="flex gap-2">
            <Input {...form.register("slug")} placeholder="royal-titanium-edge" />
            <Button type="button" variant="outline" onClick={() => form.setValue("slug", toSlug(form.getValues("name")))}>
              Auto
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select className="ro-input h-10" {...form.register("categoryId")}>
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Product Type</label>
          <select className="ro-input h-10" {...form.register("productType")}>
            <option value="EYEGLASSES">Eyeglasses</option>
            <option value="SUNGLASSES">Sunglasses</option>
            <option value="CONTACT_LENSES">Contact Lenses</option>
            <option value="KIDS_EYEWEAR">Kids Eyewear</option>
            <option value="ACCESSORIES">Accessories</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Customization Type</label>
          <select className="ro-input h-10" {...form.register("customizationType")}>
            <option value="EYEGLASSES">Eyeglasses</option>
            <option value="SUNGLASSES">Sunglasses</option>
            <option value="CONTACT_LENSES">Contact Lenses</option>
            <option value="ACCESSORIES">Accessories</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select className="ro-input h-10" {...form.register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Price</label>
          <Input type="number" step="0.01" {...form.register("price", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock</label>
          <Input type="number" {...form.register("stock", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating</label>
          <div className="flex items-center gap-2">
            <Input type="number" min={0} max={5} step="0.1" {...form.register("rating", { valueAsNumber: true })} />
            <Star size={16} className="text-amber-500" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Shape</label>
          <Input {...form.register("shape")} placeholder="Round / Rectangle" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Power Range</label>
          <Input {...form.register("powerRange")} placeholder="GENERAL_EYEWEAR / TYPE_1" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Available Colors (comma separated text)</label>
          <Input
            value={colorsText}
            onChange={(event) =>
              form.setValue(
                "colors",
                event.target.value
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Black, Blue, Grey"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea rows={6} {...form.register("description")} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("isTrending")} />
          Trending
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("isFeatured")} />
          Is Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("featured")} />
          Featured Badge
        </label>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Color Swatches</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", hexCode: "#000000" })}>
            <Plus size={14} />
            Add Color
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
              <Input placeholder="Color name" {...form.register(`availableColors.${index}.name`)} />
              <Input placeholder="#000000" {...form.register(`availableColors.${index}.hexCode`)} />
              <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <ImageUploader
        label="Main Image"
        value={mainImage ? [mainImage] : []}
        onChange={(images) => form.setValue("mainImage", images[0] || "")}
      />

      <ImageUploader
        label="Additional Images"
        value={additionalImages || []}
        onChange={(images) => {
          form.setValue("additionalImages", images);
          form.setValue("imageUrls", images);
        }}
        multiple
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : initial?.id ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
