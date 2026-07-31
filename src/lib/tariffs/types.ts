/**
 * Eskom Non-Local-Authority (NLA - direct Eskom customer, not billed through
 * a municipality) tariff catalog.
 *
 * Source: "Eskom-tariffs-1-April-2026-Public.xlsm", sheets 'Megaflex NLA',
 * 'Miniflex NLA', 'Nightsave Rural NLA', 'Ruraflex NLA', 'Landrate NLA'.
 * All rates captured EXCLUDING VAT, to match the convention already used by
 * the app's seed data (mardaleTariff/mardaleBills - verified against the
 * source workbook's own Ruraflex zone3/voltage1 figures).
 */

export type EskomTariffId = "megaflex" | "miniflex" | "nightsave_rural" | "ruraflex" | "landrate";

export interface EskomTariffMeta {
  id: EskomTariffId;
  label: string;
  /** False = Nightsave Rural (single High/Low season energy rate, no Peak/Standard/Off-Peak split). */
  hasTou: boolean;
  /** False = Landrate only (flat rate, no season and no zone/voltage selection at all). */
  hasZoneVoltage: boolean;
}

export interface ZoneVoltageRow {
  zone: number;
  voltage: number;
  billcode: string;
  // TOU tariffs (Megaflex/Miniflex/Ruraflex): 6 energy rates, c/kWh.
  peakHigh?: number; standardHigh?: number; offPeakHigh?: number;
  peakLow?: number; standardLow?: number; offPeakLow?: number;
  // Nightsave Rural (no TOU): 2 energy rates, c/kWh.
  energyHigh?: number; energyLow?: number;
  energyDemandHigh?: number; energyDemandLow?: number; // R/kVA/m, Nightsave Rural only
  legacy: number; // c/kWh
  generationCapacity: number; // R/kVA/m
  transmissionNetwork?: number; // R/kVA/m, Megaflex only
  networkCapacity?: number; // R/kVA/m, Miniflex/Ruraflex/Nightsave Rural only (Megaflex's is voltage-only, see below)
}

export interface VoltageOnlyCharges {
  voltage: number;
  voltageLabel: string;
  ancillary: number; // c/kWh
  networkCapacity?: number; // R/kVA/m, Megaflex only
  networkDemandKva?: number; // R/kVA/m, Megaflex only
  networkDemandKwh?: number; // c/kWh, Miniflex/Ruraflex/Nightsave Rural only
  urbanLowVoltageSubsidy?: number; // R/kVA/m, Megaflex/Miniflex only
}

export interface CustomerCategoryCharge {
  category: string; // e.g. "≤ 100 kVA", "> 1 MVA", "Key customers"
  service: number; // R/POD/day
  admin: number; // R/POD/day
}

export interface TouTariffCatalog {
  id: EskomTariffId;
  rows: ZoneVoltageRow[];
  voltageCharges: VoltageOnlyCharges[];
  serviceAdmin: CustomerCategoryCharge[];
  reactiveEnergyHigh: number; // c/kVArh, 0 if not applicable
  reactiveEnergyLow: number;
  electrificationSubsidy: number; // c/kWh, 0 if not applicable
  affordabilitySubsidy: number;
}

export interface LandrateSubtariff {
  name: string;
  billcode: string;
  energy: number; // c/kWh
  ancillary: number; // c/kWh
  networkDemand: number; // c/kWh
  networkCapacityPerDay: number; // R/POD/day
  serviceAdminPerDay: number; // R/POD/day
  generationCapacityPerDay: number; // R/POD/day
}

export interface EskomTariffSelection {
  tariffId: EskomTariffId;
  zone?: number;
  voltage?: number;
  customerCategory?: string;
  landrateVariant?: string;
}

/** Fully resolved rates, ready to auto-fill a MonthlyBillEntry row (and TariffStructure). */
export interface ResolvedEskomTariff {
  tariffId: EskomTariffId;
  label: string;
  billcode: string;
  hasTou: boolean;

  // Energy, R/kWh. For Nightsave Rural/Landrate (hasTou=false), all six are
  // set to the same High/Low value so the existing cost formula works
  // unchanged - the UI collapses these to a single consumption field.
  peakHighRate: number; standardHighRate: number; offPeakHighRate: number;
  peakLowRate: number; standardLowRate: number; offPeakLowRate: number;

  ancillaryChargeRate: number; // R/kWh
  networkDemandChargeRate: number; // R/kWh (0 for Megaflex - billed as R/kVA/m instead, see networkAccessRate)
  legacyChargeRate: number; // R/kWh
  electrificationSubsidyRate: number; // R/kWh
  affordabilitySubsidyRate: number; // R/kWh

  networkCapacityRate: number; // R/kVA/m - primary capacity charge
  networkAccessRate: number; // R/kVA/m - Megaflex's second kVA-based demand charge only, 0 otherwise
  generationCapacityRate: number; // R/kVA/m
  transmissionNetworkRate: number; // R/kVA/m, Megaflex only
  urbanLowVoltageSubsidyRate: number; // R/kVA/m

  serviceChargeRate: number; // R/POD/day - multiply by days-in-month at apply time
  adminChargeRate: number; // R/POD/day - multiply by days-in-month at apply time

  reactiveEnergyChargeHighSeason: number; // R/kVArh
  reactiveEnergyChargeLowSeason: number; // R/kVArh
}
