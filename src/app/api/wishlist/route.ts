import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { wishlistSchema } from "@/lib/validators";
import {
  getOwnerWishlist,
  removeWishlistItemById,
  upsertWishlistItem,
} from "@/lib/cart";

export async function GET() {
  const items = await getOwnerWishlist();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const payload = wishlistSchema.parse(await request.json());
    await upsertWishlistItem({
      productId: payload.productId,
      selectedColor: payload.selectedColor,
      lensDetails: payload.lensDetails as Prisma.JsonValue,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.issues?.[0]?.message || "Unable to add to wishlist" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing wishlist item id" }, { status: 400 });
  }

  const success = await removeWishlistItemById(id);
  if (!success) {
    return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
