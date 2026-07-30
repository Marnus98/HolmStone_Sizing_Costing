/**
 * Off-Grid Sizing module.
 *
 * REBUILT to match the 'Off-Grid' sheet in the user's new reference file
 * "Solar calc - claude.xlsx" (supersedes this app's earlier from-scratch
 * critical/non-critical/autonomy-day methodology, which had no workbook
 * basis at all). Source formulas:
 *
 *   Daily average (kWh/day)   = average monthly total consumption / 30.5
 *   BESS Usable (kWh)         = Daily average x 0.85
 *   BESS Installed (kWh)      = BESS Usable x 1.2
 *   Solar (kWp)                = Daily average / (4 x 0.8) x 1.1
 *
 * FLAGGED, NOT GUESSED: the 0.85 "BESS Usable" factor is unlabeled in the
 * source sheet. It reads like a coverage/DoD-adjacent assumption (usable
 * battery energy covers 85% of one average day's consumption) but its exact
 * intent (DoD? single-day autonomy target? something else?) was not
 * confirmed. Implemented literally as given, exposed as an editable
 * `batteryCoverageRatio` assumption, and called out again in docs/assumptions.md.
 *
 * The reference sheet has no generator, inverter/PCS-rating, or
 * undersized-warning concept - those remain app-level additions layered on
 * top (peak-load-based inverter sizing, optional generator, and a
 * worst-real-month check using the non-linear seasonal yield profile from
 * solarYieldProfile.ts) without altering the four core numbers above, which
 * match the reference sheet exactly.
 */

import type { ConsumptionSummary, OffGridSizingAssumptions, OffGridSizingResult } from "./types";
import { monthlyProductionKwh } from "./solarYieldProfile.ts";

function ceilToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.ceil(value / step) * step;
}

// 'Off-Grid'!B2 = Inputs!F15 / 30.5
const AVERAGE_DAYS_PER_MONTH = 30.5;

export function computeOffGridSizing(
  consumption: ConsumptionSummary,
  a: OffGridSizingAssumptions
): OffGridSizingResult {
  // --- Core quick calc (source: 'Off-Grid' sheet) ---
  const dailyAverageTotalKwh = consumption.averageMonthlyConsumptionKwh / AVERAGE_DAYS_PER_MONTH;

  const usableBatteryEnergyKwh = dailyAverageTotalKwh * a.batteryCoverageRatio;
  const installedBatteryEnergyKwh = usableBatteryEnergyKwh * a.batteryInstallMarginMultiplier;
  const recommendedBatteryCapacityKwh = ceilToStep(installedBatteryEnergyKwh, a.capacityRoundingStepKwh);

  const requiredPvArrayKwp =
    (dailyAverageTotalKwh / (a.solarPeakSunHours * a.solarDeratingFactor)) * a.solarMarginMultiplier;
  const panelCount = Math.ceil((requiredPvArrayKwp * 1000) / a.panelWattage);
  const recommendedPvKwp = ceilToStep((panelCount * a.panelWattage) / 1000, a.capacityRoundingStepKwp);

  // --- App-level additions ---
  const peakConnectedLoadKw = a.estimatedPeakLoadKw * a.designMarginFactor;
  const recommendedBatteryInverterKw = ceilToStep(peakConnectedLoadKw, a.powerRoundingStepKw);

  const suggestedMinGeneratorKva = Math.ceil(peakConnectedLoadKw / a.generatorPowerFactor);
  let generatorRequiredKva = 0;
  const reasons: string[] = [];

  if (!a.generatorIncluded) {
    reasons.push(
      "No generator backup is configured. This system depends entirely on solar + battery; extended low-solar " +
        "periods beyond the sized battery coverage will not be met. Add generator backup, or accept this risk explicitly."
    );
    generatorRequiredKva = suggestedMinGeneratorKva; // shown as a suggestion even though not included
  } else {
    generatorRequiredKva = Math.max(a.generatorRatedKva, suggestedMinGeneratorKva);
    if (a.generatorRatedKva < suggestedMinGeneratorKva) {
      reasons.push(
        `The specified generator (${a.generatorRatedKva} kVA) is smaller than the suggested minimum ` +
          `(${suggestedMinGeneratorKva} kVA) needed to cover the connected load.`
      );
    }
  }

  // Worst-real-month reality check: apply the non-linear seasonal yield
  // profile to the recommended PV size (using the same PSH x derating
  // figure the quick calc itself used, annualised), and compare against
  // that calendar month's ACTUAL metered consumption rather than the flat
  // average the core sizing above uses. Additive - does not change the
  // core numbers.
  const impliedAnnualSpecificYieldKwhPerKwp = a.solarPeakSunHours * a.solarDeratingFactor * 365;
  const monthlyProd = monthlyProductionKwh(recommendedPvKwp, impliedAnnualSpecificYieldKwhPerKwp);
  let worstIdx = 0;
  for (let i = 1; i < monthlyProd.length; i++) if (monthlyProd[i] < monthlyProd[worstIdx]) worstIdx = i;
  const worstMonthProductionKwh = monthlyProd[worstIdx];
  const worstMonthRow = consumption.monthlyConsumption.find((r) => r.month === worstIdx + 1);
  const worstMonthDemandKwh = worstMonthRow ? worstMonthRow.totalKwh : consumption.maxMonthlyConsumptionKwh;

  if (worstMonthProductionKwh < worstMonthDemandKwh) {
    reasons.push(
      `Estimated solar production in the site's real lowest-yield month (${worstMonthProductionKwh.toFixed(0)} kWh) ` +
        `is below that month's actual metered consumption (${worstMonthDemandKwh.toFixed(0)} kWh) at the recommended ` +
        `PV size. Increase PV capacity or rely on the generator more heavily during that period.`
    );
  }

  const isUndersizedWarning = reasons.length > 0;
  const undersizedReason = reasons.length ? reasons.join(" ") : undefined;

  return {
    dailyAverageTotalKwh,
    usableBatteryEnergyKwh,
    installedBatteryEnergyKwh,
    recommendedBatteryCapacityKwh,
    recommendedBatteryInverterKw,
    requiredPvArrayKwp,
    recommendedPvKwp,
    panelCount,
    generatorRequiredKva,
    worstMonthProductionKwh,
    worstMonthDemandKwh,
    isUndersizedWarning,
    undersizedReason,
  };
}

export const DEFAULT_OFFGRID_ASSUMPTIONS: OffGridSizingAssumptions = {
  batteryCoverageRatio: 0.85,
  batteryInstallMarginMultiplier: 1.2,
  solarPeakSunHours: 4,
  solarDeratingFactor: 0.8,
  solarMarginMultiplier: 1.1,
  estimatedPeakLoadKw: 15,
  designMarginFactor: 1.1,
  panelWattage: 620,
  generatorIncluded: false,
  generatorRatedKva: 0,
  generatorPowerFactor: 0.8,
  capacityRoundingStepKwh: 10,
  capacityRoundingStepKwp: 10,
  powerRoundingStepKw: 5,
};
