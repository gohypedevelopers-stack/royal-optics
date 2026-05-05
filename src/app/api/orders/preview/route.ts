import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth";
import { computePrepaidDiscount, evaluatePromoCode } from "@/lib/pricing";
import { computeDeliveryFee } from "@/lib/shipping";

const previewSchema = z.object({
  promoCode: z.string().max(40).optional(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]).default("RAZORPAY"),
});

export async function POST(request: Request) {
  try {
    const session = await requireUserSession();
    const payload = previewSchema.parse(await request.json());

    const ownerKey = `user:${session.userId}`;
    const cartItems = await prisma.cartItem.findMany({
      where: { ownerKey },
      include: {
        product: {
          select: {
            customizationType: true,
          },
        },
      },
    });

    if (!cartItems.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const subTotal = cartItems.reduce((sum, item) => sum + Number(item.lineTotal), 0);
    const { promo, discount, error: promoError } = await evaluatePromoCode(payload.promoCode, subTotal);

    if (promoError && payload.promoCode) {
      return NextResponse.json({ error: promoError }, { status: 400 });
    }

    const baseAfterPromo = Math.max(0, subTotal - discount);
    const prepaidDiscount = computePrepaidDiscount(payload.paymentMethod, baseAfterPromo);
    const discountTotal = discount + prepaidDiscount;

    const shippingFee = computeDeliveryFee(
      cartItems.map((item) => ({
        customizationType: item.product.customizationType,
        lensDetails: item.lensDetails,
      })),
    );
    const grandTotal = Math.max(0, subTotal - discountTotal + shippingFee);

    return NextResponse.json({
      summary: {
        subTotal,
        promoDiscount: discount,
        prepaidDiscount,
        discount: discountTotal,
        shippingFee,
        grandTotal,
        appliedPromoCode: promo?.code || null,
        paymentMethod: payload.paymentMethod,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Unable to preview order" },
      { status: 400 },
    );
  }
}
