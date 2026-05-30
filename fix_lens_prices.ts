import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  // Update ALL single vision (psv_*) keys to 100 so the storefront shows prices
  const keysToUpdate = [
    "psv_clear_basic",
    "psv_clear_premium",
    "psv_blublock_basic",
    "psv_blublock_advance",
    "psv_blublock_premium",
    "psv_blublock_exclusive",
    "psv_poly_ar",
    "psv_poly_blublock",
    // Non-Rx options (shown under "Normal Lenses" on storefront)
    "nonrx_clear_basic",
    "nonrx_clear_premium",
    "nonrx_blublock_basic",
    "nonrx_poly_ar",
    "nonrx_poly_blublock",
    // Driving / Night options
    "drv_tinted_uv",
    "drv_polarized_basic",
    "drv_night_drive_yellow",
    "drv_day_night_basic",
    "drv_day_night_turbo",
  ];

  for (const key of keysToUpdate) {
    const result = await p.lensPrice.updateMany({
      where: { key },
      data: { value: 100 },
    });
    console.log(`Updated ${key}: ${result.count} row(s)`);
  }

  console.log("\nDone! All single vision & non-rx lens prices set to ₹100 for testing.");
}

main().catch(console.error).finally(() => p["$disconnect"]());
