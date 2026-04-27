export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import CouponForm from "@/components/admin/CouponForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export default async function AdminCouponsEditPage({ params }: { params: { id: string } }) {
  const item = await prisma.promoCode.findUnique({ where: { id: params.id } });
  if (!item) notFound();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Coupon</CardTitle>
      </CardHeader>
      <CardContent>
        <CouponForm
          initial={{
            id: item.id,
            code: item.code,
            description: item.description || "",
            discountType: item.discountType as "FLAT" | "PERCENTAGE",
            discountValue: Number(item.discountValue),
            minOrderAmount: item.minOrderAmount ? Number(item.minOrderAmount) : undefined,
            maxDiscountAmount: item.maxDiscountAmount ? Number(item.maxDiscountAmount) : undefined,
            startsAt: item.startsAt,
            endsAt: item.endsAt,
            usageLimit: item.usageLimit || undefined,
            isActive: item.isActive,
          }}
        />
      </CardContent>
    </Card>
  );
}

