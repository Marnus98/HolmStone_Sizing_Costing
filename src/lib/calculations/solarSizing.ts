/**
 * Solar Sizing module (Hybrid and Solar PV-only share this engine).
 * Source: 'Solar Sizing - Hybrid' / 'Solar Sizing - Additional PV' sheets.
 *
 * Deliberate correction vs. the original workbook (see docs/assumptions.md):
 *  - The workbook's daytime-offset default (B14 = IF(C7=0, 40%, C14)) is
 *    inverted/confusing and silently ignores manual overrides in Solar-only
 *    mode. Here `daytimeOffsetTargetPct` is a single, always-editable input;
 *    the app pre-fills 100% for Hybrid and 40% for Solar-only, matching the
 *    workbook's own effective defaults, without the buggy toggle logic.
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
} from "./types";

function ceilToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.ceil(value / step) * step;
}

export function computeSolarSizing(
  monthlyConsumption: MonthlyConsumptionRow[],
  bills: MonthlyBillEntry[],
  dailyBatteryDischargeKwh: number, // from Battery Sizing (0 if not applicable)
  batteryRoundTripEfficiency: number,
  assumptions: SolarSizingAssumptions
): SolarSizingResult {
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

  const maxNetworkCapacityKva = bills.length ? Math.max(...bills.map((b) => b.networkCapacityKva)) : 0;
  const recommendedGridInverterKw = ceilToStep(maxNetworkCapacityKva, assumptions.gridInverterRoundingStepKw);

  return {
    dailyBatteryRechargeKwh,
    dailyStandardLoadToOffsetKwh,
    totalDailySolarEnergyRequiredKwh,
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
    panelWattage: 620,
    mountingType: "ground_mount",
    capacityRoundingStepKwp: 10,
    gridInverterRoundingStepKw: 10,
  };
}
