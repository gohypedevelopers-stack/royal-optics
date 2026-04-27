type AnyRecord = Record<string, any>;

export type LensDisplayRow = {
  label: string;
  value: string;
};

const MODE_LABELS: Record<string, string> = {
  ONLY_FRAME: "Only Frame",
  ONLY_SUNGLASS: "Only Sunglass",
  NON_RX: "Non Prescription",
  PRESCRIPTION: "Prescription",
  READER: "Reader",
  POWER_CONTACT_LENS: "Power Contact Lens",
};

const COLOR_HEX_MAP: Record<string, string> = {
  "#000": "Black",
  "#000000": "Black",
  "#fff": "White",
  "#ffffff": "White",
  "#f00": "Red",
  "#ff0000": "Red",
  "#008000": "Green",
  "#00ff00": "Green",
  "#00f": "Blue",
  "#0000ff": "Blue",
  "#8b4513": "Brown",
  "#a52a2a": "Brown",
};

function asRecord(value: unknown): AnyRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as AnyRecord;
}

function cleanText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const text = String(value).trim();
  if (!text || text === "-" || text.toLowerCase() === "null" || text.toLowerCase() === "undefined") return "";
  return text;
}

export function humanizeToken(value: unknown) {
  const text = cleanText(value);
  if (!text) return "";
  return text
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatLensMode(value: unknown) {
  const token = cleanText(value).toUpperCase();
  if (!token) return "";
  return MODE_LABELS[token] || humanizeToken(token);
}

export function formatPrescriptionType(value: unknown) {
  const token = cleanText(value).toLowerCase();
  if (!token) return "";
  if (token === "single_vision") return "Single Vision";
  if (token === "bifocal") return "Bifocal";
  if (token === "progressive") return "Progressive";
  if (token === "reader") return "Reader";
  return humanizeToken(token);
}

export function formatColorLabel(value: unknown) {
  const text = cleanText(value);
  if (!text) return "";
  const normalized = text.toLowerCase();
  if (normalized === "default") return "Default";
  if (normalized.startsWith("#")) {
    const colorName = COLOR_HEX_MAP[normalized] || "";
    return colorName ? `${colorName} (${text})` : text.toUpperCase();
  }
  return humanizeToken(text);
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function addRow(rows: LensDisplayRow[], seen: Set<string>, label: string, value: unknown) {
  const text = cleanText(value);
  if (!text) return;
  const key = `${label}:${text}`;
  if (seen.has(key)) return;
  rows.push({ label, value: text });
  seen.add(key);
}

export function extractOrderLensFields(lensDetails: unknown, selectedColor?: unknown) {
  const lens = asRecord(lensDetails);
  const prescription = asRecord(lens.prescription);
  const right = asRecord(prescription.right);
  const left = asRecord(prescription.left);
  const readerPower = asRecord(lens.readerPower);
  const nonRxStrength = asRecord(lens.nonRxStrength);

  const frameColor = firstText(lens.frameColor, lens.color, lens.selectedColor, selectedColor);
  const modeLabel = formatLensMode(lens.mode);
  const optionLabel = firstText(lens.lensOptionLabel, lens.mainLensType, lens.lensEnhancementOption);
  const optionKeyLabel = humanizeToken(lens.lensOptionKey);
  const packageLabel = firstText(optionLabel, optionKeyLabel, modeLabel);
  const prescriptionType = formatPrescriptionType(lens.prescriptionType);

  const readerRight = firstText(lens.readerRight, readerPower.right, nonRxStrength.right);
  const readerLeft = firstText(lens.readerLeft, readerPower.left, nonRxStrength.left);

  return {
    mainLensType: packageLabel || null,
    prescriptionType: prescriptionType || null,
    readerRight: readerRight || null,
    readerLeft: readerLeft || null,
    svRightSph: firstText(lens.svRightSph, right.sph) || null,
    svRightCyl: firstText(lens.svRightCyl, right.cyl) || null,
    svRightAxis: firstText(lens.svRightAxis, right.axis) || null,
    svLeftSph: firstText(lens.svLeftSph, left.sph) || null,
    svLeftCyl: firstText(lens.svLeftCyl, left.cyl) || null,
    svLeftAxis: firstText(lens.svLeftAxis, left.axis) || null,
    lensEnhancementOption: firstText(lens.lensEnhancementOption, packageLabel, optionKeyLabel) || null,
    color: frameColor || null,
  };
}

export function buildLensDisplayRows(params: {
  lensDetails?: unknown;
  selectedColor?: unknown;
  includeDefaultMode?: boolean;
}) {
  const rows: LensDisplayRow[] = [];
  const seen = new Set<string>();
  const lens = asRecord(params.lensDetails);
  const prescription = asRecord(lens.prescription);
  const right = asRecord(prescription.right);
  const left = asRecord(prescription.left);
  const readerPower = asRecord(lens.readerPower);
  const nonRxStrength = asRecord(lens.nonRxStrength);

  const frameColor = formatColorLabel(firstText(lens.frameColor, lens.color, lens.selectedColor, params.selectedColor));
  addRow(rows, seen, "Frame Color", frameColor);

  const modeLabel = formatLensMode(lens.mode);
  if (modeLabel || params.includeDefaultMode) {
    addRow(rows, seen, "Lens Mode", modeLabel || "Standard");
  }

  const optionLabel = firstText(lens.lensOptionLabel, lens.mainLensType, lens.lensEnhancementOption);
  const optionKeyLabel = humanizeToken(lens.lensOptionKey);
  const packageLabel = firstText(optionLabel, optionKeyLabel);
  addRow(rows, seen, "Lens Package", packageLabel);

  addRow(rows, seen, "Prescription Type", formatPrescriptionType(lens.prescriptionType));

  const tintColor = firstText(lens.tintColor, lens.tintColorHex);
  if (tintColor) {
    addRow(rows, seen, "Lens Tint", tintColor.startsWith("#") ? formatColorLabel(tintColor) : tintColor);
  }

  const tintDensity = cleanText(lens.tintDensity);
  if (tintDensity) {
    addRow(rows, seen, "Tint Density", tintDensity.endsWith("%") ? tintDensity : `${tintDensity}%`);
  }

  addRow(rows, seen, "Reader Right", firstText(lens.readerRight, readerPower.right, nonRxStrength.right));
  addRow(rows, seen, "Reader Left", firstText(lens.readerLeft, readerPower.left, nonRxStrength.left));

  addRow(rows, seen, "Contact Right Power", lens.rightPower);
  addRow(rows, seen, "Contact Left Power", lens.leftPower);
  addRow(rows, seen, "Right Boxes", lens.rightBoxes);
  addRow(rows, seen, "Left Boxes", lens.leftBoxes);

  addRow(rows, seen, "Right SPH", firstText(lens.svRightSph, right.sph));
  addRow(rows, seen, "Right CYL", firstText(lens.svRightCyl, right.cyl));
  addRow(rows, seen, "Right Axis", firstText(lens.svRightAxis, right.axis));
  addRow(rows, seen, "Right ADD", firstText(lens.svRightAdd, right.add));

  addRow(rows, seen, "Left SPH", firstText(lens.svLeftSph, left.sph));
  addRow(rows, seen, "Left CYL", firstText(lens.svLeftCyl, left.cyl));
  addRow(rows, seen, "Left Axis", firstText(lens.svLeftAxis, left.axis));
  addRow(rows, seen, "Left ADD", firstText(lens.svLeftAdd, left.add));

  return rows;
}
