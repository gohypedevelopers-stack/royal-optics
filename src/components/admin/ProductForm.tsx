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
      contactLensType: initial?.contactLensType || "",
      contactLensCategory: initial?.contactLensCategory || "",
      contactLensDisposability: initial?.contactLensDisposability || "",
      gender: initial?.gender || "",
      status: initial?.status || "ACTIVE",
      isTrending: initial?.isTrending || false,
      isFeatured: initial?.isFeatured || false,
      featured: initial?.featured || false,
      discount: initial?.discount || 0,
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
  const productType = form.watch("productType");
  const customizationType = form.watch("customizationType");
  const contactLensType = form.watch("contactLensType");
  const contactLensCategory = form.watch("contactLensCategory");

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
        
        {(productType === "CONTACT_LENSES" || customizationType === "CONTACT_LENSES") && (
          <div className="col-span-full space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                Contact Lens Classification & Filters
              </h3>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                Step-by-step filter setup
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Step 1: Lens Type */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">1</span>
                  Lens Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="ro-input h-10 border-blue-300 bg-white shadow-sm"
                  {...form.register("contactLensType", {
                    onChange: (e) => {
                      const val = e.target.value;
                      if (val !== "POWER") {
                        form.setValue("contactLensCategory", "");
                      }
                      if (val === "CARE") {
                        form.setValue("contactLensDisposability", "");
                      }
                    },
                  })}
                >
                  <option value="">-- Select Lens Type --</option>
                  <option value="POWER">Power Lenses</option>
                  <option value="NON_POWER">Non-Power Lenses</option>
                  <option value="CARE">Contact Lenses Care</option>
                </select>
              </div>

              {/* Step 2: Clear vs Color (Visible if POWER or if category already has value) */}
              {(contactLensType === "POWER" || !!form.watch("contactLensCategory")) && (
                <div className="space-y-1.5 animate-in fade-in duration-300">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-800">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">2</span>
                    Lens Sub-Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="ro-input h-10 border-blue-300 bg-white shadow-sm"
                    {...form.register("contactLensCategory")}
                  >
                    <option value="">-- Select Category --</option>
                    <option value="CLEAR">Clear Lenses</option>
                    <option value="COLOR">Color Lenses</option>
                  </select>
                </div>
              )}

              {/* Step 3: Modality / Replacement Schedule */}
              {(contactLensType === "POWER" || contactLensType === "NON_POWER" || !!form.watch("contactLensDisposability")) && (
                <div className="space-y-1.5 animate-in fade-in duration-300">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-800">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                      {contactLensType === "POWER" ? "3" : "2"}
                    </span>
                    Modality / Disposability
                  </label>
                  <select className="ro-input h-10 border-blue-300 bg-white shadow-sm" {...form.register("contactLensDisposability")}>
                    <option value="">-- Select Modality --</option>
                    <option value="DAILIES">Dailies</option>
                    <option value="2_WEEKS">2 Weeks</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="3_MONTHS">3 Months</option>
                    <option value="6_MONTHS">6 Months</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="TORIC">Toric (SPH+CYL)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Helper message if previous selection is missing */}
            {!contactLensType && (
              <p className="text-xs text-blue-700/80 italic">
                Select <strong>Lens Type</strong> above to reveal further sub-category & modality choices.
              </p>
            )}
            {contactLensType === "POWER" && !contactLensCategory && (
              <p className="text-xs text-blue-700/80 italic">
                Select <strong>Clear Lenses</strong> or <strong>Color Lenses</strong> to reveal available modality options.
              </p>
            )}
          </div>
        )}

        {(productType === "EYEGLASSES" || productType === "SUNGLASSES") && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <select className="ro-input h-10" {...form.register("gender")}>
              <option value="">Unisex / None</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="boy">Boy</option>
              <option value="girl">Girl</option>
            </select>
          </div>
        )}

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
          <label className="text-sm font-medium">Discount (%)</label>
          <Input type="number" min="0" max="100" {...form.register("discount", { valueAsNumber: true })} />
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
          <select className="ro-input h-10" {...form.register("powerRange")}>
            <option value="">None (No custom range)</option>
            <option value="GENERAL_EYEWEAR">GENERAL_EYEWEAR (General Eyewear)</option>
            <option value="TYPE_1">TYPE_1 (-0.50 to -9.00)</option>
            <option value="TYPE_2">TYPE_2 (-0.50 to -10.00)</option>
            <option value="TYPE_3">TYPE_3 (-0.50 to -12.00)</option>
            <option value="TYPE_4">TYPE_4 (-12.50 to -20.00)</option>
            <option value="TYPE_5">TYPE_5 (+0.50 to +8.00)</option>
            <option value="TYPE_6">TYPE_6 (+8.50 to +15.00)</option>
            <option value="TYPE_7">TYPE_7 (+0.50 to +2.00)</option>
            <option value="TYPE_8">TYPE_8 (+2.50 to +5.00)</option>
          </select>
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
