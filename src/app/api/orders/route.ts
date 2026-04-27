export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { PaymentMethod, PaymentProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validators";
import { evaluatePromoCode } from "@/lib/pricing";
import { computeDeliveryFee } from "@/lib/shipping";
import { extractOrderLensFields } from "@/lib/lens-display";

function generateOrderNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `RO-${stamp}-${suffix}`;
}

export async function GET() {
  try {
    const session = await requireUserSession();

    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      include: {
        items: true,
        address: true,
        payment: true,
        promoCode: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireUserSession();
    const payload = checkoutSchema.parse(await request.json());

    const ownerKey = `user:${session.userId}`;

    const cartItems = await prisma.cartItem.findMany({
      where: { ownerKey },
      include: {
        product: {
          include: {
            images: {
              orderBy: { sortOrder: "asc" },
              take: 1,
            },
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

    let addressId = payload.addressId || null;

    if (!addressId && payload.newAddress) {
      const createdAddress = await prisma.address.create({
        data: {
          userId: session.userId,
          ...payload.newAddress,
        },
      });
      addressId = createdAddress.id;
    }

    if (!addressId) {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });
    }

    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: session.userId },
    });

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const shippingFee = computeDeliveryFee(
      cartItems.map((item) => ({
        customizationType: item.product.customizationType,
        lensDetails: item.lensDetails,
      })),
    );
    const grandTotal = Math.max(0, subTotal - discount + shippingFee);

    const paymentMethod = payload.paymentMethod as PaymentMethod;
    const initialStatus = paymentMethod === PaymentMethod.RAZORPAY ? "PENDING_PAYMENT" : "PENDING";

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: session.userId,
          addressId: address.id,
          promoCodeId: promo?.id,
          status: initialStatus,
          paymentStatus: "PENDING",
          paymentMethod,
          subTotal,
          discountTotal: discount,
          shippingFee,
          grandTotal,
          shippingSnapshot: {
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            landmark: address.landmark,
          },
          notes: payload.notes,
          items: {
            create: cartItems.map((item) => {
              const lensDetails = (item.lensDetails || {}) as Record<string, any>;
              const lensFields = extractOrderLensFields(lensDetails, item.selectedColor);
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: item.unitPrice,
                lineTotal: item.lineTotal,
                selectedColor: item.selectedColor,
                lensDetails: item.lensDetails,
                productName: item.product.name,
                productImage: item.product.images[0]?.url || null,
                mainLensType: lensFields.mainLensType,
                prescriptionType: lensFields.prescriptionType,
                readerRight: lensFields.readerRight,
                readerLeft: lensFields.readerLeft,
                svRightSph: lensFields.svRightSph,
                svRightCyl: lensFields.svRightCyl,
                svRightAxis: lensFields.svRightAxis,
                svLeftSph: lensFields.svLeftSph,
                svLeftCyl: lensFields.svLeftCyl,
                svLeftAxis: lensFields.svLeftAxis,
                lensEnhancementOption: lensFields.lensEnhancementOption,
                prescriptionDetail: {
                  create: {
                    mainLensType: lensFields.mainLensType,
                    prescriptionType: lensFields.prescriptionType,
                    color: lensFields.color,
                    readerRight: lensFields.readerRight,
                    readerLeft: lensFields.readerLeft,
                    svRightSph: lensFields.svRightSph,
                    svRightCyl: lensFields.svRightCyl,
                    svRightAxis: lensFields.svRightAxis,
                    svLeftSph: lensFields.svLeftSph,
                    svLeftCyl: lensFields.svLeftCyl,
                    svLeftAxis: lensFields.svLeftAxis,
                    lensEnhancementOption: lensFields.lensEnhancementOption,
                  },
                },
              };
            }),
          },
          payment: {
            create: {
              provider: paymentMethod === PaymentMethod.RAZORPAY ? PaymentProvider.RAZORPAY : PaymentProvider.MANUAL,
              amount: grandTotal,
              status: "PENDING",
            },
          },
        },
        include: { payment: true, items: true },
      });

      await tx.cartItem.deleteMany({ where: { ownerKey } });

      if (promo?.id) {
        await tx.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return createdOrder;
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Failed to place order" },
      { status: 400 },
    );
  }
}

