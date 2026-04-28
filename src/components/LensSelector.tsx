"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, PhoneCall, X } from "lucide-react";
import { toast } from "sonner";
import {
  EYEGLASS_NON_RX_OPTIONS,
  EYEGLASS_PRESCRIPTION_OPTIONS,
  EYEWEAR_ADD_RANGE,
  EYEWEAR_AXIS_RANGE,
  EYEWEAR_CYL_RANGE,
  EYEWEAR_SPH_RANGE,
  NON_RX_SS_RANGE,
  READER_SS_RANGE,
  SUNGLASS_PRESCRIPTION_OPTIONS,
  TINT_DENSITIES,
  type LensOption,
  resolveSphRange,
} from "@/lib/lens";
import { formatINR } from "@/lib/format";

type ProductType = "EYEGLASSES" | "SUNGLASSES" | "CONTACT_LENSES" | "ACCESSORIES";

type LensSelectorProps = {
  open: boolean;
  onClose: () => void;
  initialSelectedColor?: string;
  product: {
    id: string;
    name: string;
    price: number;
    customizationType: ProductType;
    powerRange: string | null;
    colors: string[];
  };
  lensPrices: Record<string, number>;
  supportPhone?: string;
};

type EyePrescription = {
  right: { sph: string; cyl: string; axis: string; add: string };
  left: { sph: string; cyl: string; axis: string; add: string };
};

const defaultPrescription: EyePrescription = {
  right: { sph: "", cyl: "", axis: "", add: "" },
  left: { sph: "", cyl: "", axis: "", add: "" },
};

const sunglassesDefaultPrescription: EyePrescription = {
  right: { sph: "0.00", cyl: "0.00", axis: "0", add: "" },
  left: { sph: "0.00", cyl: "0.00", axis: "0", add: "" },
};

const eyewearDefaultPrescription: EyePrescription = {
  right: { sph: "0.00", cyl: "0.00", axis: "0", add: "0.00" },
  left: { sph: "0.00", cyl: "0.00", axis: "0", add: "0.00" },
};

const lensTintSwatches = [
  { name: "Light Grey", hex: "#d4d4d4" },
  { name: "Grey", hex: "#b6b6b6" },
  { name: "Dark Grey", hex: "#8f8f8f" },
  { name: "Smoky Grey", hex: "#5f5f5f" },
  { name: "Mint Green", hex: "#9cb68e" },
  { name: "Pastel Green", hex: "#86b58e" },
  { name: "Olive Green", hex: "#699d6a" },
  { name: "Forest Green", hex: "#3e7d45" },
  { name: "Light Brown", hex: "#dacdc0" },
  { name: "Brown", hex: "#c8b08d" },
  { name: "Dark Brown", hex: "#834025" },
  { name: "Coffee Brown", hex: "#724012" },
];

type SunglassStep = "option" | "prescriptionType" | "prescriptionForm" | "lensType";
type SunglassLensSelection = "tint" | "daynight" | null;
type EyewearStep = "option" | "prescriptionType" | "prescriptionForm" | "strengthForm" | "lensType";

function groupLensOptions(options: LensOption[]) {
  const groups: Array<{ id: string; title: string; items: LensOption[] }> = [];
  const grouped = new Map<string, { id: string; title: string; items: LensOption[] }>();

  function ensureGroup(id: string, title: string) {
    if (!grouped.has(id)) grouped.set(id, { id, title, items: [] });
    return grouped.get(id)!;
  }

  for (const option of options) {
    const key = option.key.toLowerCase();
    if (key.includes("clear")) {
      ensureGroup("clear", "Clear & Anti Reflection Lenses").items.push(option);
    } else if (key.includes("blublock")) {
      ensureGroup("blublock", "Blu Block Lenses").items.push(option);
    } else if (key.includes("poly")) {
      ensureGroup("poly", "Poly Carbonate Lenses").items.push(option);
    } else if (key.includes("tinted") || key.includes("drv_tinted_uv")) {
      ensureGroup("tinted", "Driving Lenses (Tinted UV)").items.push(option);
    } else if (key.includes("polarized")) {
      ensureGroup("polarized", "Polarized Lenses").items.push(option);
    } else if (key.includes("day_night")) {
      ensureGroup("daynight", "Night Drive Lenses").items.push(option);
    } else {
      ensureGroup("other", "Lens Options").items.push(option);
    }
  }

  for (const id of ["clear", "blublock", "poly", "tinted", "polarized", "daynight", "other"]) {
    const row = grouped.get(id);
    if (row && row.items.length) groups.push(row);
  }

  return groups;
}

function priceForMode(mode: string, lensOptionKey: string, productPrice: number, lensPrices: Record<string, number>) {
  const lensPrice = lensOptionKey ? lensPrices[lensOptionKey] || 0 : 0;
  const sunBaseMultiplier = lensPrices.sunglasses_base_multiplier || 1;
  const nonPower1 = lensPrices.nonpower_multiplier_ss1 || 1;
  const nonPower2 = lensPrices.nonpower_multiplier_ss2 || 1;

  if (mode === "ONLY_FRAME") return productPrice;
  if (mode === "ONLY_SUNGLASS") return productPrice * nonPower1;
  if (mode === "NON_RX") return productPrice * nonPower2 + lensPrice;
  if (mode === "PRESCRIPTION") return productPrice * sunBaseMultiplier + lensPrice;

  return productPrice + lensPrice;
}

function sunglassesQuickLabel(label: string, idx: number) {
  const lower = label.toLowerCase();
  if (lower.includes("basic")) return "Basic";
  if (lower.includes("advance") || lower.includes("premium") || lower.includes("turbo")) return "Turbo";
  if (lower.includes("night drive")) return idx === 0 ? "Basic" : "Turbo";
  return label;
}

function modeLabel(mode: string) {
  if (mode === "ONLY_FRAME") return "Only Frame";
  if (mode === "ONLY_SUNGLASS") return "Only Sunglass";
  if (mode === "NON_RX") return "Non Prescription";
  if (mode === "PRESCRIPTION") return "Prescription";
  if (mode === "READER") return "Reader";
  if (mode === "POWER_CONTACT_LENS") return "Power Contact Lens";
  return mode;
}

export default function LensSelector({
  open,
  onClose,
  initialSelectedColor,
  product,
  lensPrices,
  supportPhone,
}: LensSelectorProps) {
  const router = useRouter();
  const isContact = product.customizationType === "CONTACT_LENSES";
  const isEyeglasses = product.customizationType === "EYEGLASSES";
  const isSunglasses = product.customizationType === "SUNGLASSES";

  const [mode, setMode] = useState("");
  const [sunglassStep, setSunglassStep] = useState<SunglassStep>("option");
  const [sunglassProceeded, setSunglassProceeded] = useState(false);
  const [sunglassLensSelection, setSunglassLensSelection] = useState<SunglassLensSelection>(null);
  const [eyewearStep, setEyewearStep] = useState<EyewearStep>("option");
  const [eyewearProceeded, setEyewearProceeded] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "default");
  const [prescriptionType, setPrescriptionType] = useState("single_vision");
  const [lensOptionKey, setLensOptionKey] = useState("");
  const [tintColor, setTintColor] = useState(lensTintSwatches[0].hex);
  const [tintDensity, setTintDensity] = useState("50");
  const [prescription, setPrescription] = useState<EyePrescription>(defaultPrescription);
  const [readerRight, setReaderRight] = useState("");
  const [readerLeft, setReaderLeft] = useState("");
  const [rightPower, setRightPower] = useState("");
  const [leftPower, setLeftPower] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showAddedModal, setShowAddedModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const shouldLockScroll = open || showAddedModal;
    const previousOverflow = document.body.style.overflow;
    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, showAddedModal, isMounted]);

  useEffect(() => {
    if (!open) return;

    setSelectedColor(initialSelectedColor || product.colors[0] || "default");
    setSubmitting(false);
    setLensOptionKey("");
    setTintColor(lensTintSwatches[0].hex);
    setTintDensity("50");
    setSunglassLensSelection(null);
    setReaderRight("");
    setReaderLeft("");
    setRightPower("");
    setLeftPower("");
    setQuantity(1);

    if (isContact) {
      setMode("POWER_CONTACT_LENS");
      return;
    }

    setMode("");
    if (isSunglasses) {
      setSunglassStep("option");
      setSunglassProceeded(false);
      setPrescriptionType("");
      setPrescription(sunglassesDefaultPrescription);
    } else if (isEyeglasses) {
      setEyewearStep("option");
      setEyewearProceeded(false);
      setPrescriptionType("");
      setPrescription(eyewearDefaultPrescription);
    } else {
      setPrescriptionType("");
      setPrescription(defaultPrescription);
    }
  }, [open, initialSelectedColor, isContact, isSunglasses, isEyeglasses, product.colors]);

  const eyewearOptions = useMemo(() => {
    if (!isEyeglasses) return [];
    if (mode === "READER") return EYEGLASS_PRESCRIPTION_OPTIONS.reader;
    if (mode === "NON_RX") return EYEGLASS_NON_RX_OPTIONS;
    if (mode === "PRESCRIPTION") return EYEGLASS_PRESCRIPTION_OPTIONS[prescriptionType] || [];
    return [];
  }, [isEyeglasses, mode, prescriptionType]);

  const sunglassOptions = useMemo(() => {
    if (!isSunglasses || mode !== "PRESCRIPTION") return [];
    return SUNGLASS_PRESCRIPTION_OPTIONS[prescriptionType] || [];
  }, [isSunglasses, mode, prescriptionType]);

  const sunglassTintOption = useMemo(
    () => sunglassOptions.find((option) => option.requiresTint) || null,
    [sunglassOptions],
  );

  const sunglassDayNightOptions = useMemo(
    () => sunglassOptions.filter((option) => !option.requiresTint),
    [sunglassOptions],
  );

  useEffect(() => {
    if (!isSunglasses || sunglassStep !== "lensType" || mode !== "PRESCRIPTION" || lensOptionKey) return;
    const initial =
      sunglassDayNightOptions[0]?.key || sunglassTintOption?.key || sunglassOptions[0]?.key || "";
    if (initial) {
      setLensOptionKey(initial);
      setSunglassLensSelection(
        sunglassDayNightOptions.some((item) => item.key === initial) ? "daynight" : "tint",
      );
    }
  }, [isSunglasses, sunglassStep, mode, lensOptionKey, sunglassDayNightOptions, sunglassTintOption, sunglassOptions]);

  const selectedOption = useMemo(() => {
    if (isSunglasses) return sunglassOptions.find((option) => option.key === lensOptionKey);
    return eyewearOptions.find((option) => option.key === lensOptionKey);
  }, [isSunglasses, sunglassOptions, eyewearOptions, lensOptionKey]);

  const computedQuantity = useMemo(() => {
    if (isContact) return 2;
    return quantity;
  }, [isContact, quantity]);

  const unitPrice = useMemo(() => {
    if (isContact) return Number(product.price);
    return priceForMode(mode, lensOptionKey, Number(product.price), lensPrices);
  }, [isContact, lensOptionKey, lensPrices, mode, product.price]);

  const total = unitPrice * computedQuantity;

  const sphOptions = useMemo(
    () => Array.from(new Set(["0.00", ...resolveSphRange(product.powerRange)])),
    [product.powerRange],
  );
  const cylOptions = useMemo(() => Array.from(new Set(["0.00", ...EYEWEAR_CYL_RANGE])), []);
  const axisOptions = useMemo(() => Array.from(new Set(["0", ...EYEWEAR_AXIS_RANGE])), []);

  function hasFullPrescription(fields: EyePrescription, withAdd: boolean) {
    const baseFilled =
      fields.right.sph &&
      fields.right.cyl &&
      fields.right.axis &&
      fields.left.sph &&
      fields.left.cyl &&
      fields.left.axis;
    if (!baseFilled) return false;
    if (!withAdd) return true;
    return !!(fields.right.add && fields.left.add);
  }

  function validateBeforeAdd(activeMode: string) {
    if (isContact) {
      if (!rightPower || !leftPower) {
        toast.error("Select power for both right and left eyes");
        return false;
      }
      return true;
    }

    if (isSunglasses) {
      if (!activeMode) {
        toast.error("Select a lens option");
        return false;
      }
      if (activeMode === "ONLY_SUNGLASS") return true;
      if (activeMode === "PRESCRIPTION") {
        if (!prescriptionType) {
          toast.error("Select a prescription type");
          return false;
        }
        if (!hasFullPrescription(prescription, false)) {
          toast.error("Complete all prescription details");
          return false;
        }
        if (!lensOptionKey) {
          toast.error("Select a lens type");
          return false;
        }
      }
      return true;
    }

    if (isEyeglasses) {
      if (!activeMode) {
        toast.error("Select a lens option");
        return false;
      }
      if (activeMode === "ONLY_FRAME") return true;
      if (activeMode === "READER") {
        if (!readerRight || !readerLeft) {
          toast.error("Select reader strength");
          return false;
        }
        if (!lensOptionKey) {
          toast.error("Select a lens type");
          return false;
        }
        return true;
      }
      if (activeMode === "NON_RX") {
        if (!readerRight || !readerLeft) {
          toast.error("Select strength");
          return false;
        }
        if (!lensOptionKey) {
          toast.error("Select a lens package");
          return false;
        }
        return true;
      }
      if (activeMode === "PRESCRIPTION") {
        if (!lensOptionKey) {
          toast.error("Select a lens package");
          return false;
        }
        const needsAdd = prescriptionType === "bifocal" || prescriptionType === "progressive";
        if (!hasFullPrescription(prescription, needsAdd)) {
          toast.error("Complete all prescription details");
          return false;
        }
        return true;
      }
    }

    return true;
  }

  async function addToCart(forcedMode?: string) {
    const activeMode = forcedMode || mode;
    if (!validateBeforeAdd(activeMode)) return;

    const selectedOptionLabel = selectedOption?.label || "";
    const lensDetails: Record<string, any> = {
      mode: isContact ? "POWER_CONTACT_LENS" : activeMode || null,
      lensOptionKey: lensOptionKey || null,
      lensOptionLabel: selectedOptionLabel || null,
      prescriptionType: activeMode === "PRESCRIPTION" ? prescriptionType : activeMode === "READER" ? "reader" : null,
      selectedColor,
      frameColor: selectedColor,
      color: selectedColor,
      mainLensType: selectedOptionLabel || modeLabel(activeMode),
      lensEnhancementOption: selectedOptionLabel || null,
      quantity: computedQuantity,
    };

    if (selectedOption?.requiresTint) {
      const selectedTint = lensTintSwatches.find((swatch) => swatch.hex === tintColor);
      lensDetails.tintColor = selectedTint?.name || tintColor;
      lensDetails.tintColorHex = tintColor;
      lensDetails.tintDensity = tintDensity;
    }

    if (isContact) {
      lensDetails.rightPower = rightPower;
      lensDetails.leftPower = leftPower;
      lensDetails.rightBoxes = 1;
      lensDetails.leftBoxes = 1;
    }

    if (activeMode === "PRESCRIPTION") {
      lensDetails.prescription = prescription;
      lensDetails.svRightSph = prescription.right.sph || null;
      lensDetails.svRightCyl = prescription.right.cyl || null;
      lensDetails.svRightAxis = prescription.right.axis || null;
      lensDetails.svRightAdd = prescription.right.add || null;
      lensDetails.svLeftSph = prescription.left.sph || null;
      lensDetails.svLeftCyl = prescription.left.cyl || null;
      lensDetails.svLeftAxis = prescription.left.axis || null;
      lensDetails.svLeftAdd = prescription.left.add || null;
    }

    if (activeMode === "READER") {
      lensDetails.readerPower = { right: readerRight, left: readerLeft };
      lensDetails.readerRight = readerRight || null;
      lensDetails.readerLeft = readerLeft || null;
    }

    if (activeMode === "NON_RX") {
      lensDetails.nonRxStrength = { right: readerRight, left: readerLeft };
      lensDetails.readerRight = readerRight || null;
      lensDetails.readerLeft = readerLeft || null;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: computedQuantity,
          selectedColor,
          lensDetails,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to add to cart");
      }

      if (isContact) {
        onClose();
        setShowAddedModal(true);
      } else {
        toast.success("Added to cart");
        onClose();
        router.push("/cart");
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Unable to add to cart");
    } finally {
      setSubmitting(false);
    }
  }

  function continueShopping() {
    setShowAddedModal(false);
  }

  function goToCart() {
    setShowAddedModal(false);
    router.push("/cart");
  }

  function supportLine() {
    const displayPhone = supportPhone || "+91 9911522006";
    const phoneHref = displayPhone.replace(/\s/g, "");

    return (
      <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <PhoneCall className="mr-1 inline-block h-4 w-4" />
        Not sure what to select? Call{" "}
        <a href={`tel:${phoneHref}`} className="font-semibold text-blue-600">
          {displayPhone}
        </a>
      </p>
    );
  }

  function renderContactDrawer() {
    return (
      <aside className="absolute right-0 top-0 z-[55] h-full w-full max-w-[340px] overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold uppercase text-slate-900">Lens Options</h3>
            <p className="mt-1 text-lg font-semibold text-slate-800">Spherical Lenses</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1.5 text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-600">Right Eye Boxes</label>
              <input value="1" readOnly className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600">Left Eye Boxes</label>
              <input value="1" readOnly className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-600">Right Eye Power</label>
              <select
                value={rightPower}
                onChange={(event) => setRightPower(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Fixed Power</option>
                {resolveSphRange(product.powerRange).map((value) => (
                  <option value={value} key={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600">Left Eye Power</label>
              <select
                value={leftPower}
                onChange={(event) => setLeftPower(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="">Fixed Power</option>
                {resolveSphRange(product.powerRange).map((value) => (
                  <option value={value} key={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-md border border-slate-300 bg-slate-50 p-3 text-sm">
            <p className="flex justify-between">
              <span>Per Box Price:</span>
              <strong>{formatINR(unitPrice)}</strong>
            </p>
            <p className="mt-1 flex justify-between">
              <span>Boxes Total:</span>
              <strong>{formatINR(total)}</strong>
            </p>
            <p className="mt-2 border-t border-slate-300 pt-2">
              <span className="font-semibold">Total Price:</span>
              <span className="float-right font-bold">{formatINR(total)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => addToCart()}
            disabled={submitting}
            className="w-full rounded-md bg-green-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add to Cart"}
          </button>

          {supportLine()}
        </div>
      </aside>
    );
  }

  function renderSunglassesDrawer() {
    return (
      <aside className="absolute right-0 top-0 z-[55] h-full w-full max-w-[340px] overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-base font-bold text-slate-900">STEP 1 - Select Lens Option</h3>
          <button type="button" onClick={onClose} className="rounded p-1.5 text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {sunglassStep === "option" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setMode("PRESCRIPTION");
                setSunglassStep("option");
                setSunglassProceeded(false);
                setLensOptionKey("");
                setPrescriptionType("");
              }}
              className={`w-full rounded-md border px-3 py-2.5 text-sm font-semibold ${
                mode === "PRESCRIPTION"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              Prescription
            </button>

            <button
              type="button"
              onClick={() => addToCart("ONLY_SUNGLASS")}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800"
            >
              {submitting ? "Adding..." : "Only Sunglass"}
            </button>

            {mode === "PRESCRIPTION" && (
              <div className="space-y-3 rounded-md border border-slate-200 bg-white p-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode("");
                    setPrescriptionType("");
                  }}
                  className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  &lt;- Back
                </button>
                <h4 className="text-base font-semibold text-slate-800">Select Prescription Type</h4>
                {[
                  { key: "single_vision", label: "Single Vision Lenses" },
                  { key: "bifocal", label: "Bifocal Lenses" },
                  { key: "progressive", label: "Progressive Lenses" },
                ].map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => {
                      setPrescriptionType(type.key);
                      setSunglassStep("prescriptionForm");
                      setSunglassProceeded(false);
                    }}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800"
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
            {supportLine()}
          </div>
        )}

        {sunglassStep === "prescriptionForm" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setSunglassStep("option");
              }}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              &lt;- Back
            </button>

            <h4 className="text-base font-semibold text-slate-800">Enter Prescription Details</h4>

            <div className="rounded-md border border-slate-200 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-800">Right Eye</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">SPH</label>
                  <select
                    className="w-full rounded-md border px-2 py-2 text-sm"
                    value={prescription.right.sph}
                    onChange={(event) =>
                      setPrescription((prev) => ({ ...prev, right: { ...prev.right, sph: event.target.value } }))
                    }
                  >
                    {sphOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">CYL</label>
                  <select
                    className="w-full rounded-md border px-2 py-2 text-sm"
                    value={prescription.right.cyl}
                    onChange={(event) =>
                      setPrescription((prev) => ({ ...prev, right: { ...prev.right, cyl: event.target.value } }))
                    }
                  >
                    {cylOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Axis</label>
                  <select
                    className="w-full rounded-md border px-2 py-2 text-sm"
                    value={prescription.right.axis}
                    onChange={(event) =>
                      setPrescription((prev) => ({ ...prev, right: { ...prev.right, axis: event.target.value } }))
                    }
                  >
                    {axisOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-800">Left Eye</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">SPH</label>
                  <select
                    className="w-full rounded-md border px-2 py-2 text-sm"
                    value={prescription.left.sph}
                    onChange={(event) =>
                      setPrescription((prev) => ({ ...prev, left: { ...prev.left, sph: event.target.value } }))
                    }
                  >
                    {sphOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">CYL</label>
                  <select
                    className="w-full rounded-md border px-2 py-2 text-sm"
                    value={prescription.left.cyl}
                    onChange={(event) =>
                      setPrescription((prev) => ({ ...prev, left: { ...prev.left, cyl: event.target.value } }))
                    }
                  >
                    {cylOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Axis</label>
                  <select
                    className="w-full rounded-md border px-2 py-2 text-sm"
                    value={prescription.left.axis}
                    onChange={(event) =>
                      setPrescription((prev) => ({ ...prev, left: { ...prev.left, axis: event.target.value } }))
                    }
                  >
                    {axisOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!hasFullPrescription(prescription, false)) {
                  toast.error("Complete all prescription details");
                  return;
                }
                setSunglassProceeded(true);
                setSunglassStep("lensType");
              }}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-blue-700"
            >
              Proceed
            </button>
            {supportLine()}
          </div>
        )}

        {sunglassStep === "lensType" && sunglassProceeded && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setSunglassStep("prescriptionForm");
                setSunglassProceeded(false);
              }}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              &lt;- Back
            </button>

            <h4 className="text-base font-semibold text-slate-800">Select Lens Type</h4>

            {sunglassTintOption && (
              <div className="rounded-md border border-slate-200 p-3">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-slate-800">{sunglassTintOption.label}</p>
                  <span className="font-semibold text-slate-800">
                    {formatINR(lensPrices[sunglassTintOption.key] || 0)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {sunglassTintOption.description || "Protects approx. 50% from UV rays."}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {lensTintSwatches.map((swatch) => (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => {
                        setTintColor(swatch.hex);
                        setLensOptionKey(sunglassTintOption.key);
                        setSunglassLensSelection("tint");
                      }}
                      className={`h-6 w-6 rounded-full border ${
                        sunglassLensSelection === "tint" && tintColor === swatch.hex
                          ? "border-slate-900 ring-2 ring-slate-300"
                          : "border-slate-300"
                      }`}
                      aria-label={`Tint ${swatch.name}`}
                      title={swatch.name}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {!!sunglassDayNightOptions.length && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Day & Night</p>
                {sunglassDayNightOptions.map((option, index) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setLensOptionKey(option.key);
                      setSunglassLensSelection("daynight");
                    }}
                    className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`h-4 w-4 rounded-full border ${
                          sunglassLensSelection === "daynight" && lensOptionKey === option.key
                            ? "border-slate-700 bg-slate-700"
                            : "border-slate-400 bg-white"
                        }`}
                      />
                      {sunglassesQuickLabel(option.label, index)}
                    </span>
                    <strong>{formatINR(lensPrices[option.key] || 0)}</strong>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => addToCart()}
              disabled={submitting}
              className="w-full rounded-md bg-green-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? "Adding..." : "Add to Cart"}
            </button>
            {supportLine()}
          </div>
        )}
      </aside>
    );
  }
function renderEyewearDrawer() {
    const needsAdd = prescriptionType === "bifocal" || prescriptionType === "progressive";
    const groupedOptions = groupLensOptions(eyewearOptions);

    function topOptionButton(label: string, targetMode: string, onClick: () => void) {
      return (
        <button
          type="button"
          onClick={onClick}
          className={`w-full rounded-md border px-3 py-2.5 text-sm font-semibold ${
            mode === targetMode ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-800"
          }`}
        >
          {label}
        </button>
      );
    }

    function renderPrescriptionFields(side: "right" | "left") {
      const values = prescription[side];
      const title = side === "right" ? "Right Eye" : "Left Eye";

      return (
        <div className="rounded-md border border-slate-200 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-800">{title}</p>
          <div className={`grid gap-2 ${needsAdd ? "grid-cols-4" : "grid-cols-3"}`}>
            <div>
              <label className="mb-1 block text-xs text-slate-500">SPH</label>
              <select
                className="w-full rounded-md border px-2 py-2 text-sm"
                value={values.sph}
                onChange={(event) =>
                  setPrescription((prev) => ({ ...prev, [side]: { ...prev[side], sph: event.target.value } }))
                }
              >
                {sphOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">CYL</label>
              <select
                className="w-full rounded-md border px-2 py-2 text-sm"
                value={values.cyl}
                onChange={(event) =>
                  setPrescription((prev) => ({ ...prev, [side]: { ...prev[side], cyl: event.target.value } }))
                }
              >
                {cylOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Axis</label>
              <select
                className="w-full rounded-md border px-2 py-2 text-sm"
                value={values.axis}
                onChange={(event) =>
                  setPrescription((prev) => ({ ...prev, [side]: { ...prev[side], axis: event.target.value } }))
                }
              >
                {axisOptions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            {needsAdd && (
              <div>
                <label className="mb-1 block text-xs text-slate-500">ADD</label>
                <select
                  className="w-full rounded-md border px-2 py-2 text-sm"
                  value={values.add}
                  onChange={(event) =>
                    setPrescription((prev) => ({ ...prev, [side]: { ...prev[side], add: event.target.value } }))
                  }
                >
                  {EYEWEAR_ADD_RANGE.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      );
    }

    function renderPrescriptionSummary() {
      if (mode === "READER" || mode === "NON_RX") {
        return (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              <strong>Right Eye SS:</strong> {readerRight || "+0.00"}
            </p>
            <p className="mt-1">
              <strong>Left Eye SS:</strong> {readerLeft || "+0.00"}
            </p>
          </div>
        );
      }

      return (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p>
            <strong>Right Eye:</strong> SPH: {prescription.right.sph || "0.00"}, CYL: {prescription.right.cyl || "0.00"}, Axis:{" "}
            {prescription.right.axis || "0"}
            {needsAdd ? `, ADD: ${prescription.right.add || "0.00"}` : ""}
          </p>
          <p className="mt-1">
            <strong>Left Eye:</strong> SPH: {prescription.left.sph || "0.00"}, CYL: {prescription.left.cyl || "0.00"}, Axis:{" "}
            {prescription.left.axis || "0"}
            {needsAdd ? `, ADD: ${prescription.left.add || "0.00"}` : ""}
          </p>
        </div>
      );
    }

    return (
      <aside className="absolute right-0 top-0 z-[55] h-full w-full max-w-[340px] overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="text-base font-bold text-slate-900">STEP 1 - Select Lenses</h3>
          <button type="button" onClick={onClose} className="rounded p-1.5 text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {(eyewearStep === "option" || eyewearStep === "prescriptionType") && (
            <>
              {topOptionButton("Prescription", "PRESCRIPTION", () => {
                setMode("PRESCRIPTION");
                setPrescriptionType("");
                setLensOptionKey("");
                setEyewearProceeded(false);
                setEyewearStep("prescriptionType");
              })}

              {topOptionButton("Reader", "READER", () => {
                setMode("READER");
                setReaderRight(READER_SS_RANGE[0] || "+0.50");
                setReaderLeft(READER_SS_RANGE[0] || "+0.50");
                setLensOptionKey("");
                setEyewearProceeded(false);
                setEyewearStep("strengthForm");
              })}

              {topOptionButton("Non Prescription", "NON_RX", () => {
                setMode("NON_RX");
                setReaderRight("+0.00");
                setReaderLeft("+0.00");
                setLensOptionKey("");
                setEyewearProceeded(false);
                setEyewearStep("strengthForm");
              })}

              {topOptionButton("Only Frame", "ONLY_FRAME", () => addToCart("ONLY_FRAME"))}
            </>
          )}

          {eyewearStep === "prescriptionType" && mode === "PRESCRIPTION" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMode("");
                  setEyewearStep("option");
                  setEyewearProceeded(false);
                }}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                &lt;- Back
              </button>
              <h4 className="text-base font-semibold text-slate-800">Select Prescription Type</h4>
              {[
                { key: "single_vision", label: "Single Vision Lenses" },
                { key: "bifocal", label: "Bifocal Lenses" },
                { key: "progressive", label: "Progressive Lenses" },
              ].map((type) => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => {
                    setPrescriptionType(type.key);
                    setLensOptionKey("");
                    setEyewearProceeded(false);
                    setPrescription(eyewearDefaultPrescription);
                    setEyewearStep("prescriptionForm");
                  }}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800"
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}

          {eyewearStep === "prescriptionForm" && mode === "PRESCRIPTION" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setEyewearStep("prescriptionType");
                  setEyewearProceeded(false);
                }}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                &lt;- Back
              </button>
              <h4 className="text-base font-semibold text-slate-800">
                Enter {prescriptionType === "single_vision" ? "Single Vision" : prescriptionType === "bifocal" ? "Bifocal" : "Progressive"} Prescription
              </h4>
              {renderPrescriptionFields("right")}
              {renderPrescriptionFields("left")}
              <button
                type="button"
                onClick={() => {
                  if (!hasFullPrescription(prescription, needsAdd)) {
                    toast.error("Complete all prescription details");
                    return;
                  }
                  setEyewearProceeded(true);
                  setEyewearStep("lensType");
                }}
                className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-blue-700"
              >
                Proceed
              </button>
            </div>
          )}

          {eyewearStep === "strengthForm" && (mode === "READER" || mode === "NON_RX") && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setMode("");
                  setEyewearStep("option");
                  setEyewearProceeded(false);
                }}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                &lt;- Back
              </button>
              <h4 className="text-base font-semibold text-slate-800">STEP 2 - Select Strength (SS)</h4>
              <div className="rounded-md border border-slate-200 p-3">
                <p className="mb-2 text-sm font-semibold text-slate-800">{mode === "READER" ? "Right & Left (Reading Power)" : "Zero Power"}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Right Eye SS</label>
                    <select
                      value={readerRight}
                      onChange={(event) => setReaderRight(event.target.value)}
                      className="w-full rounded-md border px-2 py-2 text-sm"
                    >
                      {(mode === "READER" ? READER_SS_RANGE : NON_RX_SS_RANGE).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Left Eye SS</label>
                    <select
                      value={readerLeft}
                      onChange={(event) => setReaderLeft(event.target.value)}
                      className="w-full rounded-md border px-2 py-2 text-sm"
                    >
                      {(mode === "READER" ? READER_SS_RANGE : NON_RX_SS_RANGE).map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!readerRight || !readerLeft) {
                    toast.error("Select strength");
                    return;
                  }
                  setEyewearProceeded(true);
                  setEyewearStep("lensType");
                }}
                className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-blue-700"
              >
                Proceed
              </button>
            </div>
          )}

          {eyewearStep === "lensType" && eyewearProceeded && (mode === "PRESCRIPTION" || mode === "READER" || mode === "NON_RX") && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setEyewearStep(mode === "PRESCRIPTION" ? "prescriptionForm" : "strengthForm")}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                &lt;- Back
              </button>

              <h4 className="text-base font-semibold text-slate-800">Summary</h4>
              {renderPrescriptionSummary()}

              <h4 className="text-base font-semibold text-slate-800">Select Lens Type</h4>

              <div className="space-y-3">
                {groupedOptions.map((group) => {
                  const groupTitle =
                    mode === "READER"
                      ? `Reader - ${group.title}`
                      : mode === "NON_RX"
                        ? `Non-RX - ${group.title}`
                        : group.title;

                  return (
                    <div key={group.id} className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700">{groupTitle}</p>
                      {group.items.map((option) => {
                        const active = lensOptionKey === option.key;
                        const price = lensPrices[option.key] || 0;

                        if (option.requiresTint) {
                          return (
                            <div key={option.key} className={`rounded-md border p-3 ${active ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
                              <button
                                type="button"
                                onClick={() => setLensOptionKey(option.key)}
                                className="flex w-full items-start justify-between text-left"
                              >
                                <div>
                                  <p className="font-semibold text-slate-800">{option.label}</p>
                                  <p className="mt-1 text-xs text-slate-500">Protecting approx. 50% from UV rays.</p>
                                </div>
                                <strong>{formatINR(price)}</strong>
                              </button>

                              <div className="mt-2">
                                <p className="mb-1 text-xs font-semibold text-slate-600">Color</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {lensTintSwatches.map((swatch) => (
                                    <button
                                      key={swatch.hex}
                                      type="button"
                                      onClick={() => {
                                        setLensOptionKey(option.key);
                                        setTintColor(swatch.hex);
                                      }}
                                      className={`h-6 w-6 rounded-full border ${
                                        active && tintColor === swatch.hex ? "border-slate-900 ring-2 ring-slate-300" : "border-slate-300"
                                      }`}
                                      style={{ backgroundColor: swatch.hex }}
                                      aria-label={swatch.name}
                                      title={swatch.name}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="mt-2">
                                <p className="mb-1 text-xs font-semibold text-slate-600">Darkness</p>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {TINT_DENSITIES.map((density) => (
                                    <button
                                      key={density}
                                      type="button"
                                      onClick={() => {
                                        setLensOptionKey(option.key);
                                        setTintDensity(density);
                                      }}
                                      className={`rounded border px-2 py-1 text-xs ${
                                        active && tintDensity === density
                                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                          : "border-slate-300 bg-white text-slate-700"
                                      }`}
                                    >
                                      {density}%
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setLensOptionKey(option.key)}
                            className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-sm ${
                              active ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-800"
                            }`}
                          >
                            <span className="inline-flex items-center gap-2">
                              <span className={`h-4 w-4 rounded-full border ${active ? "border-emerald-600 bg-emerald-600" : "border-slate-400 bg-white"}`} />
                              {option.label}
                            </span>
                            <strong>{formatINR(price)}</strong>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => addToCart()}
                disabled={submitting || !lensOptionKey}
                className="w-full rounded-md bg-green-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {submitting ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          )}

          {supportLine()}
        </div>
      </aside>
    );
  }

  if (!isMounted || (!open && !showAddedModal)) return null;

  const overlay = (
    <div className="fixed inset-0 z-[100]">
      {(open || showAddedModal) && (
        <button
          type="button"
          className="absolute inset-0 bg-black/45"
          onClick={open ? onClose : continueShopping}
          aria-label="Close overlay"
        />
      )}

      {open && (isContact ? renderContactDrawer() : isSunglasses ? renderSunglassesDrawer() : renderEyewearDrawer())}

      {showAddedModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-[320px] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-2 flex items-start justify-between">
              <h4 className="flex items-center gap-2 text-2xl font-semibold text-emerald-700">
                <Check size={18} /> Added to Cart!
              </h4>
              <button type="button" onClick={continueShopping} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>
            <p className="text-base text-slate-600">Item added successfully.</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={continueShopping}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={goToCart}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Go to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
}


