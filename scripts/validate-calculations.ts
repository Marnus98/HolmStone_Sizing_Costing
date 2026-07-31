/**
 * Golden-value validation: runs the calculation engine against real/reference
 * data and checks the results against values Excel itself produced in the
 * source workbooks (captured in the mapping doc, and in the new
 * "Solar calc - claude.xlsx" reference file for the Grid-Tied and Off-Grid
 * quick calcs).
 *
 * Run with:  node --experimental-strip-types scripts/validate-calculations.ts
 */
import { mardaleBills, mardaleTariff } from "../src/lib/seed/mardaleAppleFarm.ts";
import { computeConsumptionSummary } from "../src/lib/calculations/consumption.ts";
import { computeBatterySizing, DEFAULT_BATTERY_ASSUMPTIONS } from "../src/lib/calculations/batterySizing.ts";
import { computeSolarSizing, defaultSolarAssumptions } from "../src/lib/calculations/solarSizing.ts";
import { computeOffGridSizing, DEFAULT_OFFGRID_ASSUMPTIONS } from "../src/lib/calculations/offGridSizing.ts";
import type { ConsumptionSummary } from "../src/lib/calculations/types.ts";
import { resolveEskomTariff } from "../src/lib/tariffs/resolveTariff.ts";
import { computeLcoe, type LcoeAssumptions } from "../src/lib/calculations/lcoe.ts";

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
  "hybrid",
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

console.log("\n=== Eskom tariff catalog: Ruraflex NLA, Tx zone > 900km, < 500V ===\n");
// Cross-check against mardaleTariff/mardaleBills' April 2026 row, which was
// independently transcribed from the original Mardale workbook and is known
// to be Ruraflex zone 3 (>900km) / voltage 1 (<500V) - see mardaleAppleFarm.ts.
const ruraflexZ3V1 = resolveEskomTariff({ tariffId: "ruraflex", zone: 3, voltage: 1, customerCategory: "≤ 100 kVA" });
if (!ruraflexZ3V1) {
  fail++;
  console.log("  FAIL Ruraflex zone3/voltage1 did not resolve");
} else {
  check("Peak High rate (R/kWh)", ruraflexZ3V1.peakHighRate, 7.6858, 0.0001);
  check("Standard High rate (R/kWh)", ruraflexZ3V1.standardHighRate, 1.9214, 0.0001);
  check("Off-Peak High rate (R/kWh)", ruraflexZ3V1.offPeakHighRate, 1.2808, 0.0001);
  check("Peak Low rate (R/kWh)", ruraflexZ3V1.peakLowRate, 3.1896, 0.0001);
  check("Standard Low rate (R/kWh)", ruraflexZ3V1.standardLowRate, 1.7934, 0.0001);
  check("Off-Peak Low rate (R/kWh)", ruraflexZ3V1.offPeakLowRate, 1.2808, 0.0001);
  check("Legacy charge (R/kWh)", ruraflexZ3V1.legacyChargeRate, 0.2501, 0.0001);
  check("Network capacity rate (R/kVA)", ruraflexZ3V1.networkCapacityRate, 56.95, 0.001);
  check("Network demand charge (R/kWh)", ruraflexZ3V1.networkDemandChargeRate, 0.5255, 0.0001);
}

// --- New reference file: "Solar calc - claude.xlsx" ---
// Both the 'Solar Grid Tied Calc' and 'Off-Grid' sheets key off the same
// Inputs!F15 average-monthly-total-consumption figure (8754 kWh/month, i.e.
// 287.0163934426229 kWh/day x 30.5). Reproduced here as a synthetic 12-month
// consumption summary so the golden checks below match the sheet exactly.
const referenceConsumption: ConsumptionSummary = {
  monthlyConsumption: Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    peakKwh: 0,
    standardKwh: 0,
    offPeakKwh: 0,
    totalKwh: 8754,
  })),
  monthlyCost: [],
  annualConsumptionKwh: 8754 * 12,
  annualCostR: 0,
  averageMonthlyConsumptionKwh: 8754,
  averageMonthlyCostR: 0,
  minMonthlyConsumptionKwh: 8754,
  maxMonthlyConsumptionKwh: 8754,
  consumptionMixPct: { peak: 0, standard: 0, offPeak: 0 },
  costMixPct: { peak: 0, standard: 0, offPeak: 0 },
  blendedTariffs: { standard: 0, offPeak: 0, peak: 0 },
};

console.log("\n=== Scenario: Grid-Tied / Solar PV-only quick calc ('Solar Grid Tied Calc' sheet) ===\n");
const gridTied = computeSolarSizing(
  "solar_pv_only",
  referenceConsumption.monthlyConsumption,
  [],
  0,
  1,
  {
    ...defaultSolarAssumptions("solar_pv_only"),
    solarToConsumptionRatioPct: 0.5, // sheet B2
    annualSpecificYieldKwhPerKwp: 1550, // sheet B5 (its own rough estimate, distinct from the kWhkWp table's 1565.36 average)
  }
);
check("Average monthly consumption (kWh)", gridTied.averageMonthlyConsumptionKwh, 8754);
check("Target monthly solar supply (kWh)", gridTied.targetMonthlySolarSupplyKwh, 4377);
check("Annual solar production required (kWh)", gridTied.annualSolarProductionRequiredKwh, 52524);
check("Required PV array (kWp)", gridTied.requiredPvArrayKwp, 33.8865, 0.001);

console.log("\n=== Scenario: Off-Grid quick calc ('Off-Grid' sheet) ===\n");
const offGridGolden = computeOffGridSizing(referenceConsumption, DEFAULT_OFFGRID_ASSUMPTIONS);
check("Daily average total (kWh)", offGridGolden.dailyAverageTotalKwh, 287.0163934426229, 0.001);
check("BESS Usable (kWh)", offGridGolden.usableBatteryEnergyKwh, 243.96393442622949, 0.001);
check("BESS Installed (kWh)", offGridGolden.installedBatteryEnergyKwh, 292.75672131147536, 0.001);
check("Required Solar (kWp)", offGridGolden.requiredPvArrayKwp, 98.66188524590163, 0.001);

console.log("\n=== Scenario: Off-Grid system - real Mardale data sanity check ===\n");
const offGrid = computeOffGridSizing(summary, DEFAULT_OFFGRID_ASSUMPTIONS);
console.log(`  Daily average total: ${offGrid.dailyAverageTotalKwh.toFixed(1)} kWh`);
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

console.log("\n-- Off-grid undersized-warning trigger check (no generator backup) --");
const undersized = computeOffGridSizing(summary, {
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

console.log("\n=== Scenario: LCOE & Savings ('LCOE' sheet, LCOE - Claude.xlsx) ===\n");
// Reference sheet's own inputs, with insurance=0 to match (the source sheet
// has no insurance line - that's an app-level addition, checked separately below).
const lcoeGoldenAssumptions: LcoeAssumptions = {
  interestRatePct: 0.1025,
  solarProjectYears: 20,
  solarCostPerKwpR: 8583, // sheet B7 * 1000
  dsmFundingR: 0,
  solarMaintenancePct: 0.03,
  solarInsurancePct: 0,
  solarDegradationPctPerYear: 0.0055,
  batteryProjectYears: 15,
  batteryDodPct: 0.9,
  batteryCyclesPerDay: 1,
  batteryCostPerKwhR: 4450,
  batteryMaintenancePct: 0.025,
  batteryInsurancePct: 0,
  tariffEscalationPct: 0.09,
};
const lcoeGolden = computeLcoe("hybrid", 1500, 1500, 2313, 2.26095, 4.48905, lcoeGoldenAssumptions);
check("Solar CAPEX (B8)", lcoeGolden.solar.capexR, 12874500, 1);
check("Solar LCOE simple (B11)", lcoeGolden.solar.lcoeSimpleRPerKwh, 0.2861, 0.001);
check("Solar cost of capital/yr (B13)", lcoeGolden.solar.costOfCapitalRPerYear, 1538119.4811608412, 1);
check("Solar maintenance/yr (B14)", lcoeGolden.solar.maintenanceRPerYear, 386235, 0.01);
check("Solar project cost (B15)", lcoeGolden.solar.projectCostR, 38487089.62321682, 1);
check("Solar LCOE cost-of-capital (B16)", lcoeGolden.solar.lcoeCostOfCapitalRPerKwh, 0.8552686582937071, 0.0001);
check("Battery CAPEX (G12)", lcoeGolden.battery!.capexR, 10292850, 1);
check("Battery LCOS simple (G13)", lcoeGolden.battery!.losSimpleRPerKwh, 0.9030948756976154, 0.001);
check("Battery cost of capital/yr (G15)", lcoeGolden.battery!.costOfCapitalRPerYear, 1372607.560310351, 1);
check("Battery project cost (G17)", lcoeGolden.battery!.projectCostR, 24448932.154655263, 1);
check("Battery LCOS cost-of-capital (G18)", lcoeGolden.battery!.lcosCostOfCapitalRPerKwh, 2.1451498219781526, 0.0001);
check("Year 1 total savings (H27)", lcoeGolden.years[0].totalSavingsR, 3225810.264578808, 1);
check("Year 1 cumulative (I27)", lcoeGolden.years[0].cumulativeSavingsR, 3225810.264578808, 1);
check("Year 3 total savings (H29)", lcoeGolden.years[2].totalSavingsR, 4471215.250046365, 1);
check("Year 3 cumulative (I29)", lcoeGolden.years[2].cumulativeSavingsR, 11519855.488330735, 1);
check("Year 16 battery savings = 0 (G42, battery retired)", lcoeGolden.years[15].batterySavingsR, 0, 0.001);
check("Year 16 total savings (H42)", lcoeGolden.years[15].totalSavingsR, 10124618.058621215, 1);
check("Year 20 cumulative (I46)", lcoeGolden.years[19].cumulativeSavingsR, 202944027.69871834, 1);

console.log("\n-- LCOE app-level addition: Project insurance line (not in source sheet) --");
const lcoeWithInsurance = computeLcoe("hybrid", 1500, 1500, 2313, 2.26095, 4.48905, {
  ...lcoeGoldenAssumptions,
  solarInsurancePct: 0.01,
  batteryInsurancePct: 0.01,
});
if (
  lcoeWithInsurance.solar.insuranceRPerYear > 0 &&
  lcoeWithInsurance.solar.projectCostR > lcoeGolden.solar.projectCostR &&
  lcoeWithInsurance.battery!.insuranceRPerYear > 0
) {
  pass++;
  console.log(
    `  OK   Insurance adds R${lcoeWithInsurance.solar.insuranceRPerYear.toFixed(0)}/yr (solar) + ` +
      `R${lcoeWithInsurance.battery!.insuranceRPerYear.toFixed(0)}/yr (battery), correctly raising project cost/LCOE`
  );
} else {
  fail++;
  console.log("  FAIL Insurance line did not increase project cost as expected");
}

console.log("\n-- LCOE: Solar PV-only (no battery) --");
const lcoeSolarOnly = computeLcoe("solar_pv_only", 30, 1565.36, 0, 2.5, 4.5, lcoeGoldenAssumptions);
if (lcoeSolarOnly.battery === null && lcoeSolarOnly.years.every((y) => y.batterySavingsR === 0)) {
  pass++;
  console.log("  OK   Solar PV-only correctly has no battery block and zero battery savings in every year");
} else {
  fail++;
  console.log("  FAIL Solar PV-only should have no battery block / battery savings");
}

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
