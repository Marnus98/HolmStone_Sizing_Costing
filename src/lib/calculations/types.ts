/**
 * Shared calculation-engine types.
 *
 * These mirror the workbook's Inputs / Battery Sizing / Solar Sizing sheets.
 * See docs/workbook-mapping.xlsx for the cell-by-cell source of every field.
 */

export type SystemType = "hybrid" | "off_grid" | "solar_pv_only";

export type MountingType = "roof_mount" | "ground_mount";

/** Section 1 — one row of manually-entered municipal bill history (Inputs!B6:AB17). */
export interface MonthlyBillEntry {
  /** First day of the billing month. */
  month: string; // ISO date, e.g. "2025-05-01"
  peakLowKwh: number;
  peakLowRate: number; // R/kWh
  peakHighKwh: number;
  peakHighRate: number; // R/kWh
  offPeakLowKwh: number;
  offPeakLowRate: number;
  offPeakHighKwh: number;
  offPeakHighRate: number;
  standardLowKwh: number;
  standardLowRate: number;
  standardHighKwh: number;
  standardHighRate: number;
  networkCapacityKva: number;
  networkCapacityRate: number; // R/kVA
  networkAccessRate: number; // R/kVA
  ancillaryChargeRate: number; // R/kWh
  networkDemandChargeRate: number; // R/kWh
  legacyChargeRate: number; // R/kWh
  adminCharge: number; // R
  serviceCharge: number; // R
}

/** Section 2 — tariff structure assumptions (Inputs!C22:D41). */
export interface TariffStructure {
  tariffName: string;
  legacyChargeRate: number; // R/kWh (Inputs!D23)
  ancillaryChargeRate: number; // R/kWh (Inputs!D24)
  networkDemandChargeRate: number; // R/kWh (Inputs!D25)
  reactiveEnergyChargeHighSeason: number; // R/kWh (Inputs!D26)
  reactiveEnergyChargeLowSeason: number; // R/kWh (Inputs!D27)
  highSeasonStandardTariff: number; // R/kWh (Inputs!D29)
  lowSeasonStandardTariff: number; // R/kWh (Inputs!D30)
  highSeasonOffPeakTariff: number; // R/kWh (Inputs!D31)
  lowSeasonOffPeakTariff: number; // R/kWh (Inputs!D32)
  highSeasonPeakTariff: number; // R/kWh (Inputs!D33)
  lowSeasonPeakTariff: number; // R/kWh (Inputs!D34)
  /** Calendar months (1-12) treated as Eskom High Demand Season. Default Jun/Jul/Aug. */
  highDemandSeasonMonths: number[];
}

export interface MonthlyConsumptionRow {
  month: number; // 1-12
  peakKwh: number;
  standardKwh: number;
  offPeakKwh: number;
  totalKwh: number;
}

export interface MonthlyCostRow {
  month: number; // 1-12
  peakCost: number;
  standardCost: number;
  offPeakCost: number;
  totalCost: number;
}

export interface ConsumptionSummary {
  monthlyConsumption: MonthlyConsumptionRow[];
  monthlyCost: MonthlyCostRow[];
  annualConsumptionKwh: number;
  annualCostR: number;
  averageMonthlyConsumptionKwh: number;
  averageMonthlyCostR: number;
  minMonthlyConsumptionKwh: number;
  maxMonthlyConsumptionKwh: number;
  consumptionMixPct: { peak: number; standard: number; offPeak: number };
  costMixPct: { peak: number; standard: number; offPeak: number };
  blendedTariffs: {
    standard: number; // R/kWh, weighted High/Low season (Inputs!B36)
    offPeak: number; // Inputs!B38
    peak: number; // Inputs!B40
  };
}

/** Battery Sizing module — assumptions (editable). */
export interface BatterySizingAssumptions {
  /** Which demand scenario to size against. */
  scenario: "worst_month" | "annual_average";
  peakHoursPerWeekday: number; // hr/day
  requiredBackupHours: number; // hr/day (hours to cover)
  weekdaysPerMonth: number; // days
  depthOfDischarge: number; // fraction 0-1
  roundTripEfficiency: number; // fraction 0-1 (battery + inverter/PCS combined)
  designMarginFactor: number; // multiplier, e.g. 1.0 = no margin
  /** Rounding step for recommended battery capacity, kWh. */
  capacityRoundingStepKwh: number;
  /** Rounding step for recommended inverter/PCS rating, kW. */
  powerRoundingStepKw: number;
}

export interface BatterySizingResult {
  designPeakKwhPerMonth: number;
  peakKwhPerWeekday: number;
  averageLoadKw: number; // "Average RED-zone power demand"
  designPowerKw: number; // with margin applied
  dailyDischargeEnergyKwh: number;
  grossCapacityRequiredKwh: number; // usable capacity, grossed up for DoD/efficiency
  recommendedCapacityKwh: number; // installed/nominal, rounded
  recommendedInverterKw: number; // battery inverter / PCS rating
}

/** Solar Sizing module — assumptions (editable). */
export interface SolarSizingAssumptions {
  peakSunHours: number; // hr/day
  panelDeratingFactor: number; // fraction 0-1
  inverterEfficiency: number; // fraction 0-1
  /** Whether solar must also recharge the battery daily (true for Hybrid & Off-grid). */
  includeBatteryRecharge: boolean;
  solarHoursAvailableForStandardLoad: number; // hr/day
  weekdaysPerMonth: number; // days
  /** Target fraction of standard-rate load solar should offset during daylight hours. */
  daytimeOffsetTargetPct: number; // fraction 0-1
  /** Specific yield: effective daily output per kWp installed. */
  specificYieldKwhPerKwpPerDay: number;
  panelWattage: number; // Wp
  mountingType: MountingType;
  /** Rounding step for recommended PV array size, kWp. */
  capacityRoundingStepKwp: number;
  /** Rounding step for the grid/hybrid inverter rating, kW (sized off historical peak kVA demand). */
  gridInverterRoundingStepKw: number;
}

export interface SolarSizingResult {
  dailyBatteryRechargeKwh: number;
  dailyStandardLoadToOffsetKwh: number;
  totalDailySolarEnergyRequiredKwh: number;
  requiredPvArrayKwp: number;
  panelCount: number;
  actualInstalledKwp: number;
  recommendedPvKwp: number;
  /** Inverter/hybrid rating sized off historical peak network-capacity demand (kVA). */
  recommendedGridInverterKw: number;
}

/** Off-Grid Sizing module — NEW methodology, not present in the source workbook. */
export interface OffGridSizingAssumptions {
  criticalLoadKw: number; // must-run load during an outage / no-sun period
  nonCriticalLoadKw: number; // deferrable / load-shed-first load
  requiredAutonomyDays: number; // days of zero solar the battery alone must cover
  minimumStateOfChargeReservePct: number; // fraction 0-1, reserve never discharged below
  depthOfDischarge: number; // fraction 0-1
  roundTripEfficiency: number; // fraction 0-1
  designMarginFactor: number;
  peakSunHoursWorstMonth: number; // worst-case (usually winter) PSH, hr/day
  panelDeratingFactor: number;
  specificYieldKwhPerKwpPerDayWorstMonth: number;
  panelWattage: number;
  generatorIncluded: boolean;
  generatorRatedKva: number; // 0 if none
  generatorPowerFactor: number; // typically 0.8
  capacityRoundingStepKwh: number;
  capacityRoundingStepKwp: number;
  powerRoundingStepKw: number;
}

export interface OffGridSizingResult {
  criticalDailyEnergyKwh: number;
  totalDailyEnergyKwh: number; // critical + non-critical (used for PV sizing)
  usableBatteryEnergyRequiredKwh: number; // critical load x autonomy days
  grossBatteryCapacityRequiredKwh: number; // usable, grossed up for DoD/efficiency/reserve
  recommendedBatteryCapacityKwh: number;
  recommendedBatteryInverterKw: number;
  requiredPvArrayKwp: number;
  recommendedPvKwp: number;
  panelCount: number;
  generatorRequiredKva: number; // 0 if not needed / not included
  /** True if the sized system cannot meet the critical load through the required
   *  autonomy period at the worst-case solar yield without a generator. */
  isUndersizedWarning: boolean;
  undersizedReason?: string;
}
