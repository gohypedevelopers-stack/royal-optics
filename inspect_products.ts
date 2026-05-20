import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      images: true,
      category: true,
    },
  });

  console.log("=== PRODUCTS IN DATABASE ===");
  for (const p of products) {
    console.log(`Product: ${p.name}`);
    console.log(`  Slug: ${p.slug}`);
    console.log(`  Category: ${p.category?.name} (${p.categoryId})`);
    console.log(`  mainImage field: "${p.mainImage}"`);
    console.log(`  Images in ProductImage table:`);
    for (const img of p.images) {
      console.log(`    - URL: "${img.url}" (Primary: ${img.isPrimary}, sortOrder: ${img.sortOrder})`);
    }
    console.log("-----------------------------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
