import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const rows = await p.lensPrice.findMany({
    where: { isActive: true },
    select: { key: true, title: true, group: true, category: true },
    orderBy: [{ category: "asc" }, { group: "asc" }, { sortOrder: "asc" }],
  });
  console.log("=== ALL EXISTING LENS OPTIONS ===\n");
  for (const x of rows) {
    console.log(`Title: "${x.title}" | Group: "${x.group}" | Category: "${x.category}"`);
  }
  console.log(`\nTotal: ${rows.length} options`);
}
main().catch(console.error).finally(() => p["$disconnect"]());
