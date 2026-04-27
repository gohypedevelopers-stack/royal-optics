export type LensOption = {
  key: string;
  label: string;
  description?: string;
  requiresTint?: boolean;
};

export type PrescriptionInput = {
  right: { sph?: string; cyl?: string; axis?: string; add?: string };
  left: { sph?: string; cyl?: string; axis?: string; add?: string };
};

function round2(value: number) {
  return Number(value.toFixed(2));
}

function formatSigned(value: number) {
  if (Math.abs(value) < 0.001) return "+0.00";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

export function generateSignedRange(start: number, end: number, step: number) {
  const result: string[] = [];

  if (start <= end) {
    for (let value = start; value <= end + 0.0001; value = round2(value + step)) {
      result.push(formatSigned(value));
    }
    return result;
  }

  for (let value = start; value >= end - 0.0001; value = round2(value - step)) {
    result.push(formatSigned(value));
  }

  return result;
}

export function generateWholeNumberRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, idx) => String(start + idx));
}

export const EYEWEAR_SPH_RANGE = generateSignedRange(-10, 6, 0.25);
export const EYEWEAR_CYL_RANGE = generateSignedRange(-4, 4, 0.25);
export const EYEWEAR_AXIS_RANGE = generateWholeNumberRange(0, 180);
export const EYEWEAR_ADD_RANGE = generateSignedRange(0, 3, 0.25);
export const READER_SS_RANGE = generateSignedRange(0.5, 4, 0.25);
export const NON_RX_SS_RANGE = ["+0.00"];

export const CONTACT_POWER_RANGES = {
  TYPE_1: generateSignedRange(-0.5, -9, 0.25),
  TYPE_2: generateSignedRange(-0.5, -10, 0.25),
  TYPE_3: generateSignedRange(-0.5, -12, 0.25),
  TYPE_4: generateSignedRange(-12.5, -20, 0.5),
  TYPE_5: generateSignedRange(0.5, 8, 0.25),
  TYPE_6: generateSignedRange(8.5, 15, 0.5),
  TYPE_7: generateSignedRange(0.5, 2, 0.25),
  TYPE_8: generateSignedRange(2.5, 5, 0.5),
  GENERAL_EYEWEAR: EYEWEAR_SPH_RANGE,
} as const;

export function resolveSphRange(rangeKey?: string | null) {
  if (!rangeKey) return EYEWEAR_SPH_RANGE;
  return CONTACT_POWER_RANGES[rangeKey as keyof typeof CONTACT_POWER_RANGES] ?? EYEWEAR_SPH_RANGE;
}

export const TINT_COLORS = ["Grey", "Green", "Brown", "Blue"];
export const TINT_DENSITIES = ["25", "50", "75", "90"];

export const EYEGLASS_NON_RX_OPTIONS: LensOption[] = [
  { key: "nonrx_clear_basic", label: "Basic Non-Anti-Reflect Lenses" },
  { key: "nonrx_clear_premium", label: "Anti-Reflect Lenses" },
  { key: "nonrx_blublock_basic", label: "Blu-Block Lenses" },
  { key: "drv_tinted_uv", label: "Tinted UV-Lenses", requiresTint: true },
  { key: "drv_polarized_basic", label: "Polarized Lenses" },
  { key: "drv_day_night_basic", label: "Night Drive Lenses in Yellow Tinted" },
];

export const EYEGLASS_PRESCRIPTION_OPTIONS: Record<string, LensOption[]> = {
  single_vision: [
    { key: "psv_clear_basic", label: "Basic Non-Anti-Reflect Lenses" },
    { key: "psv_clear_premium", label: "Anti-Reflect Lenses" },
    { key: "psv_blublock_basic", label: "Blu-Block Lenses" },
    { key: "psv_blublock_advance", label: "Blu-Block Mild Hi-Index 1.60" },
    { key: "psv_blublock_premium", label: "Blu-Block Medium Hi-Index 1.67" },
    { key: "psv_blublock_exclusive", label: "Blu-Block Hi-Index 1.74" },
    { key: "psv_poly_ar", label: "Anti-Reflect Polycarbonate Lenses" },
    { key: "psv_poly_blublock", label: "Blu-Block Anti-Reflect Polycarbonate Lenses" },
    { key: "drv_tinted_uv", label: "Tinted UV-Lenses", requiresTint: true },
    { key: "drv_polarized_basic", label: "Polarized Lenses Basic" },
    { key: "drv_polarized_premium", label: "Polarized Lenses Advance" },
    { key: "drv_day_night_basic", label: "Night Drive Lenses Yellow" },
  ],
  reader: [
    { key: "reader_clear_basic", label: "Basic Non-Anti-Reflect" },
    { key: "reader_clear_premium", label: "Anti-Reflect" },
    { key: "reader_blublock_basic", label: "Blu-Block" },
    { key: "reader_blublock_advance", label: "Blu-Block Mild Hi-Index 1.60" },
    { key: "reader_blublock_premium", label: "Blu-Block Medium Hi-Index 1.67" },
    { key: "reader_blublock_exclusive", label: "Blu-Block Hi-Index 1.74" },
  ],
  bifocal: [
    { key: "pbf_clear_basic", label: "Basic Non-Anti-Reflect" },
    { key: "pbf_clear_premium", label: "Anti-Reflect" },
    { key: "pbf_blublock_basic", label: "Blu-Block" },
    { key: "pbf_blublock_advance", label: "Blu-Block Mild Hi-Index 1.60" },
    { key: "drv_tinted_uv", label: "Tinted UV-Lenses", requiresTint: true },
  ],
  progressive: [
    { key: "ppg_clear_basic", label: "Basic Non-Anti-Reflect" },
    { key: "ppg_clear_premium", label: "Anti-Reflect" },
    { key: "ppg_blublock_basic", label: "Blu-Block" },
    { key: "ppg_blublock_advance", label: "Blu-Block Mild Hi-Index 1.60" },
    { key: "ppg_blublock_premium", label: "Blu-Block Medium Hi-Index 1.67" },
    { key: "ppg_blublock_exclusive", label: "Blu-Block Hi-Index 1.74" },
    { key: "ppg_poly_ar", label: "Anti-Reflect Polycarbonate" },
    { key: "ppg_poly_blublock", label: "Blu-Block Anti-Reflect Polycarbonate" },
    { key: "drv_tinted_uv", label: "Tinted UV-Lenses", requiresTint: true },
    { key: "drv_polarized_basic", label: "Polarized Basic" },
    { key: "drv_polarized_premium", label: "Polarized Advance" },
    { key: "drv_day_night_basic", label: "Night Drive Yellow" },
  ],
};

export const SUNGLASS_PRESCRIPTION_OPTIONS: Record<string, LensOption[]> = {
  single_vision: [
    { key: "drv_tinted_uv", label: "Tinted UV-Lenses", requiresTint: true },
    { key: "drv_polarized_basic", label: "Polarized Basic" },
    { key: "drv_polarized_premium", label: "Polarized Advance" },
  ],
  bifocal: [{ key: "drv_tinted_uv", label: "Tinted UV-Lenses", requiresTint: true }],
  progressive: [
    { key: "drv_tinted_uv", label: "Tinted UV-Lenses", requiresTint: true },
    { key: "drv_polarized_basic", label: "Polarized Basic" },
    { key: "drv_polarized_premium", label: "Polarized Advance" },
    { key: "drv_day_night_basic", label: "Night Drive Yellow" },
  ],
};

export const CONTACT_BOX_OPTIONS = ["0", "1", "2", "3", "4", "5", "6", "8", "10"];

export function calculateContactLensUnits(rightBoxes: number, leftBoxes: number) {
  return rightBoxes + leftBoxes;
}
