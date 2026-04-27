import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluatePromoCode } from "@/lib/pricing";
import { computeDeliveryFee } from "@/lib/shipping";
import { getOwnerCart } from "@/lib/cart";

const previewSchema = z.object({
  promoCode: z.string().max(40).optional(),
});

export async function POST(request: Request) {
  try {
    const payload = previewSchema.parse(await request.json());
    const cartItems = await getOwnerCart();

    if (!cartItems.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const subTotal = cartItems.reduce((sum, item) => sum + Number(item.lineTotal), 0);
    const { promo, discount, error: promoError } = await evaluatePromoCode(payload.promoCode, subTotal);

    if (promoError && payload.promoCode) {
      return NextResponse.json({ error: promoError }, { status: 400 });
    }

    const shippingFee = computeDeliveryFee(
      cartItems.map((item) => ({
        customizationType: item.product.customizationType,
        lensDetails: item.lensDetails,
      })),
    );

    const grandTotal = Math.max(0, subTotal - discount + shippingFee);

    return NextResponse.json({
      summary: {
        subTotal,
        discount,
        shippingFee,
        grandTotal,
        appliedPromoCode: promo?.code || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Unable to preview cart summary" },
      { status: 400 },
    );
  }
}
