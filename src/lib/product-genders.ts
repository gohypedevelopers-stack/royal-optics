import type { Prisma } from "@prisma/client";

export const genderOptions = [
  { value: "unisex", label: "Unisex" },
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
] as const;

// Keep existing single-gender records compatible with the nullable string column.
export function parseProductGenders(value?: string | null): string[] {
  return value ? value.split(",").map((gender) => gender.trim()).filter(Boolean) : [];
}

export function productGenderFilter(gender: string): Prisma.ProductWhereInput {
  // Match whole comma-separated values: "men" must never match "women".
  return {
    OR: [
      { gender },
      { gender: { startsWith: `${gender},` } },
      { gender: { endsWith: `,${gender}` } },
      { gender: { contains: `,${gender},` } },
    ],
  };
}
