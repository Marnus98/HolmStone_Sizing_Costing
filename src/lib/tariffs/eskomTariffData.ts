/**
 * Raw Eskom NLA tariff catalog data, 1 April 2026 rates, EXCLUDING VAT.
 * Source: "Eskom-tariffs-1-April-2026-Public.xlsm" (uploaded reference file).
 * All c/kWh and c/kVArh figures are converted to R at point of use by
 * resolveTariff.ts (divide by 100); R/kVA/m and R/POD/day figures are used
 * as-is. See docs/assumptions.md for the full provenance/mapping notes.
 */

import type { EskomTariffMeta, TouTariffCatalog, LandrateSubtariff } from "./types.ts";

export const TARIFF_META: EskomTariffMeta[] = [
  { id: "megaflex", label: "Megaflex", hasTou: true, hasZoneVoltage: true },
  { id: "miniflex", label: "Miniflex", hasTou: true, hasZoneVoltage: true },
  { id: "ruraflex", label: "Ruraflex", hasTou: true, hasZoneVoltage: true },
  { id: "nightsave_rural", label: "Nightsave Rural", hasTou: false, hasZoneVoltage: true },
  { id: "landrate", label: "Landrate", hasTou: false, hasZoneVoltage: false },
];

const ZONE_LABELS: Record<number, string> = {
  0: "≤ 300km",
  1: "> 300km and ≤ 600km",
  2: "> 600km and ≤ 900km",
  3: "> 900km",
};

export { ZONE_LABELS };

export const MEGAFLEX: TouTariffCatalog = {
  id: "megaflex",
  rows: [
    { zone: 0, voltage: 1, billcode: "Me01N", peakHigh: 739.28, standardHigh: 184.82, offPeakHigh: 123.2, peakLow: 306.82, standardLow: 172.5, offPeakLow: 123.2, legacy: 24.78, generationCapacity: 5.29, transmissionNetwork: 11.56 },
    { zone: 0, voltage: 2, billcode: "Me02N", peakHigh: 720.19, standardHigh: 180.05, offPeakHigh: 120.03, peakLow: 298.89, standardLow: 168.05, offPeakLow: 120.03, legacy: 24.14, generationCapacity: 12.27, transmissionNetwork: 11.15 },
    { zone: 0, voltage: 3, billcode: "Me03N", peakHigh: 668.35, standardHigh: 167.08, offPeakHigh: 111.39, peakLow: 277.38, standardLow: 155.96, offPeakLow: 111.39, legacy: 22.4, generationCapacity: 9.28, transmissionNetwork: 10.17 },
    { zone: 0, voltage: 4, billcode: "Me04N", peakHigh: 623.23, standardHigh: 155.81, offPeakHigh: 103.87, peakLow: 258.65, standardLow: 145.43, offPeakLow: 103.87, legacy: 20.89, generationCapacity: 10.65, transmissionNetwork: 17.77 },
    { zone: 1, voltage: 1, billcode: "Me11N", peakHigh: 746.66, standardHigh: 186.67, offPeakHigh: 124.43, peakLow: 309.88, standardLow: 174.23, offPeakLow: 124.43, legacy: 24.78, generationCapacity: 5.29, transmissionNetwork: 11.68 },
    { zone: 1, voltage: 2, billcode: "Me12N", peakHigh: 727.41, standardHigh: 181.85, offPeakHigh: 121.24, peakLow: 301.88, standardLow: 169.72, offPeakLow: 121.24, legacy: 24.14, generationCapacity: 12.27, transmissionNetwork: 11.26 },
    { zone: 1, voltage: 3, billcode: "Me13N", peakHigh: 675.03, standardHigh: 168.76, offPeakHigh: 112.5, peakLow: 280.15, standardLow: 157.51, offPeakLow: 112.5, legacy: 22.4, generationCapacity: 9.28, transmissionNetwork: 10.28 },
    { zone: 1, voltage: 4, billcode: "Me14N", peakHigh: 629.46, standardHigh: 157.37, offPeakHigh: 104.91, peakLow: 261.23, standardLow: 146.87, offPeakLow: 104.91, legacy: 20.89, generationCapacity: 10.65, transmissionNetwork: 17.96 },
    { zone: 2, voltage: 1, billcode: "Me21N", peakHigh: 754.06, standardHigh: 188.51, offPeakHigh: 125.67, peakLow: 312.95, standardLow: 175.94, offPeakLow: 125.67, legacy: 24.78, generationCapacity: 5.29, transmissionNetwork: 11.8 },
    { zone: 2, voltage: 2, billcode: "Me22N", peakHigh: 734.61, standardHigh: 183.66, offPeakHigh: 122.43, peakLow: 304.87, standardLow: 171.41, offPeakLow: 122.43, legacy: 24.14, generationCapacity: 12.27, transmissionNetwork: 11.37 },
    { zone: 2, voltage: 3, billcode: "Me23N", peakHigh: 681.72, standardHigh: 170.43, offPeakHigh: 113.61, peakLow: 282.93, standardLow: 159.08, offPeakLow: 113.61, legacy: 22.4, generationCapacity: 9.28, transmissionNetwork: 10.38 },
    { zone: 2, voltage: 4, billcode: "Me24N", peakHigh: 635.69, standardHigh: 158.93, offPeakHigh: 105.95, peakLow: 263.83, standardLow: 148.33, offPeakLow: 105.95, legacy: 20.89, generationCapacity: 10.65, transmissionNetwork: 18.12 },
    { zone: 3, voltage: 1, billcode: "Me31N", peakHigh: 761.46, standardHigh: 190.36, offPeakHigh: 126.91, peakLow: 316.02, standardLow: 177.67, offPeakLow: 126.91, legacy: 24.78, generationCapacity: 5.29, transmissionNetwork: 11.92 },
    { zone: 3, voltage: 2, billcode: "Me32N", peakHigh: 741.81, standardHigh: 185.46, offPeakHigh: 123.64, peakLow: 307.86, standardLow: 173.08, offPeakLow: 123.64, legacy: 24.14, generationCapacity: 12.27, transmissionNetwork: 11.47 },
    { zone: 3, voltage: 3, billcode: "Me33N", peakHigh: 688.4, standardHigh: 172.1, offPeakHigh: 114.74, peakLow: 285.69, standardLow: 160.63, offPeakLow: 114.74, legacy: 22.4, generationCapacity: 9.28, transmissionNetwork: 10.47 },
    { zone: 3, voltage: 4, billcode: "Me34N", peakHigh: 641.92, standardHigh: 160.48, offPeakHigh: 106.97, peakLow: 266.41, standardLow: 149.78, offPeakLow: 106.97, legacy: 20.89, generationCapacity: 10.65, transmissionNetwork: 18.3 },
  ],
  voltageCharges: [
    { voltage: 1, voltageLabel: "< 500V", ancillary: 0.45, networkCapacity: 42.66, networkDemandKva: 52.65, urbanLowVoltageSubsidy: 0 },
    { voltage: 2, voltageLabel: "≥ 500V & < 66kV", ancillary: 0.42, networkCapacity: 39.13, networkDemandKva: 26.29, urbanLowVoltageSubsidy: 0 },
    { voltage: 3, voltageLabel: "≥ 66kV & ≤ 132kV", ancillary: 0.39, networkCapacity: 14.16, networkDemandKva: 10.36, urbanLowVoltageSubsidy: 11.09 },
    { voltage: 4, voltageLabel: "> 132kV*", ancillary: 0.37, networkCapacity: 0, networkDemandKva: 0, urbanLowVoltageSubsidy: 11.09 },
  ],
  serviceAdmin: [
    { category: "> 1 MVA", service: 215.91, admin: 21.07 },
    { category: "Key customers", service: 1216.44, admin: 21.07 },
  ],
  reactiveEnergyHigh: 34.49,
  reactiveEnergyLow: 0,
  electrificationSubsidy: 5.37,
  affordabilitySubsidy: 5.1,
};

export const MINIFLEX: TouTariffCatalog = {
  id: "miniflex",
  rows: [
    { zone: 0, voltage: 1, billcode: "Mi01N", peakHigh: 739.28, standardHigh: 184.82, offPeakHigh: 123.2, peakLow: 306.82, standardLow: 172.5, offPeakLow: 123.2, legacy: 24.78, generationCapacity: 5.29, networkCapacity: 54.22 },
    { zone: 0, voltage: 2, billcode: "Mi02N", peakHigh: 720.19, standardHigh: 180.05, offPeakHigh: 120.03, peakLow: 298.89, standardLow: 168.05, offPeakLow: 120.03, legacy: 24.14, generationCapacity: 12.27, networkCapacity: 50.27 },
    { zone: 0, voltage: 3, billcode: "Mi03N", peakHigh: 668.35, standardHigh: 167.08, offPeakHigh: 111.39, peakLow: 277.38, standardLow: 155.96, offPeakLow: 111.39, legacy: 22.4, generationCapacity: 9.28, networkCapacity: 24.33 },
    { zone: 0, voltage: 4, billcode: "Mi04N", peakHigh: 623.23, standardHigh: 155.81, offPeakHigh: 103.87, peakLow: 258.65, standardLow: 145.43, offPeakLow: 103.87, legacy: 20.89, generationCapacity: 10.65, networkCapacity: 17.77 },
    { zone: 1, voltage: 1, billcode: "Mi11N", peakHigh: 746.66, standardHigh: 186.67, offPeakHigh: 124.43, peakLow: 309.88, standardLow: 174.23, offPeakLow: 124.43, legacy: 24.78, generationCapacity: 5.29, networkCapacity: 54.35 },
    { zone: 1, voltage: 2, billcode: "Mi12N", peakHigh: 727.41, standardHigh: 181.85, offPeakHigh: 121.24, peakLow: 301.88, standardLow: 169.72, offPeakLow: 121.24, legacy: 24.14, generationCapacity: 12.27, networkCapacity: 50.38 },
    { zone: 1, voltage: 3, billcode: "Mi13N", peakHigh: 675.03, standardHigh: 168.76, offPeakHigh: 112.5, peakLow: 280.15, standardLow: 157.51, offPeakLow: 112.5, legacy: 22.4, generationCapacity: 9.28, networkCapacity: 24.44 },
    { zone: 1, voltage: 4, billcode: "Mi14N", peakHigh: 629.46, standardHigh: 157.37, offPeakHigh: 104.91, peakLow: 261.23, standardLow: 146.87, offPeakLow: 104.91, legacy: 20.89, generationCapacity: 10.65, networkCapacity: 17.96 },
    { zone: 2, voltage: 1, billcode: "Mi21N", peakHigh: 754.06, standardHigh: 188.51, offPeakHigh: 125.67, peakLow: 312.95, standardLow: 175.94, offPeakLow: 125.67, legacy: 24.78, generationCapacity: 5.29, networkCapacity: 54.46 },
    { zone: 2, voltage: 2, billcode: "Mi22N", peakHigh: 734.61, standardHigh: 183.66, offPeakHigh: 122.43, peakLow: 304.87, standardLow: 171.41, offPeakLow: 122.43, legacy: 24.14, generationCapacity: 12.27, networkCapacity: 50.5 },
    { zone: 2, voltage: 3, billcode: "Mi23N", peakHigh: 681.72, standardHigh: 170.43, offPeakHigh: 113.61, peakLow: 282.93, standardLow: 159.08, offPeakLow: 113.61, legacy: 22.4, generationCapacity: 9.28, networkCapacity: 24.54 },
    { zone: 2, voltage: 4, billcode: "Mi24N", peakHigh: 635.69, standardHigh: 158.93, offPeakHigh: 105.95, peakLow: 263.83, standardLow: 148.33, offPeakLow: 105.95, legacy: 20.89, generationCapacity: 10.65, networkCapacity: 18.12 },
    { zone: 3, voltage: 1, billcode: "Mi31N", peakHigh: 761.46, standardHigh: 190.36, offPeakHigh: 126.91, peakLow: 316.02, standardLow: 177.67, offPeakLow: 126.91, legacy: 24.78, generationCapacity: 5.29, networkCapacity: 54.58 },
    { zone: 3, voltage: 2, billcode: "Mi32N", peakHigh: 741.81, standardHigh: 185.46, offPeakHigh: 123.64, peakLow: 307.86, standardLow: 173.08, offPeakLow: 123.64, legacy: 24.14, generationCapacity: 12.27, networkCapacity: 50.61 },
    { zone: 3, voltage: 3, billcode: "Mi33N", peakHigh: 688.4, standardHigh: 172.1, offPeakHigh: 114.74, peakLow: 285.69, standardLow: 160.63, offPeakLow: 114.74, legacy: 22.4, generationCapacity: 9.28, networkCapacity: 24.63 },
    { zone: 3, voltage: 4, billcode: "Mi34N", peakHigh: 641.92, standardHigh: 160.48, offPeakHigh: 106.97, peakLow: 266.41, standardLow: 149.78, offPeakLow: 106.97, legacy: 20.89, generationCapacity: 10.65, networkCapacity: 18.3 },
  ],
  voltageCharges: [
    { voltage: 1, voltageLabel: "< 500V", ancillary: 0.45, networkDemandKwh: 32.3, urbanLowVoltageSubsidy: 0 },
    { voltage: 2, voltageLabel: "≥ 500V & < 66kV", ancillary: 0.42, networkDemandKwh: 10.45, urbanLowVoltageSubsidy: 0 },
    { voltage: 3, voltageLabel: "≥ 66kV & ≤ 132kV", ancillary: 0.39, networkDemandKwh: 10.21, urbanLowVoltageSubsidy: 11.09 },
    { voltage: 4, voltageLabel: "> 132kV*", ancillary: 0.37, networkDemandKwh: 0, urbanLowVoltageSubsidy: 11.09 },
  ],
  serviceAdmin: [
    { category: "≤ 100 kVA", service: 14.94, admin: 0.79 },
    { category: "> 100 kVA & ≤ 500 kVA", service: 69.91, admin: 13.49 },
    { category: "> 500 kVA & ≤ 1 MVA", service: 215.91, admin: 21.07 },
    { category: "> 1 MVA", service: 215.91, admin: 21.07 },
    { category: "Key customers", service: 1216.44, admin: 21.07 },
  ],
  reactiveEnergyHigh: 15.02,
  reactiveEnergyLow: 0,
  electrificationSubsidy: 5.37,
  affordabilitySubsidy: 5.1,
};

export const RURAFLEX: TouTariffCatalog = {
  id: "ruraflex",
  rows: [
    { zone: 0, voltage: 1, billcode: "Ru01N", peakHigh: 746.19, standardHigh: 186.55, offPeakHigh: 124.36, peakLow: 309.68, standardLow: 174.11, offPeakLow: 124.36, legacy: 25.01, generationCapacity: 5.07, networkCapacity: 56.6 },
    { zone: 0, voltage: 2, billcode: "Ru02N", peakHigh: 732.98, standardHigh: 183.23, offPeakHigh: 122.16, peakLow: 304.19, standardLow: 171.03, offPeakLow: 122.16, legacy: 24.57, generationCapacity: 7.63, networkCapacity: 52.55 },
    { zone: 1, voltage: 1, billcode: "Ru11N", peakHigh: 753.66, standardHigh: 188.42, offPeakHigh: 125.6, peakLow: 312.78, standardLow: 175.85, offPeakLow: 125.6, legacy: 25.01, generationCapacity: 5.07, networkCapacity: 56.71 },
    { zone: 1, voltage: 2, billcode: "Ru12N", peakHigh: 740.31, standardHigh: 185.08, offPeakHigh: 123.38, peakLow: 307.24, standardLow: 172.75, offPeakLow: 123.38, legacy: 24.57, generationCapacity: 7.63, networkCapacity: 52.66 },
    { zone: 2, voltage: 1, billcode: "Ru21N", peakHigh: 761.12, standardHigh: 190.27, offPeakHigh: 126.84, peakLow: 315.86, standardLow: 177.59, offPeakLow: 126.84, legacy: 25.01, generationCapacity: 5.07, networkCapacity: 56.83 },
    { zone: 2, voltage: 2, billcode: "Ru22N", peakHigh: 747.64, standardHigh: 186.92, offPeakHigh: 124.61, peakLow: 310.28, standardLow: 174.45, offPeakLow: 124.61, legacy: 24.57, generationCapacity: 7.63, networkCapacity: 52.78 },
    { zone: 3, voltage: 1, billcode: "Ru31N", peakHigh: 768.58, standardHigh: 192.14, offPeakHigh: 128.08, peakLow: 318.96, standardLow: 179.34, offPeakLow: 128.08, legacy: 25.01, generationCapacity: 5.07, networkCapacity: 56.95 },
    { zone: 3, voltage: 2, billcode: "Ru32N", peakHigh: 754.97, standardHigh: 188.74, offPeakHigh: 125.83, peakLow: 313.33, standardLow: 176.16, offPeakLow: 125.83, legacy: 24.57, generationCapacity: 7.63, networkCapacity: 52.9 },
  ],
  voltageCharges: [
    { voltage: 1, voltageLabel: "< 500V", ancillary: 0.45, networkDemandKwh: 52.55 },
    { voltage: 2, voltageLabel: "≥ 500V & < 22kV", ancillary: 0.45, networkDemandKwh: 45.56 },
  ],
  serviceAdmin: [
    { category: "≤ 100 kVA", service: 25.18, admin: 1.47 },
    { category: "> 100 kVA & ≤ 500 kVA", service: 69.91, admin: 13.49 },
    { category: "> 500 kVA & ≤ 1 MVA", service: 215.91, admin: 21.07 },
    { category: "> 1 MVA", service: 215.91, admin: 21.07 },
    { category: "Key customers", service: 1216.44, admin: 21.07 },
  ],
  reactiveEnergyHigh: 21.57,
  reactiveEnergyLow: 0,
  electrificationSubsidy: 0,
  affordabilitySubsidy: 0,
};

export const NIGHTSAVE_RURAL: TouTariffCatalog = {
  id: "nightsave_rural",
  rows: [
    { zone: 0, voltage: 1, billcode: "NR01N", energyHigh: 165.97, energyLow: 159.53, energyDemandHigh: 444.28, energyDemandLow: 103.96, networkCapacity: 56.6, legacy: 25.01, generationCapacity: 5.07 },
    { zone: 0, voltage: 2, billcode: "NR02N", energyHigh: 163.03, energyLow: 156.71, energyDemandHigh: 436.43, energyDemandLow: 102.11, networkCapacity: 52.55, legacy: 24.57, generationCapacity: 7.63 },
    { zone: 1, voltage: 1, billcode: "NR11N", energyHigh: 167.62, energyLow: 161.12, energyDemandHigh: 448.7, energyDemandLow: 105, networkCapacity: 56.71, legacy: 25.01, generationCapacity: 5.07 },
    { zone: 1, voltage: 2, billcode: "NR12N", energyHigh: 164.65, energyLow: 158.27, energyDemandHigh: 440.76, energyDemandLow: 103.14, networkCapacity: 52.66, legacy: 24.57, generationCapacity: 7.63 },
    { zone: 2, voltage: 1, billcode: "NR21N", energyHigh: 169.27, energyLow: 162.73, energyDemandHigh: 453.16, energyDemandLow: 106.04, networkCapacity: 56.83, legacy: 25.01, generationCapacity: 5.07 },
    { zone: 2, voltage: 2, billcode: "NR22N", energyHigh: 166.28, energyLow: 159.84, energyDemandHigh: 445.14, energyDemandLow: 104.16, networkCapacity: 52.78, legacy: 24.57, generationCapacity: 7.63 },
    { zone: 3, voltage: 1, billcode: "NR31N", energyHigh: 170.93, energyLow: 164.3, energyDemandHigh: 457.58, energyDemandLow: 107.06, networkCapacity: 56.95, legacy: 25.01, generationCapacity: 5.07 },
    { zone: 3, voltage: 2, billcode: "NR32N", energyHigh: 167.9, energyLow: 161.4, energyDemandHigh: 449.48, energyDemandLow: 105.18, networkCapacity: 52.9, legacy: 24.57, generationCapacity: 7.63 },
  ],
  voltageCharges: [
    { voltage: 1, voltageLabel: "< 500V", ancillary: 0.45, networkDemandKwh: 52.55 },
    { voltage: 2, voltageLabel: "≥ 500V & ≤ 22kV", ancillary: 0.45, networkDemandKwh: 45.56 },
  ],
  serviceAdmin: [
    { category: "≤ 100 kVA", service: 25.18, admin: 1.47 },
    { category: "> 100 kVA & ≤ 500 kVA", service: 69.91, admin: 13.49 },
    { category: "> 500 kVA & ≤ 1 MVA", service: 215.91, admin: 21.07 },
    { category: "> 1 MVA", service: 215.91, admin: 21.07 },
    { category: "Key customers", service: 1216.44, admin: 21.07 },
  ],
  reactiveEnergyHigh: 0,
  reactiveEnergyLow: 0,
  electrificationSubsidy: 0,
  affordabilitySubsidy: 0,
};

/** Note: 'energyDemandHigh/Low' (R/kVA/m, by season - Nightsave Rural's own
 *  distinct charge) is captured on each row above but not yet wired into a
 *  bill row (no separate seasonal-kVA-charge field exists in MonthlyBillEntry
 *  yet) - flagged in docs/assumptions.md as a known gap for Nightsave Rural specifically. */

export const LANDRATE: LandrateSubtariff[] = [
  { name: "Landrate 1", billcode: "L101N", energy: 242.9, ancillary: 0.45, networkDemand: 67.06, networkCapacityPerDay: 67.65, serviceAdminPerDay: 26.65, generationCapacityPerDay: 4.11 },
  { name: "Landrate 2", billcode: "L201N", energy: 242.9, ancillary: 0.45, networkDemand: 67.06, networkCapacityPerDay: 105.49, serviceAdminPerDay: 26.65, generationCapacityPerDay: 8.15 },
  { name: "Landrate 3", billcode: "L301N", energy: 242.9, ancillary: 0.45, networkDemand: 67.06, networkCapacityPerDay: 168.93, serviceAdminPerDay: 26.65, generationCapacityPerDay: 15.93 },
  { name: "Landrate 4", billcode: "L401N", energy: 398.82, ancillary: 0.45, networkDemand: 67.06, networkCapacityPerDay: 49.94, serviceAdminPerDay: 0, generationCapacityPerDay: 2.7 },
];
