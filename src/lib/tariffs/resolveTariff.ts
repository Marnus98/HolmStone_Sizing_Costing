/**
 * Resolves an Eskom tariff/zone/voltage/customer-category selection into a
 * flat bundle of rates ready to auto-fill a MonthlyBillEntry row + the
 * Section 2 TariffStructure. See types.ts for field-by-field unit/mapping
 * notes and eskomTariffData.ts for the source data.
 */

import type { EskomTariffSelection, ResolvedEskomTariff, ZoneVoltageRow, TouTariffCatalog } from "./types.ts";
import { MEGAFLEX, MINIFLEX, RURAFLEX, NIGHTSAVE_RURAL, LANDRATE, ZONE_LABELS, TARIFF_META } from "./eskomTariffData.ts";

const c2r = (c: number) => c / 100; // c/kWh or c/kVArh -> R

function catalogFor(id: EskomTariffSelection["tariffId"]): TouTariffCatalog | null {
  switch (id) {
    case "megaflex": return MEGAFLEX;
    case "miniflex": return MINIFLEX;
    case "ruraflex": return RURAFLEX;
    case "nightsave_rural": return NIGHTSAVE_RURAL;
    default: return null; // landrate has no zone/voltage catalog
  }
}

export function availableZones(tariffId: EskomTariffSelection["tariffId"]): { zone: number; label: string }[] {
  const cat = catalogFor(tariffId);
  if (!cat) return [];
  const zones = Array.from(new Set(cat.rows.map((r) => r.zone))).sort((a, b) => a - b);
  return zones.map((z) => ({ zone: z, label: ZONE_LABELS[z] ?? `Zone ${z}` }));
}

export function availableVoltages(tariffId: EskomTariffSelection["tariffId"], zone: number): { voltage: number; label: string }[] {
  const cat = catalogFor(tariffId);
  if (!cat) return [];
  const rows = cat.rows.filter((r) => r.zone === zone);
  return rows.map((r) => {
    const vc = cat.voltageCharges.find((v) => v.voltage === r.voltage);
    return { voltage: r.voltage, label: vc?.voltageLabel ?? `Voltage ${r.voltage}` };
  });
}

export function availableCustomerCategories(tariffId: EskomTariffSelection["tariffId"]): string[] {
  const cat = catalogFor(tariffId);
  if (!cat) return [];
  return cat.serviceAdmin.map((s) => s.category);
}

export function resolveEskomTariff(selection: EskomTariffSelection): ResolvedEskomTariff | null {
  if (selection.tariffId === "landrate") {
    const sub = LANDRATE.find((l) => l.name === selection.landrateVariant) ?? LANDRATE[0];
    const energyRate = c2r(sub.energy);
    return {
      tariffId: "landrate",
      label: sub.name,
      billcode: sub.billcode,
      hasTou: false,
      peakHighRate: energyRate, standardHighRate: energyRate, offPeakHighRate: energyRate,
      peakLowRate: energyRate, standardLowRate: energyRate, offPeakLowRate: energyRate,
      ancillaryChargeRate: c2r(sub.ancillary),
      networkDemandChargeRate: c2r(sub.networkDemand),
      legacyChargeRate: 0,
      electrificationSubsidyRate: 0,
      affordabilitySubsidyRate: 0,
      networkCapacityRate: 0,
      networkAccessRate: 0,
      generationCapacityRate: 0,
      transmissionNetworkRate: 0,
      urbanLowVoltageSubsidyRate: 0,
      // Landrate has no kVA-based charges at all - its "network capacity" and
      // "generation capacity" are both R/POD/day, folded into adminChargeRate
      // alongside its own service+admin charge (all three are per-connection
      // daily charges with no kVA/voltage basis to hang them off separately).
      serviceChargeRate: 0,
      adminChargeRate: sub.serviceAdminPerDay + sub.networkCapacityPerDay + sub.generationCapacityPerDay,
      reactiveEnergyChargeHighSeason: 0,
      reactiveEnergyChargeLowSeason: 0,
    };
  }

  const cat = catalogFor(selection.tariffId);
  if (!cat || selection.zone === undefined || selection.voltage === undefined) return null;

  const row: ZoneVoltageRow | undefined = cat.rows.find((r) => r.zone === selection.zone && r.voltage === selection.voltage);
  if (!row) return null;

  const vc = cat.voltageCharges.find((v) => v.voltage === selection.voltage);
  const sa = cat.serviceAdmin.find((s) => s.category === selection.customerCategory) ?? cat.serviceAdmin[0];

  const meta = TARIFF_META.find((m) => m.id === selection.tariffId)!;

  // Megaflex bills its second kVA-based demand charge as R/kVA/m (networkAccessRate);
  // Miniflex/Ruraflex/Nightsave Rural bill it as c/kWh instead (networkDemandChargeRate).
  const isMegaflex = selection.tariffId === "megaflex";

  const energyHigh = row.energyHigh ?? 0;
  const energyLow = row.energyLow ?? 0;
  const peakHigh = row.peakHigh ?? energyHigh;
  const standardHigh = row.standardHigh ?? energyHigh;
  const offPeakHigh = row.offPeakHigh ?? energyHigh;
  const peakLow = row.peakLow ?? energyLow;
  const standardLow = row.standardLow ?? energyLow;
  const offPeakLow = row.offPeakLow ?? energyLow;

  return {
    tariffId: selection.tariffId,
    label: `${meta.label} - Tx zone ${ZONE_LABELS[selection.zone] ?? selection.zone}, ${vc?.voltageLabel ?? `Voltage ${selection.voltage}`}`,
    billcode: row.billcode,
    hasTou: meta.hasTou,

    peakHighRate: c2r(peakHigh), standardHighRate: c2r(standardHigh), offPeakHighRate: c2r(offPeakHigh),
    peakLowRate: c2r(peakLow), standardLowRate: c2r(standardLow), offPeakLowRate: c2r(offPeakLow),

    ancillaryChargeRate: c2r(vc?.ancillary ?? 0),
    networkDemandChargeRate: isMegaflex ? 0 : c2r(vc?.networkDemandKwh ?? 0),
    legacyChargeRate: c2r(row.legacy),
    electrificationSubsidyRate: c2r(cat.electrificationSubsidy),
    affordabilitySubsidyRate: c2r(cat.affordabilitySubsidy),

    networkCapacityRate: isMegaflex ? (vc?.networkCapacity ?? 0) : (row.networkCapacity ?? 0),
    networkAccessRate: isMegaflex ? (vc?.networkDemandKva ?? 0) : 0,
    generationCapacityRate: row.generationCapacity,
    transmissionNetworkRate: row.transmissionNetwork ?? 0,
    urbanLowVoltageSubsidyRate: vc?.urbanLowVoltageSubsidy ?? 0,

    serviceChargeRate: sa.service,
    adminChargeRate: sa.admin,

    reactiveEnergyChargeHighSeason: c2r(cat.reactiveEnergyHigh),
    reactiveEnergyChargeLowSeason: c2r(cat.reactiveEnergyLow),
  };
}
