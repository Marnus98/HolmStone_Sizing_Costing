/**
 * LCOE (Levelised Cost of Energy) & Savings module.
 * Source: "LCOE - Claude.xlsx" ('LCOE' sheet), uploaded reference workbook.
 *
 * Unlike the other reference workbooks, this one pulls its Solar/BESS size,
 * CAPEX-per-kW/kWh and blended tariff inputs from TWO external linked
 * workbooks ('[1]Costing Sheet' and '[1]Inputs', i.e. a real project's own
 * costing + Inputs tab) that were not supplied here. Per the brief - "All
 * inputs should be pulled from the system size tab" - this app instead wires
 * the size inputs straight from this app's own System Sizing results
 * (solarGridTied / solarHybrid / battery / offGrid) and this app's own
 * Consumption Analysis blended tariffs, rather than re-creating those two
 * external sheets. CAPEX cost-per-kW/kWh have NO source yet (Phase 2/3's BOQ
 * costing module isn't built), so they're editable assumption inputs here,
 * pre-filled with sensible defaults - see defaultLcoeAssumptions() below.
 *
 * Every formula below (PMT-based cost of capital, LCOE/LCOS, the year-by-year
 * savings table with tariff escalation + panel degradation) is transcribed
 * literally from the 'LCOE' sheet. Two things were ADDED beyond the source
 * sheet (flagged, per project convention, rather than silently folded in):
 *
 *  1. A "Project insurance" cost line (1% of CAPEX/year by default, editable),
 *     added at the user's explicit request - the source sheet has no
 *     insurance line at all, only maintenance.
 *  2. Interest rate is a SINGLE shared input applied to both the Solar and
 *     BESS annuity calculations. The source sheet technically has two
 *     separate interest-rate cells (B12, G14) but both default to the same
 *     10.25% figure with a currently-zero manual adjustment - collapsing
 *     them to one editable "financing rate" input matches the user's request
 *     ("Interest rate can be adjusted") and is a defensible simplification
 *     for a single blended project loan. Flagged in docs/assumptions.md.
 *
 * Known, deliberately-preserved limitation carried over from the source
 * sheet: the BESS is not "replaced" after its own project life expires (e.g.
 * a 15-year battery inside a 20-year solar horizon) - years beyond the
 * battery's life simply show zero battery savings, exactly like the source
 * sheet's own rows 42-46 (no G42:G46 formula, i.e. battery savings go blank).
 */

export type LcoeSystemType = "solar_pv_only" | "hybrid" | "off_grid";

export interface LcoeAssumptions {
  /** Shared financing rate for both Solar and BESS annuity (cost-of-capital) calcs. Sheet default 10.25%. */
  interestRatePct: number; // fraction, e.g. 0.1025

  // --- Solar block ---
  solarProjectYears: number; // sheet default 20
  /** R/kWp installed. No source yet (Phase 2/3 BOQ costing not built) - editable, defaults by mounting type. */
  solarCostPerKwpR: number;
  /** Once-off funding/rebate/DSM subtracted from Solar CAPEX before financing. Sheet default 0. */
  dsmFundingR: number;
  solarMaintenancePct: number; // fraction of Solar CAPEX/year. Sheet default 3%.
  /** NEW (app addition, not in source sheet): fraction of Solar CAPEX/year. Default 1%. */
  solarInsurancePct: number;
  /** Panel output degradation per year. Sheet default 0.55%. */
  solarDegradationPctPerYear: number;

  // --- BESS block (ignored when there's no battery, i.e. Solar PV-only) ---
  batteryProjectYears: number; // sheet default 15
  batteryDodPct: number; // fraction. Sheet default 90%.
  /** Full charge/discharge cycles per day. Sheet default 1. */
  batteryCyclesPerDay: number;
  /** R/kWh installed. No source yet (Phase 2/3 BOQ costing not built) - editable. Sheet-implied default R4,450/kWh. */
  batteryCostPerKwhR: number;
  batteryMaintenancePct: number; // fraction of BESS CAPEX/year. Sheet default 2.5%.
  /** NEW (app addition, not in source sheet): fraction of BESS CAPEX/year. Default 1%. */
  batteryInsurancePct: number;

  // --- Savings ---
  /** Annual electricity tariff escalation applied to the avoided-cost side of the savings calc. Sheet default 9%. */
  tariffEscalationPct: number;
}

export interface LcoeSolarBlock {
  sizeKwp: number;
  annualGenerationKwh: number;
  costPerKwpR: number;
  capexR: number;
  dsmFundingR: number;
  capexRequiredR: number;
  /** Simple/undiscounted LCOE - CAPEX required over lifetime energy, no financing cost. FYI metric only, not used in the savings calc. */
  lcoeSimpleRPerKwh: number;
  costOfCapitalRPerYear: number;
  maintenanceRPerYear: number;
  insuranceRPerYear: number;
  projectCostR: number;
  /** The LCOE actually used in the savings calc (includes financing cost of capital + maintenance + insurance). */
  lcoeCostOfCapitalRPerKwh: number;
}

export interface LcoeBatteryBlock {
  sizeKwh: number;
  dodPct: number;
  usableEnergyKwh: number;
  cyclesPerYear: number;
  cyclesPerLife: number;
  energyDischargedPerYearKwh: number;
  energyDischargedPerLifeKwh: number;
  costPerKwhR: number;
  capexR: number;
  /** Simple/undiscounted LCOS - CAPEX over lifetime energy throughput, no financing cost. FYI metric only. */
  losSimpleRPerKwh: number;
  costOfCapitalRPerYear: number;
  maintenanceRPerYear: number;
  insuranceRPerYear: number;
  projectCostR: number;
  /** The LCOS actually used in the savings calc. */
  lcosCostOfCapitalRPerKwh: number;
}

export interface LcoeYearRow {
  year: number;
  solarNetGenerationKwh: number;
  solarSavingsRateRPerKwh: number;
  solarSavingsR: number;
  batteryThroughputKwh: number;
  batterySavingsRateRPerKwh: number;
  batterySavingsR: number;
  totalSavingsR: number;
  cumulativeSavingsR: number;
}

export interface LcoeResult {
  systemType: LcoeSystemType;
  solar: LcoeSolarBlock;
  battery: LcoeBatteryBlock | null;
  years: LcoeYearRow[];
  totalCapexR: number;
  /** First year cumulative savings crosses total CAPEX, interpolated to a fraction of a year. Null if it doesn't happen within the modelled horizon. */
  simplePaybackYears: number | null;
  year1TotalSavingsR: number;
  year20CumulativeSavingsR: number; // last modelled year's cumulative savings (horizon = solarProjectYears)
}

/** -PMT(rate, nper, pv, 0, 0) - the standard annuity payment, matching the sheet's own -PMT(...) cells. */
function annuityPayment(ratePct: number, nper: number, pv: number): number {
  if (nper <= 0 || pv <= 0) return 0;
  if (ratePct === 0) return pv / nper;
  const factor = Math.pow(1 + ratePct, nper);
  return (pv * factor * ratePct) / (factor - 1);
}

export function defaultSolarCostPerKwp(mountingType: "roof_mount" | "ground_mount"): number {
  // User-supplied defaults ("ground mount ~R11k/kW, roof mount ~R9k/kW") -
  // both explicitly flagged by the user as placeholders pending real BOQ costing.
  return mountingType === "ground_mount" ? 11000 : 9000;
}

export function defaultLcoeAssumptions(mountingType: "roof_mount" | "ground_mount" = "ground_mount"): LcoeAssumptions {
  return {
    interestRatePct: 0.1025,
    solarProjectYears: 20,
    solarCostPerKwpR: defaultSolarCostPerKwp(mountingType),
    dsmFundingR: 0,
    solarMaintenancePct: 0.03,
    solarInsurancePct: 0.01,
    solarDegradationPctPerYear: 0.0055,
    batteryProjectYears: 15,
    batteryDodPct: 0.9,
    batteryCyclesPerDay: 1,
    batteryCostPerKwhR: 4450,
    batteryMaintenancePct: 0.025,
    batteryInsurancePct: 0.01,
    tariffEscalationPct: 0.09,
  };
}

export function computeLcoe(
  systemType: LcoeSystemType,
  pvKwp: number,
  annualSpecificYieldKwhPerKwp: number,
  batteryKwh: number, // 0 for solar_pv_only
  blendedStandardRateRPerKwh: number,
  blendedPeakRateRPerKwh: number,
  a: LcoeAssumptions
): LcoeResult {
  // --- Solar block ---
  const annualGenerationKwh = pvKwp * annualSpecificYieldKwhPerKwp;
  const capexR = pvKwp * a.solarCostPerKwpR;
  const capexRequiredR = Math.max(0, capexR - a.dsmFundingR);
  const solarLifetimeEnergyKwh = annualGenerationKwh * a.solarProjectYears;
  const lcoeSimpleRPerKwh = solarLifetimeEnergyKwh > 0 ? capexRequiredR / solarLifetimeEnergyKwh : 0;
  const solarCostOfCapitalRPerYear = annuityPayment(a.interestRatePct, a.solarProjectYears, capexRequiredR);
  const solarMaintenanceRPerYear = capexR * a.solarMaintenancePct;
  const solarInsuranceRPerYear = capexR * a.solarInsurancePct;
  const solarProjectCostR = (solarCostOfCapitalRPerYear + solarMaintenanceRPerYear + solarInsuranceRPerYear) * a.solarProjectYears;
  const lcoeCostOfCapitalRPerKwh = solarLifetimeEnergyKwh > 0 ? solarProjectCostR / solarLifetimeEnergyKwh : 0;

  const solar: LcoeSolarBlock = {
    sizeKwp: pvKwp,
    annualGenerationKwh,
    costPerKwpR: a.solarCostPerKwpR,
    capexR,
    dsmFundingR: a.dsmFundingR,
    capexRequiredR,
    lcoeSimpleRPerKwh,
    costOfCapitalRPerYear: solarCostOfCapitalRPerYear,
    maintenanceRPerYear: solarMaintenanceRPerYear,
    insuranceRPerYear: solarInsuranceRPerYear,
    projectCostR: solarProjectCostR,
    lcoeCostOfCapitalRPerKwh,
  };

  // --- BESS block ---
  let battery: LcoeBatteryBlock | null = null;
  if (systemType !== "solar_pv_only" && batteryKwh > 0) {
    const usableEnergyKwh = batteryKwh * a.batteryDodPct;
    const cyclesPerYear = 365 * a.batteryCyclesPerDay;
    const cyclesPerLife = a.batteryProjectYears * cyclesPerYear;
    const energyDischargedPerYearKwh = usableEnergyKwh * cyclesPerYear;
    const energyDischargedPerLifeKwh = usableEnergyKwh * cyclesPerLife;
    const batteryCapexR = batteryKwh * a.batteryCostPerKwhR;
    const losSimpleRPerKwh = energyDischargedPerLifeKwh > 0 ? batteryCapexR / energyDischargedPerLifeKwh : 0;
    const batteryCostOfCapitalRPerYear = annuityPayment(a.interestRatePct, a.batteryProjectYears, batteryCapexR);
    const batteryMaintenanceRPerYear = batteryCapexR * a.batteryMaintenancePct;
    const batteryInsuranceRPerYear = batteryCapexR * a.batteryInsurancePct;
    const batteryProjectCostR =
      (batteryCostOfCapitalRPerYear + batteryMaintenanceRPerYear + batteryInsuranceRPerYear) * a.batteryProjectYears;
    const lcosCostOfCapitalRPerKwh = energyDischargedPerLifeKwh > 0 ? batteryProjectCostR / energyDischargedPerLifeKwh : 0;

    battery = {
      sizeKwh: batteryKwh,
      dodPct: a.batteryDodPct,
      usableEnergyKwh,
      cyclesPerYear,
      cyclesPerLife,
      energyDischargedPerYearKwh,
      energyDischargedPerLifeKwh,
      costPerKwhR: a.batteryCostPerKwhR,
      capexR: batteryCapexR,
      losSimpleRPerKwh,
      costOfCapitalRPerYear: batteryCostOfCapitalRPerYear,
      maintenanceRPerYear: batteryMaintenanceRPerYear,
      insuranceRPerYear: batteryInsuranceRPerYear,
      projectCostR: batteryProjectCostR,
      lcosCostOfCapitalRPerKwh,
    };
  }

  // --- Year-by-year savings (horizon = Solar project life, sheet default 20 years) ---
  const years: LcoeYearRow[] = [];
  let cumulative = 0;
  for (let year = 1; year <= a.solarProjectYears; year++) {
    const degradationFactor = Math.pow(1 - a.solarDegradationPctPerYear, year - 1);
    const escalationFactor = Math.pow(1 + a.tariffEscalationPct, year - 1);
    const batteryStillInLife = battery !== null && year <= a.batteryProjectYears;
    const batteryThroughputKwh = batteryStillInLife ? battery!.energyDischargedPerYearKwh : 0;

    // Net solar generation excludes energy cycled through the battery (that
    // energy's savings are counted in the battery row instead), matching the
    // source sheet's B27 = ($B$5-$G$9)*(1-$G$1)^(year-1). NOTE (source quirk,
    // preserved literally rather than silently "fixed" - flagged in
    // docs/assumptions.md): the sheet's $G$9 reference is absolute and keeps
    // subtracting the battery's annual throughput from solar generation for
    // EVERY year of the horizon, even after the battery's own modelled life
    // (batteryProjectYears) ends and its savings row goes to zero - so in
    // later years that slice of energy earns neither solar nor battery
    // savings. Replicated as-is; see docs for the flag.
    const solarNetGenerationKwh = (annualGenerationKwh - (battery ? battery.energyDischargedPerYearKwh : 0)) * degradationFactor;
    const solarSavingsRateRPerKwh = blendedStandardRateRPerKwh * escalationFactor - lcoeCostOfCapitalRPerKwh;
    const solarSavingsR = solarSavingsRateRPerKwh * solarNetGenerationKwh;

    let batterySavingsRateRPerKwh = 0;
    let batterySavingsR = 0;
    if (batteryStillInLife) {
      batterySavingsRateRPerKwh =
        blendedPeakRateRPerKwh * escalationFactor - lcoeCostOfCapitalRPerKwh - battery!.lcosCostOfCapitalRPerKwh;
      batterySavingsR = batterySavingsRateRPerKwh * batteryThroughputKwh;
    }

    const totalSavingsR = solarSavingsR + batterySavingsR;
    cumulative += totalSavingsR;

    years.push({
      year,
      solarNetGenerationKwh,
      solarSavingsRateRPerKwh,
      solarSavingsR,
      batteryThroughputKwh,
      batterySavingsRateRPerKwh,
      batterySavingsR,
      totalSavingsR,
      cumulativeSavingsR: cumulative,
    });
  }

  const totalCapexR = capexRequiredR + (battery?.capexR ?? 0);

  // Simple payback: first year cumulative savings crosses total CAPEX, interpolated.
  let simplePaybackYears: number | null = null;
  for (let i = 0; i < years.length; i++) {
    if (years[i].cumulativeSavingsR >= totalCapexR) {
      const prevCumulative = i === 0 ? 0 : years[i - 1].cumulativeSavingsR;
      const yearGain = years[i].cumulativeSavingsR - prevCumulative;
      const fraction = yearGain > 0 ? (totalCapexR - prevCumulative) / yearGain : 0;
      simplePaybackYears = years[i].year - 1 + fraction;
      break;
    }
  }

  return {
    systemType,
    solar,
    battery,
    years,
    totalCapexR,
    simplePaybackYears,
    year1TotalSavingsR: years[0]?.totalSavingsR ?? 0,
    year20CumulativeSavingsR: years[years.length - 1]?.cumulativeSavingsR ?? 0,
  };
}
