import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const targets = [
    "psv_tinted_uv", "psv_polarized_basic", "psv_polarized_advance", "psv_night_drive_yellow",
    "pbf_tinted_uv", "pbf_polarized_basic", "pbf_polarized_advance", "pbf_night_drive_yellow",
    "ppg_tinted_uv", "ppg_polarized_basic", "ppg_polarized_advance", "ppg_night_drive_yellow",
    // Non-Rx versions (already existed)
    "drv_tinted_uv", "drv_polarized_basic", "drv_night_drive_yellow",
  ];

  const rows = await p.lensPrice.findMany({
    where: { key: { in: targets } },
    select: { key: true, title: true, category: true, group: true, value: true, isActive: true },
    orderBy: { category: "asc" },
  });

  console.log("=== YOUR 4 LENS OPTIONS IN DATABASE ===\n");
  for (const r of rows) {
    console.log(`${r.isActive ? "✅" : "❌"} ${r.title}`);
    console.log(`   Key: ${r.key} | Price: ₹${r.value} | Category: ${r.category} -> ${r.group}\n`);
  }
  console.log(`Total found: ${rows.length}`);
}

main().catch(console.error).finally(() => p["$disconnect"]());
