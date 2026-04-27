import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashLensDetails } from "@/lib/crypto";
import { getOwnerContext } from "@/lib/guest";

export type CartMutationInput = {
  productId: string;
  quantity: number;
  selectedColor?: string;
  lensDetails?: Prisma.JsonValue;
  unitPrice: number;
};

export async function upsertCartItem(input: CartMutationInput) {
  const owner = await getOwnerContext();
  const selectedColor = input.selectedColor || "default";
  const lensHash = hashLensDetails(input.lensDetails);

  const where = {
    ownerKey_productId_selectedColor_lensHash: {
      ownerKey: owner.ownerKey,
      productId: input.productId,
      selectedColor,
      lensHash,
    },
  } as const;

  const existing = await prisma.cartItem.findUnique({ where });

  if (existing) {
    const quantity = existing.quantity + input.quantity;
    const lineTotal = quantity * Number(existing.unitPrice);

    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity, lineTotal },
    });
  }

  const lineTotal = input.unitPrice * input.quantity;

  return prisma.cartItem.create({
    data: {
      ownerKey: owner.ownerKey,
      userId: owner.userId,
      guestToken: owner.guestToken,
      productId: input.productId,
      selectedColor,
      lensDetails: input.lensDetails,
      lensHash,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      lineTotal,
    },
  });
}

export async function getOwnerCart() {
  const owner = await getOwnerContext();
  return prisma.cartItem.findMany({
    where: { ownerKey: owner.ownerKey },
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
    orderBy: { createdAt: "desc" },
  });
}

export async function getOwnerWishlist() {
  const owner = await getOwnerContext();
  return prisma.wishlistItem.findMany({
    where: { ownerKey: owner.ownerKey },
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
    orderBy: { createdAt: "desc" },
  });
}

export async function upsertWishlistItem(input: {
  productId: string;
  selectedColor?: string;
  lensDetails?: Prisma.JsonValue;
}) {
  const owner = await getOwnerContext();
  const selectedColor = input.selectedColor || "default";
  const lensHash = hashLensDetails(input.lensDetails);

  return prisma.wishlistItem.upsert({
    where: {
      ownerKey_productId_selectedColor_lensHash: {
        ownerKey: owner.ownerKey,
        productId: input.productId,
        selectedColor,
        lensHash,
      },
    },
    create: {
      ownerKey: owner.ownerKey,
      userId: owner.userId,
      guestToken: owner.guestToken,
      productId: input.productId,
      selectedColor,
      lensDetails: input.lensDetails,
      lensHash,
    },
    update: {
      selectedColor,
      lensDetails: input.lensDetails,
    },
  });
}

export async function removeCartItemById(id: string) {
  const owner = await getOwnerContext();
  const item = await prisma.cartItem.findUnique({ where: { id } });
  if (!item || item.ownerKey !== owner.ownerKey) return false;

  await prisma.cartItem.delete({ where: { id } });
  return true;
}

export async function removeWishlistItemById(id: string) {
  const owner = await getOwnerContext();
  const item = await prisma.wishlistItem.findUnique({ where: { id } });
  if (!item || item.ownerKey !== owner.ownerKey) return false;

  await prisma.wishlistItem.delete({ where: { id } });
  return true;
}

export async function updateCartItemQuantity(id: string, quantity: number) {
  const owner = await getOwnerContext();
  const item = await prisma.cartItem.findUnique({ where: { id } });
  if (!item || item.ownerKey !== owner.ownerKey) return false;

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id } });
    return true;
  }

  await prisma.cartItem.update({
    where: { id },
    data: {
      quantity,
      lineTotal: Number(item.unitPrice) * quantity,
    },
  });

  return true;
}

export async function mergeGuestStateToUser(userId: string, guestToken: string | null) {
  if (!guestToken) return;

  const guestOwnerKey = `guest:${guestToken}`;
  const userOwnerKey = `user:${userId}`;

  const guestCartItems = await prisma.cartItem.findMany({ where: { ownerKey: guestOwnerKey } });
  for (const item of guestCartItems) {
    const existing = await prisma.cartItem.findUnique({
      where: {
        ownerKey_productId_selectedColor_lensHash: {
          ownerKey: userOwnerKey,
          productId: item.productId,
          selectedColor: item.selectedColor,
          lensHash: item.lensHash,
        },
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + item.quantity,
          lineTotal: Number(existing.unitPrice) * (existing.quantity + item.quantity),
        },
      });
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: {
          ownerKey: userOwnerKey,
          userId,
          guestToken: null,
        },
      });
    }
  }

  const guestWishlistItems = await prisma.wishlistItem.findMany({ where: { ownerKey: guestOwnerKey } });
  for (const item of guestWishlistItems) {
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        ownerKey_productId_selectedColor_lensHash: {
          ownerKey: userOwnerKey,
          productId: item.productId,
          selectedColor: item.selectedColor,
          lensHash: item.lensHash,
        },
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: item.id } });
    } else {
      await prisma.wishlistItem.update({
        where: { id: item.id },
        data: {
          ownerKey: userOwnerKey,
          userId,
          guestToken: null,
        },
      });
    }
  }
}
