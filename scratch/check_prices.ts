import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const prices = await prisma.lensPrice.findMany({
    orderBy: [{ category: "asc" }, { group: "asc" }, { sortOrder: "asc" }]
  });
  console.log("LENS_PRICES:", JSON.stringify(prices, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
