import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const entries = [
  { key: "drv_day_night_basic", title: "Day & Night - Basic", group: "Day & Night Lenses", category: "Non-Prescription", sortOrder: 30, defaultValue: 4500 },
  { key: "drv_day_night_turbo", title: "Day & Night - Turbo", group: "Day & Night Lenses", category: "Non-Prescription", sortOrder: 31, defaultValue: 5500 },
  { key: "psv_day_night_basic", title: "Day & Night - Basic", group: "Day & Night Lenses", category: "Prescription - Single Vision", sortOrder: 30, defaultValue: 5000 },
  { key: "psv_day_night_turbo", title: "Day & Night - Turbo", group: "Day & Night Lenses", category: "Prescription - Single Vision", sortOrder: 31, defaultValue: 6000 },
  { key: "pbf_day_night_basic", title: "Day & Night - Basic", group: "Day & Night Lenses", category: "Prescription - Bifocal", sortOrder: 30, defaultValue: 5500 },
  { key: "pbf_day_night_turbo", title: "Day & Night - Turbo", group: "Day & Night Lenses", category: "Prescription - Bifocal", sortOrder: 31, defaultValue: 6500 },
  { key: "ppg_day_night_basic", title: "Day & Night - Basic", group: "Day & Night Lenses", category: "Prescription - Progressive", sortOrder: 30, defaultValue: 6000 },
  { key: "ppg_day_night_turbo", title: "Day & Night - Turbo", group: "Day & Night Lenses", category: "Prescription - Progressive", sortOrder: 31, defaultValue: 7000 },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const entry of entries) {
    const existing = await prisma.lensPrice.findFirst({
      where: { key: entry.key }
    });

    if (existing) {
      await prisma.lensPrice.update({
        where: { id: existing.id },
        data: {
          title: entry.title,
          group: entry.group,
          category: entry.category,
          sortOrder: entry.sortOrder,
          isActive: true
        }
      });
      console.log(`Updated existing: ${entry.key}`);
      updated++;
    } else {
      await prisma.lensPrice.create({
        data: {
          key: entry.key,
          title: entry.title,
          value: entry.defaultValue,
          valueType: "PRICE",
          group: entry.group,
          category: entry.category,
          sortOrder: entry.sortOrder,
          isActive: true,
        }
      });
      console.log(`Created new: ${entry.key}`);
      created++;
    }
  }

  console.log(`\nSuccessfully populated database. Created: ${created}, Updated: ${updated}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
