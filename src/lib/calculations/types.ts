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

  // --- Added for the Eskom tariff catalog (auto-filled by tariff/zone/voltage
  // selection - see src/lib/tariffs). Optional so existing rows/tests without
  // them keep working; computeBillRowTotals treats a missing value as 0. ---
  /** R/kVA/m, applied to networkCapacityKva. Megaflex/Miniflex/Ruraflex/Nightsave Rural 'Generation capacity charge'. */
  generationCapacityRate?: number;
  /** R/kVA/m, applied to networkCapacityKva. Megaflex-only 'Transmission network charges'. */
  transmissionNetworkRate?: number;
  /** R/kVA/m, applied to networkCapacityKva. Megaflex/Miniflex 'Urban low voltage subsidy charge' (usually 0). */
  urbanLowVoltageSubsidyRate?: number;
  /** R/kWh, applied to total kWh for the row. Megaflex/Miniflex 'Electrification and rural network subsidy charge'. */
  electrificationSubsidyRate?: number;
  /** R/kWh, applied to total kWh for the row. Megaflex/Miniflex 'Affordability subsidy charge'. */
  affordabilitySubsidyRate?: number;
  /** Reactive energy penalty - consumption (kVArh) and its season-resolved rate (R/kVArh). Megaflex/Miniflex/Ruraflex only. */
  reactiveEnergyKvarh?: number;
  reactiveEnergyRate?: number;
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
  // --- Hybrid methodology (source: workbook 'Solar Sizing - Hybrid') ---
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

  // --- Grid-Tied / Solar PV-only quick-calc methodology (source: 'Solar Grid
  //     Tied Calc' sheet, "Solar calc - claude.xlsx") ---
  /** Target fraction of TOTAL average monthly consumption solar should supply. */
  solarToConsumptionRatioPct: number; // fraction 0-1
  /** Annual specific yield, kWh/kWp/yr - also feeds the seasonal production chart (see solarYieldProfile.ts). */
  annualSpecificYieldKwhPerKwp: number;

  // --- Shared ---
  panelWattage: number; // Wp
  mountingType: MountingType;
  /** Rounding step for recommended PV array size, kWp. */
  capacityRoundingStepKwp: number;
  /** Rounding step for the grid/hybrid inverter rating, kW (sized off historical peak kVA demand). */
  gridInverterRoundingStepKw: number;
}

export interface SolarSizingResult {
  /** Which methodology produced this result. */
  method: "hybrid_daytime_offset" | "grid_tied_ratio";

  // Hybrid-path intermediates (0 when method is grid_tied_ratio)
  dailyBatteryRechargeKwh: number;
  dailyStandardLoadToOffsetKwh: number;
  totalDailySolarEnergyRequiredKwh: number;

  // Grid-tied-path intermediates (0 when method is hybrid_daytime_offset)
  averageMonthlyConsumptionKwh: number;
  targetMonthlySolarSupplyKwh: number;
  annualSolarProductionRequiredKwh: number;

  // Shared outputs
  requiredPvArrayKwp: number;
  panelCount: number;
  actualInstalledKwp: number;
  recommendedPvKwp: number;
  /** Inverter/hybrid rating sized off historical peak network-capacity demand (kVA). */
  recommendedGridInverterKw: number;
}

/**
 * Off-Grid Sizing module.
 * Source: 'Off-Grid' sheet, "Solar calc - claude.xlsx" - a simple quick-calc
 * methodology, superseding the earlier from-scratch HolmStone methodology.
 * See offGridSizing.ts for full provenance notes.
 */
export interface OffGridSizingAssumptions {
  // --- Quick-calc core (source: 'Off-Grid' sheet) ---
  /** Usable battery energy as a fraction of one day's average total consumption. Sheet default 0.85 - unlabeled in the source; treat as a coverage/DoD-adjacent factor pending confirmation. */
  batteryCoverageRatio: number; // fraction 0-1
  /** Usable -> installed battery uprate. Sheet default 1.2 (implies ~83% effective usable fraction). */
  batteryInstallMarginMultiplier: number;
  /** Peak Sun Hours used in the quick PV kWp calc. Sheet default 4. */
  solarPeakSunHours: number; // hr/day
  /** Panel/system derating. Sheet default 0.8. */
  solarDeratingFactor: number; // fraction 0-1
  /** Safety margin applied to the PV kWp result. Sheet default 1.1. */
  solarMarginMultiplier: number;

  // --- App-level additions (not in the reference sheet) - equipment
  //     selection & the brief's mandatory undersized-system warning ---
  estimatedPeakLoadKw: number; // for battery inverter/PCS sizing
  designMarginFactor: number; // margin applied to peak load for inverter sizing
  panelWattage: number; // Wp
  generatorIncluded: boolean;
  generatorRatedKva: number; // 0 if none
  generatorPowerFactor: number; // typically 0.8
  capacityRoundingStepKwh: number;
  capacityRoundingStepKwp: number;
  powerRoundingStepKw: number;
}

export interface OffGridSizingResult {
  dailyAverageTotalKwh: number; // average monthly total consumption / 30.5
  usableBatteryEnergyKwh: number; // raw, before rounding
  installedBatteryEnergyKwh: number; // raw, before rounding
  recommendedBatteryCapacityKwh: number; // rounded
  recommendedBatteryInverterKw: number;
  requiredPvArrayKwp: number; // raw, before rounding
  recommendedPvKwp: number; // rounded
  panelCount: number;
  generatorRequiredKva: number; // 0 if not needed / not included
  /** Estimated production in the site's real worst calendar month, using the
   *  non-linear seasonal yield profile (solarYieldProfile.ts) applied to the
   *  recommended PV size - an additive reality check on top of the flat
   *  quick-calc above, not a change to its core numbers. */
  worstMonthProductionKwh: number;
  /** That same month's actual metered consumption. */
  worstMonthDemandKwh: number;
  /** True if there is no generator backup, an undersized generator, or the
   *  worst real month's demand exceeds estimated production at recommended PV size. */
  isUndersizedWarning: boolean;
  undersizedReason?: string;
}
