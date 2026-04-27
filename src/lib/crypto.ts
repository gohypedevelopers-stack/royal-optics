import { createHash } from "crypto";

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortJson((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashLensDetails(lensDetails: unknown): string {
  if (!lensDetails) return "none";
  return sha256(stableStringify(lensDetails)).slice(0, 24);
}
