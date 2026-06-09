import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: {
      name: true,
      category: {
        select: { name: true, slug: true }
      }
    }
  });
  console.log("ALL_PRODUCTS:", JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
