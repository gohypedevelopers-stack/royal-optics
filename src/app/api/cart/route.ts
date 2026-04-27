export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { cartAddSchema, cartQuantitySchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";
import { computeUnitPrice } from "@/lib/pricing";
import { computeDeliveryFee } from "@/lib/shipping";
import {
  getOwnerCart,
  removeCartItemById,
  updateCartItemQuantity,
  upsertCartItem,
} from "@/lib/cart";

export async function GET() {
  const items = await getOwnerCart();
  const subTotal = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
  const shipping = computeDeliveryFee(
    items.map((item) => ({
      customizationType: item.product.customizationType,
      lensDetails: item.lensDetails,
    })),
  );

  return NextResponse.json({
    items,
    summary: {
      subTotal,
      shipping,
      grandTotal: subTotal + shipping,
    },
  });
}

export async function POST(request: Request) {
  try {
    const payload = cartAddSchema.parse(await request.json());

    const product = await prisma.product.findUnique({ where: { id: payload.productId } });
    if (!product || product.status !== "ACTIVE") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const lensDetails = (payload.lensDetails || {}) as Prisma.JsonValue;
    const lensOptionKey = (lensDetails as any)?.lensOptionKey as string | undefined;

    let quantity = payload.quantity;
    if (product.customizationType === "CONTACT_LENSES") {
      const rightBoxes = Number((lensDetails as any)?.rightBoxes || 0);
      const leftBoxes = Number((lensDetails as any)?.leftBoxes || 0);
      const units = rightBoxes + leftBoxes;
      if (units > 0) quantity = units;
    }

    await upsertCartItem({
      productId: product.id,
      quantity,
      selectedColor: payload.selectedColor,
      lensDetails,
      unitPrice: await computeUnitPrice({
        productPrice: Number(product.price),
        customizationType: product.customizationType,
        lensOptionKey,
        lensDetails,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Unable to add item" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = cartQuantitySchema.parse(await request.json());
    const success = await updateCartItemQuantity(payload.cartItemId, payload.quantity);

    if (!success) {
      return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Unable to update quantity" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing cart item id" }, { status: 400 });
  }

  const success = await removeCartItemById(id);
  if (!success) {
    return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

