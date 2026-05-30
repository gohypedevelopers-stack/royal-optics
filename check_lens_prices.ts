import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lensPrices = await prisma.lensPrice.findMany({
    where: { isActive: true },
  });

  console.log("=== LENS PRICES IN DATABASE ===");
  console.log(`Total active lens prices: ${lensPrices.length}`);
  console.log("");

  for (const lp of lensPrices) {
    console.log(`  Key: "${lp.key}" | Title: "${lp.title}" | Value: ${lp.value} | Type: ${lp.valueType} | Group: ${lp.group} | Category: ${lp.category}`);
  }

  // Build the same map as page.tsx does
  const lensPriceMap = lensPrices.reduce<Record<string, number>>((acc, item) => {
    acc[item.key] = Number(item.value);
    return acc;
  }, {});

  console.log("");
  console.log("=== LENS PRICE MAP (as passed to ProductDetails) ===");
  console.log(JSON.stringify(lensPriceMap, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma["$disconnect"]());
