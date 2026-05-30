import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const newEntries = [
    // ─── Prescription - Single Vision: Day & Night Lenses ───
    { key: "psv_day_night_basic", title: "Day & Night - Basic", group: "Day & Night Lenses", category: "Prescription - Single Vision", sortOrder: 30 },
    { key: "psv_day_night_turbo", title: "Day & Night - Turbo", group: "Day & Night Lenses", category: "Prescription - Single Vision", sortOrder: 31 },
    // ─── Prescription - Single Vision: Night Drive Lenses ───
    { key: "psv_night_drive_yellow", title: "Night Drive Yellow Colour", group: "Night Drive Lenses", category: "Prescription - Single Vision", sortOrder: 32 },
    // ─── Prescription - Single Vision: Tinted UV Lenses ───
    { key: "psv_tinted_uv", title: "Tinted UV (any color & darkness)", group: "Tinted UV Lenses", category: "Prescription - Single Vision", sortOrder: 33 },
    // ─── Prescription - Single Vision: Polarized Lenses ───
    { key: "psv_polarized_basic", title: "Polarized Lenses - Basic", group: "Polarized Lenses", category: "Prescription - Single Vision", sortOrder: 34 },
    { key: "psv_polarized_advance", title: "Polarized Lenses - Advance", group: "Polarized Lenses", category: "Prescription - Single Vision", sortOrder: 35 },

    // ─── Prescription - Bifocal: Day & Night Lenses ───
    { key: "pbf_day_night_basic", title: "Day & Night - Basic", group: "Day & Night Lenses", category: "Prescription - Bifocal", sortOrder: 30 },
    { key: "pbf_day_night_turbo", title: "Day & Night - Turbo", group: "Day & Night Lenses", category: "Prescription - Bifocal", sortOrder: 31 },
    // ─── Prescription - Bifocal: Night Drive Lenses ───
    { key: "pbf_night_drive_yellow", title: "Night Drive Yellow Colour", group: "Night Drive Lenses", category: "Prescription - Bifocal", sortOrder: 32 },
    // ─── Prescription - Bifocal: Tinted UV Lenses ───
    { key: "pbf_tinted_uv", title: "Tinted UV (any color & darkness)", group: "Tinted UV Lenses", category: "Prescription - Bifocal", sortOrder: 33 },
    // ─── Prescription - Bifocal: Polarized Lenses ───
    { key: "pbf_polarized_basic", title: "Polarized Lenses - Basic", group: "Polarized Lenses", category: "Prescription - Bifocal", sortOrder: 34 },
    { key: "pbf_polarized_advance", title: "Polarized Lenses - Advance", group: "Polarized Lenses", category: "Prescription - Bifocal", sortOrder: 35 },

    // ─── Prescription - Progressive: Night Drive Lenses ───
    { key: "ppg_night_drive_yellow", title: "Night Drive Yellow Colour", group: "Night Drive Lenses", category: "Prescription - Progressive", sortOrder: 32 },
    // ─── Prescription - Progressive: Tinted UV Lenses ───
    { key: "ppg_tinted_uv", title: "Tinted UV (any color & darkness)", group: "Tinted UV Lenses", category: "Prescription - Progressive", sortOrder: 33 },
    // ─── Prescription - Progressive: Polarized Lenses ───
    { key: "ppg_polarized_basic", title: "Polarized Lenses - Basic", group: "Polarized Lenses", category: "Prescription - Progressive", sortOrder: 34 },
    { key: "ppg_polarized_advance", title: "Polarized Lenses - Advance", group: "Polarized Lenses", category: "Prescription - Progressive", sortOrder: 35 },
  ];

  let created = 0;
  let skipped = 0;

  for (const entry of newEntries) {
    const exists = await p.lensPrice.findFirst({ where: { key: entry.key } });
    if (exists) {
      console.log(`  ⏭  Skipped (already exists): ${entry.key}`);
      skipped++;
      continue;
    }

    await p.lensPrice.create({
      data: {
        key: entry.key,
        title: entry.title,
        value: 0,
        valueType: "PRICE",
        group: entry.group,
        category: entry.category,
        sortOrder: entry.sortOrder,
        isActive: true,
      },
    });
    console.log(`  ✅ Created: ${entry.key} (${entry.category} -> ${entry.group})`);
    created++;
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
}

main().catch(console.error).finally(() => p["$disconnect"]());
