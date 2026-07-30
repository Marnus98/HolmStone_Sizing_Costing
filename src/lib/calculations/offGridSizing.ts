/**
 * Off-Grid Sizing module.
 *
 * NEW METHODOLOGY - not present in the source workbook (see Section 6 of the
 * Workbook Analysis & Application Specification, and mapping-doc Section
 * "Off-grid gap"). Follows the same calculation style as Battery Sizing,
 * extended with autonomy, generator, minimum-SOC-reserve and critical-load
 * concepts, plus a mandatory undersized-system warning as required by the
 * application brief. Labelled "HolmStone methodology (new)" - pending
 * engineering review before being treated as authoritative.
 */

import type { OffGridSizingAssumptions, OffGridSizingResult } from "./types";

function ceilToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.ceil(value / step) * step;
}

const HOURS_PER_DAY = 24;
const MIN_EFFECTIVE_DOD = 0.05; // floor to avoid division blow-up on bad inputs

export function computeOffGridSizing(a: OffGridSizingAssumptions): OffGridSizingResult {
  const criticalDailyEnergyKwh = a.criticalLoadKw * HOURS_PER_DAY;
  const totalDailyEnergyKwh = (a.criticalLoadKw + a.nonCriticalLoadKw) * HOURS_PER_DAY;

  const usableBatteryEnergyRequiredKwh = criticalDailyEnergyKwh * a.requiredAutonomyDays;

  const effectiveDodFraction = Math.max(
    a.depthOfDischarge - a.minimumStateOfChargeReservePct,
    MIN_EFFECTIVE_DOD
  );
  const grossBatteryCapacityRequiredKwh =
    (usableBatteryEnergyRequiredKwh * a.designMarginFactor) /
    effectiveDodFraction /
    a.roundTripEfficiency;
  const recommendedBatteryCapacityKwh = ceilToStep(grossBatteryCapacityRequiredKwh, a.capacityRoundingStepKwh);

  const peakConnectedLoadKw = (a.criticalLoadKw + a.nonCriticalLoadKw) * a.designMarginFactor;
  const recommendedBatteryInverterKw = ceilToStep(peakConnectedLoadKw, a.powerRoundingStepKw);

  const requiredPvArrayKwp =
    totalDailyEnergyKwh / (a.specificYieldKwhPerKwpPerDayWorstMonth * a.panelDeratingFactor);
  const panelCount = Math.ceil((requiredPvArrayKwp * 1000) / a.panelWattage);
  const recommendedPvKwp = ceilToStep((panelCount * a.panelWattage) / 1000, a.capacityRoundingStepKwp);

  const worstCaseDailyPvOutputKwh =
    recommendedPvKwp * a.specificYieldKwhPerKwpPerDayWorstMonth * a.panelDeratingFactor;

  const suggestedMinGeneratorKva = Math.ceil(peakConnectedLoadKw / a.generatorPowerFactor);

  let generatorRequiredKva = 0;
  let isUndersizedWarning = false;
  const reasons: string[] = [];

  if (a.requiredAutonomyDays < 1) {
    reasons.push(
      "Required autonomy is less than 1 day, which is unusually low for an off-grid design. Confirm this is intentional."
    );
  }

  // A pure PV+battery off-grid system with no generator backup cannot ride
  // through low-solar periods that exceed its designed autonomy - flag this
  // as the primary "obviously undersized / under-protected" condition,
  // regardless of how large the PV/battery are sized (per the application
  // brief's requirement to warn on obviously undersized off-grid designs).
  if (!a.generatorIncluded) {
    reasons.push(
      `No generator backup is configured. This system depends entirely on solar + battery and will not sustain ` +
      `the critical load beyond its designed ${a.requiredAutonomyDays}-day autonomy during extended low-solar ` +
      `conditions. Add generator backup, or accept this risk explicitly.`
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

  if (worstCaseDailyPvOutputKwh < totalDailyEnergyKwh) {
    reasons.push(
      `Worst-case (winter) solar production (${worstCaseDailyPvOutputKwh.toFixed(1)} kWh/day) is below the ` +
      `total daily load (${totalDailyEnergyKwh.toFixed(1)} kWh/day) even at the recommended PV size. Increase ` +
      `PV capacity, reduce non-critical load, or rely on the generator more heavily during winter.`
    );
  }

  isUndersizedWarning = reasons.length > 0;
  const undersizedReason = reasons.length ? reasons.join(" ") : undefined;

  return {
    criticalDailyEnergyKwh,
    totalDailyEnergyKwh,
    usableBatteryEnergyRequiredKwh,
    grossBatteryCapacityRequiredKwh,
    recommendedBatteryCapacityKwh,
    recommendedBatteryInverterKw,
    requiredPvArrayKwp,
    recommendedPvKwp,
    panelCount,
    generatorRequiredKva,
    isUndersizedWarning,
    undersizedReason,
  };
}

export const DEFAULT_OFFGRID_ASSUMPTIONS: OffGridSizingAssumptions = {
  criticalLoadKw: 5,
  nonCriticalLoadKw: 3,
  requiredAutonomyDays: 1.5,
  minimumStateOfChargeReservePct: 0.1,
  depthOfDischarge: 0.9,
  roundTripEfficiency: 0.95,
  designMarginFactor: 1.1,
  peakSunHoursWorstMonth: 3.5,
  panelDeratingFactor: 0.8,
  specificYieldKwhPerKwpPerDayWorstMonth: 3,
  panelWattage: 620,
  generatorIncluded: true,
  generatorRatedKva: 20,
  generatorPowerFactor: 0.8,
  capacityRoundingStepKwh: 10,
  capacityRoundingStepKwp: 10,
  powerRoundingStepKw: 5,
};
