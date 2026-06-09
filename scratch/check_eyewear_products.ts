import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, parentId: true }
  });
  console.log("CATEGORIES:", JSON.stringify(categories, null, 2));

  const root = categories.find(c => c.slug === "eyewear");
  if (root) {
    console.log("Root category ID:", root.id);
    const queue = [root.id];
    const visited = new Set<string>();
    const ids: string[] = [];
    while (queue.length) {
      const current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      ids.push(current);
      for (const item of categories) {
        if (item.parentId === current) queue.push(item.id);
      }
    }
    console.log("Descendant IDs:", ids);
    const names = ids.map(id => categories.find(c => c.id === id)?.name);
    console.log("Descendant Names:", names);

    // Fetch products belonging to these categories
    const products = await prisma.product.findMany({
      where: { categoryId: { in: ids } },
      select: { name: true, category: { select: { name: true } } }
    });
    console.log(`Products in Eyewear (${products.length}):`, products);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
