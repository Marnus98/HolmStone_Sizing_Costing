/**
 * Non-linear monthly solar-yield profile.
 *
 * Source: 'kWhkWp' sheet in the user's "Solar calc - claude.xlsx" reference
 * workbook - a monthly specific-yield table (kWh/kWp) for the reference
 * site/area. The sheet's own headline annual figure (B15 = AVERAGE(B3:B14)
 * = 1565.36 kWh/kWp) is the AVERAGE of the 12 monthly figures below, not
 * their SUM - meaning each monthly value is already expressed on the same
 * annual-equivalent scale (a seasonal index), not a standalone monthly
 * production figure.
 *
 * To turn this into real monthly production for a given PV array, each
 * month is normalised to its share of the 12-month total (a fraction that
 * always sums to 1 across the year) and that fraction is applied to
 * whatever annual specific-yield assumption (kWh/kWp/yr) is in force
 * elsewhere in the app. This keeps the seasonal SHAPE fixed while the
 * overall annual yield can be edited - so changing the annual kWh/kWp
 * assumption rescales every month proportionally, per the brief.
 */

/** kWhkWp!B15 - the reference sheet's own annual average, for display only. */
export const BASE_ANNUAL_SPECIFIC_YIELD_KWH_PER_KWP = 1565.36;

/** kWhkWp!B3:B14, Jan-Dec, full precision as captured from the sheet. */
export const MONTHLY_YIELD_INDEX: number[] = [
  1886.15064935065, // Jan
  1670.2493506493506, // Feb
  1600.618181818182, // Mar
  1386.6025974025972, // Apr
  1281.0753246753247, // May
  1120.155844155844, // Jun
  1248.2545454545457, // Jul
  1468.4415584415585, // Aug
  1582.6025974025972, // Sep
  1767.2831168831167, // Oct
  1943.6935064935062, // Nov
  1829.1636363636367, // Dec
];

const INDEX_TOTAL = MONTHLY_YIELD_INDEX.reduce((s, v) => s + v, 0);

/** Fraction of annual production falling in each calendar month (index 0 = Jan). Sums to 1. */
export const MONTHLY_PRODUCTION_FRACTION: number[] = MONTHLY_YIELD_INDEX.map((v) => v / INDEX_TOTAL);

/**
 * Monthly production (kWh), Jan-Dec, for a PV array of `pvKwp` kWp given an
 * annual specific-yield assumption (kWh/kWp/yr). Preserves the seasonal
 * shape above regardless of the annual assumption used.
 */
export function monthlyProductionKwh(pvKwp: number, annualSpecificYieldKwhPerKwp: number): number[] {
  const annualProductionKwh = pvKwp * annualSpecificYieldKwhPerKwp;
  return MONTHLY_PRODUCTION_FRACTION.map((f) => annualProductionKwh * f);
}

export interface WorstMonth {
  monthIndex: number; // 1-12
  kwh: number;
}

export function worstMonthProduction(pvKwp: number, annualSpecificYieldKwhPerKwp: number): WorstMonth {
  const monthly = monthlyProductionKwh(pvKwp, annualSpecificYieldKwhPerKwp);
  let worst = 0;
  for (let i = 1; i < monthly.length; i++) if (monthly[i] < monthly[worst]) worst = i;
  return { monthIndex: worst + 1, kwh: monthly[worst] };
}
