import { PromoDiscountType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getLensPriceMap() {
  const rows = await prisma.lensPrice.findMany({ where: { isActive: true } });
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.key] = Number(row.value);
    return acc;
  }, {});
}

export async function getLensUnitPrice(optionKey?: string | null) {
  if (!optionKey) return 0;
  const row = await prisma.lensPrice.findUnique({ where: { key: optionKey } });
  return row ? Number(row.value) : 0;
}

export async function computeUnitPrice(params: {
  productPrice: number;
  customizationType: "EYEGLASSES" | "SUNGLASSES" | "CONTACT_LENSES" | "ACCESSORIES";
  lensOptionKey?: string | null;
  lensDetails?: any;
}) {
  if (params.customizationType === "CONTACT_LENSES") {
    return Number(params.productPrice);
  }

  const lensPrice = await getLensUnitPrice(params.lensOptionKey);
  const mode = String(params.lensDetails?.mode || "");

  if (params.customizationType === "EYEGLASSES" && mode === "ONLY_FRAME") {
    return Number(params.productPrice);
  }

  if (params.customizationType === "SUNGLASSES") {
    const multiplierRows = await prisma.lensPrice.findMany({
      where: {
        key: {
          in: ["sunglasses_base_multiplier", "nonpower_multiplier_ss1", "nonpower_multiplier_ss2"],
        },
      },
      select: { key: true, value: true },
    });

    const multiplierMap = multiplierRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.key] = Number(row.value);
      return acc;
    }, {});

    const sunglassesBaseMultiplier = multiplierMap.sunglasses_base_multiplier || 1;
    const nonPower1 = multiplierMap.nonpower_multiplier_ss1 || 1;
    const nonPower2 = multiplierMap.nonpower_multiplier_ss2 || 1;

    if (mode === "ONLY_SUNGLASS") {
      return Number(params.productPrice) * nonPower1;
    }

    if (mode === "NON_RX") {
      return Number(params.productPrice) * nonPower2 + lensPrice;
    }

    return Number(params.productPrice) * sunglassesBaseMultiplier + lensPrice;
  }

  return Number(params.productPrice) + lensPrice;
}

export async function evaluatePromoCode(code: string | null | undefined, subTotal: number) {
  if (!code) {
    return { promo: null, discount: 0, error: null };
  }

  const promo = await prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!promo || !promo.isActive) {
    return { promo: null, discount: 0, error: "Invalid promo code" };
  }

  const now = new Date();

  if (promo.startsAt && promo.startsAt > now) {
    return { promo: null, discount: 0, error: "Promo code is not active yet" };
  }

  if (promo.endsAt && promo.endsAt < now) {
    return { promo: null, discount: 0, error: "Promo code expired" };
  }

  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
    return { promo: null, discount: 0, error: "Promo code usage limit reached" };
  }

  if (promo.minOrderAmount && subTotal < Number(promo.minOrderAmount)) {
    return {
      promo: null,
      discount: 0,
      error: `Minimum order amount is Rs.${Number(promo.minOrderAmount).toFixed(2)}`,
    };
  }

  let discount =
    promo.discountType === PromoDiscountType.FLAT
      ? Number(promo.discountValue)
      : (subTotal * Number(promo.discountValue)) / 100;

  if (promo.maxDiscountAmount) {
    discount = Math.min(discount, Number(promo.maxDiscountAmount));
  }

  discount = Math.max(0, Math.min(discount, subTotal));

  return { promo, discount, error: null };
}
