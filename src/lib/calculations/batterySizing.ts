/**
 * Battery Sizing module.
 * Source: 'Battery Sizing' sheet (B1:D20), Scenario 1 (Worst Month) and
 * Scenario 2 (Annual Average) columns.
 *
 * Deliberate correction vs. the original workbook (see docs/assumptions.md,
 * mapping doc row "Battery capacity calc" / B15,C15):
 *  - The workbook computes daily discharge energy as Design Power x "peak
 *    hours per weekday" for Scenario 1, but as Design Power x "hours to
 *    cover" for Scenario 2 - two different bases for what should be the same
 *    calculation. This engine always uses `requiredBackupHours` (the actual
 *    backup requirement) for both scenarios, which is the physically
 *    meaningful quantity. Flagged for HolmStone engineering sign-off.
 */

import type {
  MonthlyConsumptionRow,
  BatterySizingAssumptions,
  BatterySizingResult,
} from "./types";

function ceilToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.ceil(value / step) * step;
}

/**
 * @param monthlyPeakKwh The Peak(kWh) column from Section 3, one entry per month.
 */
export function computeBatterySizing(
  monthlyPeakKwh: MonthlyConsumptionRow[],
  assumptions: BatterySizingAssumptions
): BatterySizingResult {
  const peakValues = monthlyPeakKwh.map((r) => r.peakKwh);
  const average = peakValues.length ? peakValues.reduce((s, v) => s + v, 0) / peakValues.length : 0;
  const worstMonth = peakValues.length ? Math.max(...peakValues) : 0;

  const designPeakKwhPerMonth =
    assumptions.scenario === "worst_month" ? worstMonth : average;

  const peakKwhPerWeekday = designPeakKwhPerMonth / assumptions.weekdaysPerMonth;
  const averageLoadKw = peakKwhPerWeekday / assumptions.peakHoursPerWeekday;
  const designPowerKw = averageLoadKw * assumptions.designMarginFactor;

  const dailyDischargeEnergyKwh = designPowerKw * assumptions.requiredBackupHours;

  const grossCapacityRequiredKwh =
    dailyDischargeEnergyKwh / assumptions.depthOfDischarge / assumptions.roundTripEfficiency;

  const recommendedCapacityKwh = ceilToStep(grossCapacityRequiredKwh, assumptions.capacityRoundingStepKwh);
  const recommendedInverterKw = ceilToStep(designPowerKw, assumptions.powerRoundingStepKw);

  return {
    designPeakKwhPerMonth,
    peakKwhPerWeekday,
    averageLoadKw,
    designPowerKw,
    dailyDischargeEnergyKwh,
    grossCapacityRequiredKwh,
    recommendedCapacityKwh,
    recommendedInverterKw,
  };
}

export const DEFAULT_BATTERY_ASSUMPTIONS: BatterySizingAssumptions = {
  scenario: "annual_average",
  peakHoursPerWeekday: 5,
  requiredBackupHours: 5,
  weekdaysPerMonth: 22,
  depthOfDischarge: 0.9,
  roundTripEfficiency: 0.95,
  designMarginFactor: 1.0,
  capacityRoundingStepKwh: 10,
  powerRoundingStepKw: 5,
};
