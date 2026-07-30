/**
 * Solar Sizing module - two independent methodologies sharing one function,
 * selected by system type:
 *
 *  - Hybrid: source 'Solar Sizing - Hybrid' sheet (original Mardale workbook).
 *    Daytime-offset of Standard-rate load + daily battery recharge, divided
 *    by a daily specific yield (kWh/kWp/day).
 *
 *  - Solar PV-only (Grid-Tied): source 'Solar Grid Tied Calc' sheet,
 *    "Solar calc - claude.xlsx" (new reference file, supersedes this app's
 *    earlier from-scratch grid-tied approach). Target self-consumption
 *    ratio x average TOTAL monthly consumption x 12, divided by an annual
 *    specific yield (kWh/kWp/yr). Much simpler than the Hybrid methodology
 *    and does not use the daytime/Standard-band breakdown at all.
 *
 * Deliberate correction vs. the original workbook (Hybrid path only, see
 * docs/assumptions.md):
 *  - The workbook's daytime-offset default (B14 = IF(C7=0, 40%, C14)) is
 *    inverted/confusing and silently ignores manual overrides in Solar-only
 *    mode. Here `daytimeOffsetTargetPct` is a single, always-editable input;
 *    the app pre-fills 100% for Hybrid, matching the workbook's own
 *    effective default, without the buggy toggle logic. (Solar-only no
 *    longer uses this field at all - see Grid-Tied methodology above.)
 *  - The workbook's grid/hybrid inverter rating (old B27) and the Battery
 *    Sizing module's own inverter/PCS rating are two different numbers for
 *    two different purposes; both are surfaced explicitly rather than
 *    silently picking one (see BatterySizingResult.recommendedInverterKw vs.
 *    SolarSizingResult.recommendedGridInverterKw).
 */

import type {
  MonthlyBillEntry,
  MonthlyConsumptionRow,
  SolarSizingAssumptions,
  SolarSizingResult,
  SystemType,
} from "./types";
import { BASE_ANNUAL_SPECIFIC_YIELD_KWH_PER_KWP } from "./solarYieldProfile.ts";

function ceilToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.ceil(value / step) * step;
}

export function computeSolarSizing(
  systemType: Extract<SystemType, "hybrid" | "solar_pv_only">,
  monthlyConsumption: MonthlyConsumptionRow[],
  bills: MonthlyBillEntry[],
  dailyBatteryDischargeKwh: number, // from Battery Sizing (0 if not applicable)
  batteryRoundTripEfficiency: number,
  assumptions: SolarSizingAssumptions
): SolarSizingResult {
  const maxNetworkCapacityKva = bills.length ? Math.max(...bills.map((b) => b.networkCapacityKva)) : 0;
  const recommendedGridInverterKw = ceilToStep(maxNetworkCapacityKva, assumptions.gridInverterRoundingStepKw);

  if (systemType === "solar_pv_only") {
    // --- Grid-Tied quick calc (source: 'Solar Grid Tied Calc' sheet) ---
    const totalValues = monthlyConsumption.map((r) => r.totalKwh);
    const averageMonthlyConsumptionKwh = totalValues.length
      ? totalValues.reduce((s, v) => s + v, 0) / totalValues.length
      : 0;
    const targetMonthlySolarSupplyKwh = averageMonthlyConsumptionKwh * assumptions.solarToConsumptionRatioPct;
    const annualSolarProductionRequiredKwh = targetMonthlySolarSupplyKwh * 12;
    const requiredPvArrayKwp = annualSolarProductionRequiredKwh / assumptions.annualSpecificYieldKwhPerKwp;
    const panelCount = Math.ceil((requiredPvArrayKwp * 1000) / assumptions.panelWattage);
    const actualInstalledKwp = (panelCount * assumptions.panelWattage) / 1000;
    const recommendedPvKwp = ceilToStep(actualInstalledKwp, assumptions.capacityRoundingStepKwp);

    return {
      method: "grid_tied_ratio",
      dailyBatteryRechargeKwh: 0,
      dailyStandardLoadToOffsetKwh: 0,
      totalDailySolarEnergyRequiredKwh: 0,
      averageMonthlyConsumptionKwh,
      targetMonthlySolarSupplyKwh,
      annualSolarProductionRequiredKwh,
      requiredPvArrayKwp,
      panelCount,
      actualInstalledKwp,
      recommendedPvKwp,
      recommendedGridInverterKw,
    };
  }

  // --- Hybrid methodology (source: 'Solar Sizing - Hybrid' sheet) ---
  const dailyBatteryRechargeKwh = assumptions.includeBatteryRecharge
    ? dailyBatteryDischargeKwh / batteryRoundTripEfficiency
    : 0;

  const standardValues = monthlyConsumption.map((r) => r.standardKwh);
  const avgStandardKwhPerMonth = standardValues.length
    ? standardValues.reduce((s, v) => s + v, 0) / standardValues.length
    : 0;
  const avgStandardKwhPerWeekday = avgStandardKwhPerMonth / assumptions.weekdaysPerMonth;
  const dailyStandardLoadToOffsetKwh = avgStandardKwhPerWeekday * assumptions.daytimeOffsetTargetPct;

  const totalDailySolarEnergyRequiredKwh = dailyBatteryRechargeKwh + dailyStandardLoadToOffsetKwh;

  const requiredPvArrayKwp = totalDailySolarEnergyRequiredKwh / assumptions.specificYieldKwhPerKwpPerDay;
  const panelCount = Math.ceil((requiredPvArrayKwp * 1000) / assumptions.panelWattage);
  const actualInstalledKwp = (panelCount * assumptions.panelWattage) / 1000;
  const recommendedPvKwp = ceilToStep(actualInstalledKwp, assumptions.capacityRoundingStepKwp);

  return {
    method: "hybrid_daytime_offset",
    dailyBatteryRechargeKwh,
    dailyStandardLoadToOffsetKwh,
    totalDailySolarEnergyRequiredKwh,
    averageMonthlyConsumptionKwh: 0,
    targetMonthlySolarSupplyKwh: 0,
    annualSolarProductionRequiredKwh: 0,
    requiredPvArrayKwp,
    panelCount,
    actualInstalledKwp,
    recommendedPvKwp,
    recommendedGridInverterKw,
  };
}

export function defaultSolarAssumptions(systemType: "hybrid" | "solar_pv_only"): SolarSizingAssumptions {
  return {
    peakSunHours: 4.5,
    panelDeratingFactor: 0.8,
    inverterEfficiency: 0.95,
    includeBatteryRecharge: systemType === "hybrid",
    solarHoursAvailableForStandardLoad: 8,
    weekdaysPerMonth: 30,
    daytimeOffsetTargetPct: systemType === "hybrid" ? 1.0 : 0.4,
    specificYieldKwhPerKwpPerDay: 4,
    solarToConsumptionRatioPct: 0.5,
    // Defaults to the detailed 12-month table's own average (1565.36) rather
    // than the reference sheet's separately-typed 1550 estimate in 'Solar
    // Grid Tied Calc'!B5 - the two differ slightly in the source file; the
    // table average is used here as the more rigorous figure. Both editable.
    annualSpecificYieldKwhPerKwp: BASE_ANNUAL_SPECIFIC_YIELD_KWH_PER_KWP,
    panelWattage: 620,
    mountingType: "ground_mount",
    capacityRoundingStepKwp: 10,
    gridInverterRoundingStepKw: 10,
  };
}
