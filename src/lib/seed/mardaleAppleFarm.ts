/**
 * Real seed/demo data - the actual 12 months of municipal bill history
 * (Jun 2025 - May 2026) from the Mardale Apple Farm workbook, Inputs!B6:AB17.
 * Used both as the app's demo project and as the golden-value validation
 * fixture in scripts/validate-calculations.ts.
 */
import type { MonthlyBillEntry, TariffStructure } from "../calculations/types";

export const mardaleBills: MonthlyBillEntry[] = [
  { month: "2025-06-01", peakLowKwh: 0, peakLowRate: 2.9537, peakHighKwh: 343, peakHighRate: 7.1173, offPeakLowKwh: 0, offPeakLowRate: 1.1861, offPeakHighKwh: 645, offPeakHighRate: 1.1861, standardLowKwh: 0, standardLowRate: 1.6607, standardHighKwh: 751, standardHighRate: 1.7793, networkCapacityKva: 75, networkCapacityRate: 52.36, networkAccessRate: 3.34, ancillaryChargeRate: 0.0041, networkDemandChargeRate: 0.4832, legacyChargeRate: 0.23, adminCharge: 40.5, serviceCharge: 694.5 },
  { month: "2025-07-01", peakLowKwh: 0, peakLowRate: 2.9537, peakHighKwh: 321, peakHighRate: 7.1173, offPeakLowKwh: 0, offPeakLowRate: 1.1861, offPeakHighKwh: 849, offPeakHighRate: 1.1861, standardLowKwh: 0, standardLowRate: 1.6607, standardHighKwh: 713, standardHighRate: 1.7793, networkCapacityKva: 75, networkCapacityRate: 52.36, networkAccessRate: 3.34, ancillaryChargeRate: 0.0041, networkDemandChargeRate: 0.4832, legacyChargeRate: 0.23, adminCharge: 41.85, serviceCharge: 717.65 },
  { month: "2025-08-01", peakLowKwh: 0, peakLowRate: 2.9537, peakHighKwh: 385, peakHighRate: 7.1173, offPeakLowKwh: 0, offPeakLowRate: 1.1861, offPeakHighKwh: 809, offPeakHighRate: 1.1861, standardLowKwh: 0, standardLowRate: 1.6607, standardHighKwh: 971, standardHighRate: 1.7793, networkCapacityKva: 75, networkCapacityRate: 52.36, networkAccessRate: 3.34, ancillaryChargeRate: 0.0041, networkDemandChargeRate: 0.4832, legacyChargeRate: 0.23, adminCharge: 41.85, serviceCharge: 717.65 },
  { month: "2025-09-01", peakLowKwh: 322, peakLowRate: 2.9537, peakHighKwh: 0, peakHighRate: 7.1173, offPeakLowKwh: 632, offPeakLowRate: 1.1861, offPeakHighKwh: 0, offPeakHighRate: 1.1861, standardLowKwh: 595, standardLowRate: 1.6607, standardHighKwh: 0, standardHighRate: 1.7793, networkCapacityKva: 75, networkCapacityRate: 52.36, networkAccessRate: 3.34, ancillaryChargeRate: 0.0041, networkDemandChargeRate: 0.4832, legacyChargeRate: 0.23, adminCharge: 40.5, serviceCharge: 694.5 },
  { month: "2025-10-01", peakLowKwh: 446, peakLowRate: 2.9537, peakHighKwh: 0, peakHighRate: 7.1173, offPeakLowKwh: 589, offPeakLowRate: 1.1861, offPeakHighKwh: 0, offPeakHighRate: 1.1861, standardLowKwh: 2569, standardLowRate: 1.6607, standardHighKwh: 0, standardHighRate: 1.7793, networkCapacityKva: 75, networkCapacityRate: 52.36, networkAccessRate: 3.34, ancillaryChargeRate: 0.0041, networkDemandChargeRate: 0.4832, legacyChargeRate: 0.23, adminCharge: 41.85, serviceCharge: 717.65 },
  { month: "2025-11-01", peakLowKwh: 1007, peakLowRate: 2.9537, peakHighKwh: 0, peakHighRate: 7.1173, offPeakLowKwh: 961, offPeakLowRate: 1.1861, offPeakHighKwh: 0, offPeakHighRate: 1.1861, standardLowKwh: 4417, standardLowRate: 1.6607, standardHighKwh: 0, standardHighRate: 1.7793, networkCapacityKva: 75, networkCapacityRate: 52.36, networkAccessRate: 3.34, ancillaryChargeRate: 0.0041, networkDemandChargeRate: 0.4832, legacyChargeRate: 0.23, adminCharge: 40.5, serviceCharge: 694.5 },
  { month: "2025-12-01", peakLowKwh: 1053, peakLowRate: 2.9537, peakHighKwh: 0, peakHighRate: 7.1173, offPeakLowKwh: 1078, offPeakLowRate: 1.1861, offPeakHighKwh: 0, offPeakHighRate: 1.1861, standardLowKwh: 4211, standardLowRate: 1.6607, standardHighKwh: 0, standardHighRate: 1.7793, networkCapacityKva: 75, networkCapacityRate: 52.36, networkAccessRate: 3.34, ancillaryChargeRate: 0.0041, networkDemandChargeRate: 0.4832, legacyChargeRate: 0.23, adminCharge: 41.85, serviceCharge: 717.65 },
  { month: "2026-01-01", peakLowKwh: 1339, peakLowRate: 2.9537, peakHighKwh: 0, peakHighRate: 7.1173, offPeakLowKwh: 1472, offPeakLowRate: 1.1861, offPeakHighKwh: 0, offPeakHighRate: 1.1861, standardLowKwh: 5458, standardLowRate: 1.6607, standardHighKwh: 0, standardHighRate: 1.7793, networkCapacityKva: 75, networkCapacityRate: 52.36, networkAccessRate: 3.34, ancillaryChargeRate: 0.0041, networkDemandChargeRate: 0.4832, legacyChargeRate: 0.23, adminCharge: 41.85, serviceCharge: 717.65 },
  { month: "2026-02-01", peakLowKwh: 630, peakLowRate: 2.9537, peakHighKwh: 0, peakHighRate: 7.1173, offPeakLowKwh: 491, offPeakLowRate: 1.1861, offPeakHighKwh: 0, offPeakHighRate: 1.1861, standardLowKwh: 2979, standardLowRate: 1.6607, standardHighKwh: 0, standardHighRate: 1.7793, networkCapacityKva: 75, networkCapacityRate: 52.36, networkAccessRate: 3.34, ancillaryChargeRate: 0.0041, networkDemandChargeRate: 0.4832, legacyChargeRate: 0.23, adminCharge: 40.5, serviceCharge: 694.5 },
  { month: "2026-03-01", peakLowKwh: 688, peakLowRate: 2.9537, peakHighKwh: 0, peakHighRate: 7.1173, offPeakLowKwh: 431, offPeakLowRate: 1.1861, offPeakHighKwh: 0, offPeakHighRate: 1.1861, standardLowKwh: 3247, standardLowRate: 1.6607, standardHighKwh: 0, standardHighRate: 1.7793, networkCapacityKva: 75, networkCapacityRate: 52.36, networkAccessRate: 3.34, ancillaryChargeRate: 0.0041, networkDemandChargeRate: 0.4832, legacyChargeRate: 0.23, adminCharge: 39.44, serviceCharge: 679.47 },
  { month: "2026-04-01", peakLowKwh: 622, peakLowRate: 3.1896, peakHighKwh: 0, peakHighRate: 7.6858, offPeakLowKwh: 1560, offPeakLowRate: 1.2808, offPeakHighKwh: 0, offPeakHighRate: 1.2808, standardLowKwh: 1678, standardLowRate: 1.7934, standardHighKwh: 0, standardHighRate: 1.9214, networkCapacityKva: 75, networkCapacityRate: 56.95, networkAccessRate: 5.07, ancillaryChargeRate: 0.0045, networkDemandChargeRate: 0.5255, legacyChargeRate: 0.2501, adminCharge: 44.1, serviceCharge: 755.4 },
  { month: "2026-05-01", peakLowKwh: 755, peakLowRate: 3.1896, peakHighKwh: 0, peakHighRate: 7.6858, offPeakLowKwh: 308, offPeakLowRate: 1.2808, offPeakHighKwh: 0, offPeakHighRate: 1.2808, standardLowKwh: 673, standardLowRate: 1.7934, standardHighKwh: 0, standardHighRate: 1.9214, networkCapacityKva: 75, networkCapacityRate: 56.95, networkAccessRate: 5.07, ancillaryChargeRate: 0.0045, networkDemandChargeRate: 0.5255, legacyChargeRate: 0.2501, adminCharge: 45.57, serviceCharge: 780.58 },
];

export const mardaleTariff: TariffStructure = {
  tariffName: "ESKOM - Ruraflex >900km <500V",
  legacyChargeRate: 25.01 / 100,
  ancillaryChargeRate: 0.45 / 100,
  networkDemandChargeRate: 52.55 / 100,
  reactiveEnergyChargeHighSeason: 0,
  reactiveEnergyChargeLowSeason: 0,
  highSeasonStandardTariff: 1.9214,
  lowSeasonStandardTariff: 1.7934,
  highSeasonOffPeakTariff: 1.2808,
  lowSeasonOffPeakTariff: 1.2808,
  highSeasonPeakTariff: 7.6858,
  lowSeasonPeakTariff: 3.1896,
  highDemandSeasonMonths: [6, 7, 8],
};
