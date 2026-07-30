/**
 * Sections 1-4 of the Inputs sheet: municipal bill capture, tariff structure,
 * and the derived monthly/annual consumption & cost analysis.
 *
 * Source: Inputs!B6:AF95 in the Mardale Apple Farm workbook.
 *
 * Deliberate corrections vs. the original workbook (see docs/assumptions.md):
 *  - Section 3's month-to-bill-row mapping in the workbook is a fragile,
 *    hand-built lookup tied to one specific bill start month (e.g. C46='=C13+E12').
 *    Here, each MonthlyBillEntry carries its own calendar month, so consumption
 *    and cost are aggregated by calendar month directly - functionally
 *    equivalent for the workbook's own data, but robust to any start month.
 *  - Inputs!AF16:AF17 dropped the Network Access Charge term that every other
 *    row includes; this engine always computes Combined Demand Charge = S+T.
 */

import type {
  MonthlyBillEntry,
  TariffStructure,
  ConsumptionSummary,
  MonthlyConsumptionRow,
  MonthlyCostRow,
} from "./types";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function monthNumber(isoDate: string): number {
  return new Date(isoDate + "T00:00:00Z").getUTCMonth() + 1;
}

export function monthLabel(monthNum: number): string {
  return MONTH_NAMES[(monthNum - 1 + 12) % 12];
}

/** Per-row bill total (Inputs!G,L,Q,U,V,Z,AA-AF columns). */
export interface BillRowTotals {
  peakTotalR: number; // G = C*D + E*F
  offPeakTotalR: number; // L = H*I + J*K
  standardTotalR: number; // Q = M*N + O*P
  networkCapacityTotalR: number; // U = R*(S+T)
  totalKwh: number; // V = C+E+H+J+M+O
  ancillaryNetworkLegacyTotalR: number; // Z = V*(W+X+Y)
  totalBillR: number; // AC = Z+U+Q+L+G+AB+AA
  totalBillExclAdminServiceR: number; // AD = G+L+Q+Z
  blendedRPerKwh: number; // AE = AD/V
  combinedDemandChargeRPerKva: number; // AF = S+T (bug-fixed: always includes T)
}

export function computeBillRowTotals(row: MonthlyBillEntry): BillRowTotals {
  const peakTotalR = row.peakLowKwh * row.peakLowRate + row.peakHighKwh * row.peakHighRate;
  const offPeakTotalR = row.offPeakLowKwh * row.offPeakLowRate + row.offPeakHighKwh * row.offPeakHighRate;
  const standardTotalR = row.standardLowKwh * row.standardLowRate + row.standardHighKwh * row.standardHighRate;
  const networkCapacityTotalR = row.networkCapacityKva * (row.networkCapacityRate + row.networkAccessRate);
  const totalKwh =
    row.peakLowKwh + row.peakHighKwh + row.offPeakLowKwh + row.offPeakHighKwh +
    row.standardLowKwh + row.standardHighKwh;
  const ancillaryNetworkLegacyTotalR =
    totalKwh * (row.ancillaryChargeRate + row.networkDemandChargeRate + row.legacyChargeRate);
  const totalBillExclAdminServiceR = peakTotalR + offPeakTotalR + standardTotalR + ancillaryNetworkLegacyTotalR;
  const totalBillR = totalBillExclAdminServiceR + networkCapacityTotalR + row.adminCharge + row.serviceCharge;
  const blendedRPerKwh = totalKwh === 0 ? 0 : totalBillExclAdminServiceR / totalKwh;
  const combinedDemandChargeRPerKva = row.networkCapacityRate + row.networkAccessRate;
  return {
    peakTotalR, offPeakTotalR, standardTotalR, networkCapacityTotalR, totalKwh,
    ancillaryNetworkLegacyTotalR, totalBillR, totalBillExclAdminServiceR,
    blendedRPerKwh, combinedDemandChargeRPerKva,
  };
}

/** Seasonal + annually-weighted blended tariffs (Inputs!D36:D41 & B36/B38/B40). */
export interface BlendedTariffs {
  standardHigh: number;
  standardLow: number;
  standardAnnual: number;
  offPeakHigh: number;
  offPeakLow: number;
  offPeakAnnual: number;
  peakHigh: number;
  peakLow: number;
  peakAnnual: number;
}

export function computeBlendedTariffs(t: TariffStructure): BlendedTariffs {
  const surcharge = t.legacyChargeRate + t.ancillaryChargeRate + t.networkDemandChargeRate;
  const nHigh = t.highDemandSeasonMonths.length;
  const nLow = 12 - nHigh;
  const weightHigh = nHigh / 12;
  const weightLow = nLow / 12;

  const standardHigh = t.highSeasonStandardTariff + surcharge;
  const standardLow = t.lowSeasonStandardTariff + surcharge;
  const offPeakHigh = t.highSeasonOffPeakTariff + surcharge;
  const offPeakLow = t.lowSeasonOffPeakTariff + surcharge;
  const peakHigh = t.highSeasonPeakTariff + surcharge;
  const peakLow = t.lowSeasonPeakTariff + surcharge;

  return {
    standardHigh, standardLow,
    standardAnnual: standardHigh * weightHigh + standardLow * weightLow,
    offPeakHigh, offPeakLow,
    offPeakAnnual: offPeakHigh * weightHigh + offPeakLow * weightLow,
    peakHigh, peakLow,
    peakAnnual: peakHigh * weightHigh + peakLow * weightLow,
  };
}

/** Sections 3 & 4: monthly/annual consumption and cost, aggregated by calendar month. */
export function computeConsumptionSummary(
  bills: MonthlyBillEntry[],
  tariff: TariffStructure
): ConsumptionSummary {
  const blended = computeBlendedTariffs(tariff);
  const isHighSeason = (m: number) => tariff.highDemandSeasonMonths.includes(m);

  const consumptionByMonth = new Map<number, MonthlyConsumptionRow>();
  const costByMonth = new Map<number, MonthlyCostRow>();

  for (const bill of bills) {
    const m = monthNumber(bill.month);
    const peakKwh = bill.peakLowKwh + bill.peakHighKwh;
    const standardKwh = bill.standardLowKwh + bill.standardHighKwh;
    const offPeakKwh = bill.offPeakLowKwh + bill.offPeakHighKwh;
    const totalKwh = peakKwh + standardKwh + offPeakKwh;

    const prevC = consumptionByMonth.get(m);
    const c: MonthlyConsumptionRow = prevC
      ? {
          month: m,
          peakKwh: prevC.peakKwh + peakKwh,
          standardKwh: prevC.standardKwh + standardKwh,
          offPeakKwh: prevC.offPeakKwh + offPeakKwh,
          totalKwh: prevC.totalKwh + totalKwh,
        }
      : { month: m, peakKwh, standardKwh, offPeakKwh, totalKwh };
    consumptionByMonth.set(m, c);

    const high = isHighSeason(m);
    const peakCost = peakKwh * (high ? blended.peakHigh : blended.peakLow);
    const standardCost = standardKwh * (high ? blended.standardHigh : blended.standardLow);
    const offPeakCost = offPeakKwh * (high ? blended.offPeakHigh : blended.offPeakLow);
    const totalCost = peakCost + standardCost + offPeakCost;

    const prevCost = costByMonth.get(m);
    const cc: MonthlyCostRow = prevCost
      ? {
          month: m,
          peakCost: prevCost.peakCost + peakCost,
          standardCost: prevCost.standardCost + standardCost,
          offPeakCost: prevCost.offPeakCost + offPeakCost,
          totalCost: prevCost.totalCost + totalCost,
        }
      : { month: m, peakCost, standardCost, offPeakCost, totalCost };
    costByMonth.set(m, cc);
  }

  const monthlyConsumption = Array.from(consumptionByMonth.values()).sort((a, b) => a.month - b.month);
  const monthlyCost = Array.from(costByMonth.values()).sort((a, b) => a.month - b.month);

  const totalKwhValues = monthlyConsumption.map((r) => r.totalKwh);
  const annualConsumptionKwh = totalKwhValues.reduce((s, v) => s + v, 0);
  const annualCostR = monthlyCost.reduce((s, r) => s + r.totalCost, 0);
  const n = monthlyConsumption.length || 1;

  const peakSum = monthlyConsumption.reduce((s, r) => s + r.peakKwh, 0);
  const standardSum = monthlyConsumption.reduce((s, r) => s + r.standardKwh, 0);
  const offPeakSum = monthlyConsumption.reduce((s, r) => s + r.offPeakKwh, 0);
  const costPeakSum = monthlyCost.reduce((s, r) => s + r.peakCost, 0);
  const costStandardSum = monthlyCost.reduce((s, r) => s + r.standardCost, 0);
  const costOffPeakSum = monthlyCost.reduce((s, r) => s + r.offPeakCost, 0);

  return {
    monthlyConsumption,
    monthlyCost,
    annualConsumptionKwh,
    annualCostR,
    averageMonthlyConsumptionKwh: annualConsumptionKwh / n,
    averageMonthlyCostR: annualCostR / n,
    minMonthlyConsumptionKwh: Math.min(...totalKwhValues),
    maxMonthlyConsumptionKwh: Math.max(...totalKwhValues),
    consumptionMixPct: {
      peak: annualConsumptionKwh ? peakSum / annualConsumptionKwh : 0,
      standard: annualConsumptionKwh ? standardSum / annualConsumptionKwh : 0,
      offPeak: annualConsumptionKwh ? offPeakSum / annualConsumptionKwh : 0,
    },
    costMixPct: {
      peak: annualCostR ? costPeakSum / annualCostR : 0,
      standard: annualCostR ? costStandardSum / annualCostR : 0,
      offPeak: annualCostR ? costOffPeakSum / annualCostR : 0,
    },
    blendedTariffs: {
      standard: blended.standardAnnual,
      offPeak: blended.offPeakAnnual,
      peak: blended.peakAnnual,
    },
  };
}
