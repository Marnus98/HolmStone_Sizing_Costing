/**
 * Golden-value validation: runs the calculation engine against the real
 * Mardale Apple Farm data and checks the results against the values Excel
 * itself produced in the source workbook (captured in the mapping doc).
 *
 * Run with:  node --experimental-strip-types scripts/validate-calculations.ts
 */
import { mardaleBills, mardaleTariff } from "../src/lib/seed/mardaleAppleFarm.ts";
import { computeConsumptionSummary } from "../src/lib/calculations/consumption.ts";
import { computeBatterySizing, DEFAULT_BATTERY_ASSUMPTIONS } from "../src/lib/calculations/batterySizing.ts";
import { computeSolarSizing, defaultSolarAssumptions } from "../src/lib/calculations/solarSizing.ts";
import { computeOffGridSizing, DEFAULT_OFFGRID_ASSUMPTIONS } from "../src/lib/calculations/offGridSizing.ts";

let pass = 0;
let fail = 0;

function check(label: string, actual: number, expected: number, tolerance = 0.01) {
  const diff = Math.abs(actual - expected);
  const ok = diff <= tolerance;
  if (ok) {
    pass++;
    console.log(`  OK   ${label}: ${actual.toFixed(4)} (expected ${expected})`);
  } else {
    fail++;
    console.log(`  FAIL ${label}: got ${actual.toFixed(4)}, expected ${expected} (diff ${diff.toFixed(4)})`);
  }
}

console.log("=== Scenario: Hybrid system (Mardale Apple Farm real data) ===\n");

console.log("-- Section 3/4: Consumption summary --");
const summary = computeConsumptionSummary(mardaleBills, mardaleTariff);
check("Annual Peak kWh", summary.monthlyConsumption.reduce((s, r) => s + r.peakKwh, 0), 7911);
check("Annual Standard kWh", summary.monthlyConsumption.reduce((s, r) => s + r.standardKwh, 0), 28262);
check("Annual Off-Peak kWh", summary.monthlyConsumption.reduce((s, r) => s + r.offPeakKwh, 0), 9825);
check("Annual Total kWh", summary.annualConsumptionKwh, 45998);
check("Average Standard kWh/month", summary.averageMonthlyConsumptionKwh > 0 ? summary.monthlyConsumption.reduce((s, r) => s + r.standardKwh, 0) / 12 : 0, 2355.1667, 0.01);

console.log("\n-- Battery Sizing: Scenario 2 (Annual Average) --");
const battAvg = computeBatterySizing(summary.monthlyConsumption, {
  ...DEFAULT_BATTERY_ASSUMPTIONS,
  scenario: "annual_average",
});
check("Design peak kWh/month", battAvg.designPeakKwhPerMonth, 659.25);
check("Daily discharge energy (kWh)", battAvg.dailyDischargeEnergyKwh, 29.9659, 0.001);
check("Gross capacity required (kWh)", battAvg.grossCapacityRequiredKwh, 35.0478, 0.001);
check("Recommended battery capacity (kWh)", battAvg.recommendedCapacityKwh, 40);
check("Recommended inverter/PCS (kW)", battAvg.recommendedInverterKw, 10);

console.log("\n-- Battery Sizing: Scenario 1 (Worst Month) --");
const battWorst = computeBatterySizing(summary.monthlyConsumption, {
  ...DEFAULT_BATTERY_ASSUMPTIONS,
  scenario: "worst_month",
  // The workbook rounds the Worst-Month scenario to the nearest 5 kWh and the
  // Annual-Average scenario to the nearest 10 kWh - two different battery
  // unit-size assumptions. Kept explicit here rather than silently picking one.
  capacityRoundingStepKwh: 5,
});
check("Design peak kWh/month", battWorst.designPeakKwhPerMonth, 1339);
check("Recommended battery capacity (kWh)", battWorst.recommendedCapacityKwh, 75);
check("Recommended inverter/PCS (kW)", battWorst.recommendedInverterKw, 15);

console.log("\n-- Solar Sizing: Hybrid (using annual-average battery recharge) --");
const solar = computeSolarSizing(
  summary.monthlyConsumption,
  mardaleBills,
  battAvg.dailyDischargeEnergyKwh,
  DEFAULT_BATTERY_ASSUMPTIONS.roundTripEfficiency,
  defaultSolarAssumptions("hybrid")
);
check("Total daily solar energy required (kWh)", solar.totalDailySolarEnergyRequiredKwh, 110.0486, 0.001);
check("Required PV array (kWp)", solar.requiredPvArrayKwp, 27.5121, 0.001);
check("Panel count", solar.panelCount, 45);
check("Actual installed (kWp)", solar.actualInstalledKwp, 27.9, 0.001);
check("Recommended PV (kWp)", solar.recommendedPvKwp, 30);
check("Recommended grid/hybrid inverter (kW)", solar.recommendedGridInverterKw, 80);

console.log("\n=== Scenario: Off-Grid system (new methodology - sanity check, no workbook baseline) ===\n");
const offGrid = computeOffGridSizing(DEFAULT_OFFGRID_ASSUMPTIONS);
console.log(`  Critical daily energy: ${offGrid.criticalDailyEnergyKwh.toFixed(1)} kWh`);
console.log(`  Recommended battery capacity: ${offGrid.recommendedBatteryCapacityKwh} kWh`);
console.log(`  Recommended battery inverter: ${offGrid.recommendedBatteryInverterKw} kW`);
console.log(`  Recommended PV: ${offGrid.recommendedPvKwp} kWp (${offGrid.panelCount} panels)`);
console.log(`  Generator required: ${offGrid.generatorRequiredKva} kVA`);
console.log(`  Undersized warning: ${offGrid.isUndersizedWarning} ${offGrid.undersizedReason ?? ""}`);
if (offGrid.recommendedBatteryCapacityKwh > 0 && offGrid.recommendedPvKwp > 0) {
  pass++;
  console.log("  OK   Off-grid engine produced sane non-zero sizing outputs");
} else {
  fail++;
  console.log("  FAIL Off-grid engine produced a zero/invalid result");
}

console.log("\n-- Off-grid undersized-warning trigger check (deliberately undersized inputs) --");
const undersized = computeOffGridSizing({
  ...DEFAULT_OFFGRID_ASSUMPTIONS,
  generatorIncluded: false, // no generator backup is the classic "obviously undersized" off-grid config
});
if (undersized.isUndersizedWarning) {
  pass++;
  console.log(`  OK   Warning correctly triggered: ${undersized.undersizedReason}`);
} else {
  fail++;
  console.log("  FAIL Expected undersized warning to trigger, but it did not");
}

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
