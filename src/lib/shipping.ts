export const FRAME_OR_SUNGLASS_ONLY_DELIVERY_FEE = 199;

type ShippingEvaluationItem = {
  customizationType?: string | null;
  lensDetails?: unknown;
};

function normalize(value: string | null | undefined) {
  return String(value || "").trim().toUpperCase();
}

function readLensMode(lensDetails: unknown) {
  if (!lensDetails || typeof lensDetails !== "object" || Array.isArray(lensDetails)) {
    return "";
  }

  const mode = (lensDetails as Record<string, unknown>).mode;
  return typeof mode === "string" ? normalize(mode) : "";
}

function isFrameOrSunglassWithoutLensAddon(item: ShippingEvaluationItem) {
  const mode = readLensMode(item.lensDetails);
  const customizationType = normalize(item.customizationType);

  if (mode === "ONLY_FRAME") {
    return !customizationType || customizationType === "EYEGLASSES";
  }

  if (mode === "ONLY_SUNGLASS") {
    return !customizationType || customizationType === "SUNGLASSES";
  }

  return false;
}

export function computeDeliveryFee(items: ShippingEvaluationItem[]) {
  if (!items.length) return 0;
  return items.every(isFrameOrSunglassWithoutLensAddon) ? FRAME_OR_SUNGLASS_ONLY_DELIVERY_FEE : 0;
}

