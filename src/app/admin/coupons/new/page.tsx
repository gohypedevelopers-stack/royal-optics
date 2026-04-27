export const dynamic = "force-dynamic";

import CouponForm from "@/components/admin/CouponForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminCouponsNewPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Coupon</CardTitle>
      </CardHeader>
      <CardContent>
        <CouponForm />
      </CardContent>
    </Card>
  );
}

