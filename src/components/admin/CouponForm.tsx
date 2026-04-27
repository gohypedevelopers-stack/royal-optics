"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { promoCodeSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FormValues = z.input<typeof promoCodeSchema>;

function toDateTimeLocal(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function CouponForm({
  initial,
}: {
  initial?: Partial<FormValues> & {
    id?: string;
    startsAt?: Date | string | null;
    endsAt?: Date | string | null;
  };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: initial?.code || "",
      description: initial?.description || "",
      discountType: initial?.discountType || "PERCENTAGE",
      discountValue: initial?.discountValue ?? 10,
      minOrderAmount: initial?.minOrderAmount ?? undefined,
      maxDiscountAmount: initial?.maxDiscountAmount ?? undefined,
      startsAt: toDateTimeLocal(initial?.startsAt),
      endsAt: toDateTimeLocal(initial?.endsAt),
      usageLimit: initial?.usageLimit ?? undefined,
      isActive: initial?.isActive ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      setSubmitting(true);
      const endpoint = initial?.id ? `/api/admin/coupons/${initial.id}` : "/api/admin/coupons";
      const method = initial?.id ? "PATCH" : "POST";
      const payload = {
        ...values,
        code: values.code.trim().toUpperCase(),
      };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save coupon");

      toast.success(initial?.id ? "Coupon updated" : "Coupon created");
      router.push("/admin/coupons");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Unable to save coupon");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Coupon Code</label>
          <Input {...form.register("code")} placeholder="WELCOME10" className="uppercase" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Discount Type</label>
          <select className="ro-input h-10" {...form.register("discountType")}>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FLAT">Flat</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Discount Value</label>
          <Input type="number" step="0.01" {...form.register("discountValue")} placeholder="10" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Usage Limit (optional)</label>
          <Input type="number" step="1" {...form.register("usageLimit")} placeholder="100" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Minimum Order Amount (optional)</label>
          <Input type="number" step="0.01" {...form.register("minOrderAmount")} placeholder="999" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Maximum Discount (optional)</label>
          <Input type="number" step="0.01" {...form.register("maxDiscountAmount")} placeholder="500" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Starts At (optional)</label>
          <Input type="datetime-local" {...form.register("startsAt")} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ends At (optional)</label>
          <Input type="datetime-local" {...form.register("endsAt")} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Description (optional)</label>
          <Textarea rows={3} {...form.register("description")} placeholder="Festival offer for first-time buyers" />
        </div>

        <div className="md:col-span-2">
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...form.register("isActive")} />
            Coupon is active
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : initial?.id ? "Update Coupon" : "Create Coupon"}
        </Button>
      </div>
    </form>
  );
}
