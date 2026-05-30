import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

// These are the keys the storefront UI uses (from lens.ts)
const UI_KEYS = [
  // Eyeglass Non-Rx
  "nonrx_clear_basic", "nonrx_clear_premium", "nonrx_poly_ar", "nonrx_blublock_basic", "nonrx_poly_blublock",
  "drv_tinted_uv", "drv_polarized_basic", "drv_night_drive_yellow", "drv_day_night_basic", "drv_day_night_turbo",
  // Eyeglass Prescription - Single Vision
  "psv_clear_basic", "psv_clear_premium", "psv_blublock_basic", "psv_blublock_advance", "psv_blublock_premium", "psv_blublock_exclusive",
  "psv_poly_ar", "psv_poly_blublock",
  // Bifocal
  "pbf_clear_basic", "pbf_clear_premium", "pbf_blublock_basic", "pbf_blublock_advance",
  // Progressive
  "ppg_clear_basic", "ppg_clear_premium", "ppg_blublock_basic", "ppg_blublock_advance", "ppg_blublock_premium", "ppg_blublock_exclusive",
  "ppg_poly_ar", "ppg_poly_blublock", "ppg_day_night_basic", "ppg_day_night_turbo",
  // Reader
  "reader_clear_basic", "reader_clear_premium", "reader_blublock_basic", "reader_blublock_advance", "reader_blublock_premium", "reader_blublock_exclusive",
  // Sunglasses
  "drv_sv_tinted_uv", "drv_sv_polarized_basic", "drv_sv_polarized_premium", "drv_sv_day_night_basic", "drv_sv_day_night_turbo",
  "drv_bf_tinted_uv", "drv_bf_polarized_basic", "drv_bf_polarized_premium", "drv_bf_day_night_basic", "drv_bf_day_night_turbo",
  "drv_pg_tinted_uv", "drv_pg_polarized_basic", "drv_pg_polarized_premium", "drv_pg_day_night_basic", "drv_pg_day_night_turbo",
  // Global
  "sunglasses_base_multiplier", "nonpower_multiplier_ss1", "nonpower_multiplier_ss2",
];

async function main() {
  const rows = await p.lensPrice.findMany({ select: { key: true, value: true } });
  const dbMap = new Map(rows.map(r => [r.key, Number(r.value)]));

  console.log("=== KEY MISMATCH ANALYSIS ===\n");
  
  const missing: string[] = [];
  const zeroPrice: string[] = [];
  const ok: string[] = [];

  for (const key of UI_KEYS) {
    if (!dbMap.has(key)) {
      missing.push(key);
    } else if (dbMap.get(key) === 0) {
      zeroPrice.push(key);
    } else {
      ok.push(key);
    }
  }

  console.log(`✅ Keys with prices set: ${ok.length}`);
  for (const k of ok) console.log(`   ${k} = ${dbMap.get(k)}`);

  console.log(`\n⚠️  Keys with ₹0 price: ${zeroPrice.length}`);
  for (const k of zeroPrice) console.log(`   ${k} = 0`);

  console.log(`\n❌ Keys MISSING from database: ${missing.length}`);
  for (const k of missing) console.log(`   ${k}`);

  // Check DB keys that are NOT used by the UI
  const unusedDbKeys = rows.filter(r => !UI_KEYS.includes(r.key));
  console.log(`\n🔵 Database keys NOT used by storefront UI: ${unusedDbKeys.length}`);
  for (const r of unusedDbKeys) console.log(`   ${r.key} = ${r.value}`);
}

main().catch(console.error).finally(() => p["$disconnect"]());
