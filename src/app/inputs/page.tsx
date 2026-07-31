"use client";

import { useMemo, useState } from "react";
import { useProject } from "@/lib/context/ProjectContext";
import { PageHeader, Card, NumberField, TextField, SelectField, Pill } from "@/components/ui";
import { formatDateSA, formatZAR } from "@/lib/format";
import { computeBillRowTotals, daysInMonth } from "@/lib/calculations/consumption";
import type { MonthlyBillEntry } from "@/lib/calculations/types";
import {
  TARIFF_META,
  availableZones,
  availableVoltages,
  availableCustomerCategories,
  resolveEskomTariff,
  LANDRATE,
} from "@/lib/tariffs";
import type { EskomTariffId } from "@/lib/tariffs";

const BILL_COLUMNS: { key: keyof MonthlyBillEntry; label: string; unit: string; advanced?: boolean }[] = [
  { key: "peakLowKwh", label: "Peak (Low)", unit: "kWh" },
  { key: "peakLowRate", label: "Peak Rate (Low)", unit: "R/kWh" },
  { key: "peakHighKwh", label: "Peak (High)", unit: "kWh" },
  { key: "peakHighRate", label: "Peak Rate (High)", unit: "R/kWh" },
  { key: "offPeakLowKwh", label: "Off-Peak (Low)", unit: "kWh" },
  { key: "offPeakLowRate", label: "Off-Peak Rate (Low)", unit: "R/kWh" },
  { key: "offPeakHighKwh", label: "Off-Peak (High)", unit: "kWh" },
  { key: "offPeakHighRate", label: "Off-Peak Rate (High)", unit: "R/kWh" },
  { key: "standardLowKwh", label: "Standard (Low)", unit: "kWh" },
  { key: "standardLowRate", label: "Standard Rate (Low)", unit: "R/kWh" },
  { key: "standardHighKwh", label: "Standard (High)", unit: "kWh" },
  { key: "standardHighRate", label: "Standard Rate (High)", unit: "R/kWh" },
  { key: "networkCapacityKva", label: "Network Capacity", unit: "kVA" },
  { key: "networkCapacityRate", label: "Network Capacity Rate", unit: "R/kVA" },
  { key: "networkAccessRate", label: "Network Access Rate", unit: "R/kVA" },
  { key: "ancillaryChargeRate", label: "Ancillary Charge", unit: "R/kWh" },
  { key: "networkDemandChargeRate", label: "Network Demand Charge", unit: "R/kWh" },
  { key: "legacyChargeRate", label: "Legacy Charge", unit: "R/kWh" },
  { key: "adminCharge", label: "Admin Charge", unit: "R" },
  { key: "serviceCharge", label: "Service Charge", unit: "R" },
  { key: "generationCapacityRate", label: "Generation Capacity", unit: "R/kVA", advanced: true },
  { key: "transmissionNetworkRate", label: "Transmission Network", unit: "R/kVA", advanced: true },
  { key: "urbanLowVoltageSubsidyRate", label: "Urban LV Subsidy", unit: "R/kVA", advanced: true },
  { key: "electrificationSubsidyRate", label: "Electrification Subsidy", unit: "R/kWh", advanced: true },
  { key: "affordabilitySubsidyRate", label: "Affordability Subsidy", unit: "R/kWh", advanced: true },
  { key: "reactiveEnergyKvarh", label: "Reactive Energy", unit: "kVArh", advanced: true },
  { key: "reactiveEnergyRate", label: "Reactive Energy Rate", unit: "R/kVArh", advanced: true },
];

export default function InputsPage() {
  const { bills, updateBill, addBillRow, removeBillRow, tariff, setTariff } = useProject();
  const [showAdvancedCols, setShowAdvancedCols] = useState(false);

  // --- Eskom tariff selector state ---
  const [tariffId, setTariffId] = useState<EskomTariffId>("ruraflex");
  const [zone, setZone] = useState<number | null>(null);
  const [voltage, setVoltage] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [landrateVariant, setLandrateVariant] = useState<string>(LANDRATE[0].name);

  const meta = TARIFF_META.find((m) => m.id === tariffId)!;
  const zones = useMemo(() => availableZones(tariffId), [tariffId]);
  const voltages = useMemo(() => (zone !== null ? availableVoltages(tariffId, zone) : []), [tariffId, zone]);
  const categories = useMemo(() => availableCustomerCategories(tariffId), [tariffId]);

  const resolved = useMemo(() => {
    if (tariffId === "landrate") {
      return resolveEskomTariff({ tariffId, landrateVariant });
    }
    if (zone === null || voltage === null) return null;
    return resolveEskomTariff({ tariffId, zone, voltage, customerCategory: category ?? categories[0] });
  }, [tariffId, zone, voltage, category, categories, landrateVariant]);

  function handleTariffChange(id: EskomTariffId) {
    setTariffId(id);
    setZone(null);
    setVoltage(null);
    setCategory(null);
  }

  function applyTariffToAllMonths() {
    if (!resolved) return;

    bills.forEach((bill, i) => {
      const days = daysInMonth(bill.month);
      const patch: Partial<MonthlyBillEntry> = {
        peakLowRate: resolved.peakLowRate,
        peakHighRate: resolved.peakHighRate,
        offPeakLowRate: resolved.offPeakLowRate,
        offPeakHighRate: resolved.offPeakHighRate,
        standardLowRate: resolved.standardLowRate,
        standardHighRate: resolved.standardHighRate,
        networkCapacityRate: resolved.networkCapacityRate,
        networkAccessRate: resolved.networkAccessRate,
        ancillaryChargeRate: resolved.ancillaryChargeRate,
        networkDemandChargeRate: resolved.networkDemandChargeRate,
        legacyChargeRate: resolved.legacyChargeRate,
        adminCharge: resolved.adminChargeRate * days,
        serviceCharge: resolved.serviceChargeRate * days,
        generationCapacityRate: resolved.generationCapacityRate,
        transmissionNetworkRate: resolved.transmissionNetworkRate,
        urbanLowVoltageSubsidyRate: resolved.urbanLowVoltageSubsidyRate,
        electrificationSubsidyRate: resolved.electrificationSubsidyRate,
        affordabilitySubsidyRate: resolved.affordabilitySubsidyRate,
        reactiveEnergyRate: resolved.reactiveEnergyChargeHighSeason, // high-season default; override per-row if the site's low-season reactive use matters
      };
      updateBill(i, patch);
    });

    setTariff({
      tariffName: `ESKOM - ${resolved.label}`,
      legacyChargeRate: resolved.legacyChargeRate,
      ancillaryChargeRate: resolved.ancillaryChargeRate,
      networkDemandChargeRate: resolved.networkDemandChargeRate,
      reactiveEnergyChargeHighSeason: resolved.reactiveEnergyChargeHighSeason,
      reactiveEnergyChargeLowSeason: resolved.reactiveEnergyChargeLowSeason,
      highSeasonStandardTariff: resolved.standardHighRate,
      lowSeasonStandardTariff: resolved.standardLowRate,
      highSeasonOffPeakTariff: resolved.offPeakHighRate,
      lowSeasonOffPeakTariff: resolved.offPeakLowRate,
      highSeasonPeakTariff: resolved.peakHighRate,
      lowSeasonPeakTariff: resolved.peakLowRate,
    });
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTableSectionElement>) {
    // Section 1 requirement: allow pasting a full table copied from Excel.
    // Expects rows of tab-separated values in the same column order as BILL_COLUMNS,
    // one row per month, starting at the row that was focused.
    const text = e.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return; // let normal single-cell paste through
    e.preventDefault();
    const rows = text.trim().split("\n").map((r) => r.split("\t"));
    rows.forEach((row, i) => {
      if (i >= bills.length) return;
      const patch: Partial<MonthlyBillEntry> = {};
      row.forEach((cell, j) => {
        const col = BILL_COLUMNS[j];
        if (col) (patch as Record<string, number>)[col.key] = parseFloat(cell) || 0;
      });
      updateBill(i, patch);
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const lines = text.trim().split("\n").map((l) => l.split(","));
      const dataLines = lines[0]?.[0]?.toLowerCase().includes("month") ? lines.slice(1) : lines;
      dataLines.forEach((row, i) => {
        if (i >= bills.length) return;
        const patch: Partial<MonthlyBillEntry> = {};
        row.slice(1).forEach((cell, j) => {
          const col = BILL_COLUMNS[j];
          if (col) (patch as Record<string, number>)[col.key] = parseFloat(cell) || 0;
        });
        updateBill(i, patch);
      });
    };
    reader.readAsText(file);
  }

  const visibleColumns = BILL_COLUMNS.filter((c) => showAdvancedCols || !c.advanced);
  const rowTotals = bills.map((b) => computeBillRowTotals(b));
  const annualTotalR = rowTotals.reduce((s, t) => s + t.totalBillR, 0);
  const annualKwh = rowTotals.reduce((s, t) => s + t.totalKwh, 0);

  return (
    <div>
      <PageHeader
        title="Inputs"
        subtitle="Section 1: municipal bill history (manual entry, paste from Excel, or CSV upload). Section 2: tariff structure."
      />

      <Card title="Eskom tariff selector">
        <p className="mb-4 text-xs text-slate-500">
          Pick the Non-Local-Authority (direct Eskom) tariff, transmission zone and voltage - the full rate breakdown
          (energy, network, ancillary, legacy, service/admin, and more) auto-fills below. You only need to enter the
          kWh consumption per Peak/Standard/Off-Peak x High/Low season column; costs compute automatically.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField
            label="Tariff"
            value={tariffId}
            onChange={handleTariffChange}
            options={TARIFF_META.map((m) => ({ value: m.id, label: m.label }))}
          />
          {meta.hasZoneVoltage ? (
            <>
              <SelectField
                label="Transmission zone"
                value={zone === null ? "" : String(zone)}
                onChange={(v) => { setZone(v === "" ? null : Number(v)); setVoltage(null); }}
                options={[{ value: "", label: "Select..." }, ...zones.map((z) => ({ value: String(z.zone), label: z.label }))]}
              />
              <SelectField
                label="Voltage"
                value={voltage === null ? "" : String(voltage)}
                onChange={(v) => setVoltage(v === "" ? null : Number(v))}
                options={[{ value: "", label: "Select..." }, ...voltages.map((v) => ({ value: String(v.voltage), label: v.label }))]}
              />
              <SelectField
                label="Customer category (kVA band)"
                value={category ?? categories[0] ?? ""}
                onChange={setCategory}
                options={categories.map((c) => ({ value: c, label: c }))}
                tooltip="Determines the daily Service and Administration charge tier."
              />
            </>
          ) : (
            <SelectField
              label="Landrate variant"
              value={landrateVariant}
              onChange={setLandrateVariant}
              options={LANDRATE.map((l) => ({ value: l.name, label: l.name }))}
              tooltip="Landrate has no Time-of-Use split and no transmission zone/voltage selection."
            />
          )}
        </div>

        {!meta.hasTou && (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {meta.id === "nightsave_rural"
              ? "Nightsave Rural has a single energy rate per season (no Peak/Standard/Off-Peak split). Enter total monthly consumption in the Standard (High)/Standard (Low) columns below and leave Peak/Off-Peak at 0."
              : "Landrate has no Time-of-Use split at all. Enter total monthly consumption in the Standard (High) column below (Low-season columns can stay 0, since Landrate doesn't distinguish seasons either)."}
          </p>
        )}

        {resolved && (
          <div className="mt-4 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="text-xs text-blue-900">
              <span className="font-semibold">{resolved.label}</span> (billcode {resolved.billcode}) - rates ready to
              apply to all {bills.length} month(s) below.
            </div>
            <button
              onClick={applyTariffToAllMonths}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Apply to all months
            </button>
          </div>
        )}
        <p className="mt-2 text-[11px] text-slate-400">
          Source: Eskom NLA tariff book, 1 April 2026, rates excl. VAT. Applying overwrites every month&apos;s rate
          columns (not consumption) and Section 2 below - re-apply after changing the selection.
        </p>
      </Card>

      <Card title="Section 1 - Municipal bill history" className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Paste a full table copied from Excel directly into the grid, or upload a CSV (Month, then the same columns in order).
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedCols((v) => !v)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {showAdvancedCols ? "Hide" : "Show"} additional Eskom charges
            </button>
            <label className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              Upload CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </label>
            <button onClick={addBillRow} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              + Add month
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-max text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="sticky left-0 bg-white px-2 py-2 font-medium">Month</th>
                {visibleColumns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-2 py-2 font-medium">
                    {c.label}
                    <div className="font-normal text-slate-400">({c.unit})</div>
                  </th>
                ))}
                <th className="whitespace-nowrap px-2 py-2 font-medium">
                  Total bill <div className="font-normal text-slate-400">(R)</div>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody onPaste={handlePaste}>
              {bills.map((bill, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="sticky left-0 whitespace-nowrap bg-white px-2 py-1.5 font-medium text-slate-700">
                    {formatDateSA(bill.month)}
                  </td>
                  {visibleColumns.map((c) => (
                    <td key={c.key} className="px-1 py-1">
                      <input
                        type="number"
                        value={(bill[c.key] as number) ?? 0}
                        onChange={(e) => updateBill(i, { [c.key]: parseFloat(e.target.value) || 0 } as Partial<MonthlyBillEntry>)}
                        className="w-24 rounded border border-slate-200 px-1.5 py-1 text-right focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-2 py-1.5 text-right font-medium text-slate-700">
                    {formatZAR(rowTotals[i].totalBillR, 2)}
                  </td>
                  <td>
                    <button onClick={() => removeBillRow(i)} className="px-2 text-slate-400 hover:text-red-500" title="Remove month">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-semibold text-slate-700">
                <td className="sticky left-0 bg-white px-2 py-2">Annual total</td>
                <td colSpan={visibleColumns.length} className="px-2 py-2 text-right text-slate-500">
                  {annualKwh.toLocaleString("en-ZA", { maximumFractionDigits: 0 })} kWh
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-right">{formatZAR(annualTotalR, 2)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Total bill = energy (Peak+Standard+Off-Peak x rate) + network capacity/access x kVA + ancillary/network
          demand/legacy x kWh + admin + service, plus generation capacity/transmission/urban-LV-subsidy x kVA,
          electrification/affordability subsidy x kWh, and reactive energy x kVArh where applicable.
        </p>
      </Card>

      <Card title="Section 2 - Tariff structure" className="mt-6">
        <div className="mb-3">
          <Pill tone="calculated">Auto-filled by the tariff selector above - editable</Pill>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label="Tariff schedule name" value={tariff.tariffName} onChange={(v) => setTariff({ tariffName: v })} />
          <NumberField label="Legacy charge" value={tariff.legacyChargeRate} onChange={(v) => setTariff({ legacyChargeRate: v })} unit="R/kWh" step="0.0001" />
          <NumberField label="Ancillary charge" value={tariff.ancillaryChargeRate} onChange={(v) => setTariff({ ancillaryChargeRate: v })} unit="R/kWh" step="0.0001" />
          <NumberField label="Network demand charge" value={tariff.networkDemandChargeRate} onChange={(v) => setTariff({ networkDemandChargeRate: v })} unit="R/kWh" step="0.0001" />
          <NumberField label="Reactive energy (high season)" value={tariff.reactiveEnergyChargeHighSeason} onChange={(v) => setTariff({ reactiveEnergyChargeHighSeason: v })} unit="R/kVArh" step="0.0001" />
          <NumberField label="Reactive energy (low season)" value={tariff.reactiveEnergyChargeLowSeason} onChange={(v) => setTariff({ reactiveEnergyChargeLowSeason: v })} unit="R/kVArh" step="0.0001" />
          <NumberField label="High season Standard tariff" value={tariff.highSeasonStandardTariff} onChange={(v) => setTariff({ highSeasonStandardTariff: v })} unit="R/kWh" step="0.0001" />
          <NumberField label="Low season Standard tariff" value={tariff.lowSeasonStandardTariff} onChange={(v) => setTariff({ lowSeasonStandardTariff: v })} unit="R/kWh" step="0.0001" />
          <NumberField label="High season Off-Peak tariff" value={tariff.highSeasonOffPeakTariff} onChange={(v) => setTariff({ highSeasonOffPeakTariff: v })} unit="R/kWh" step="0.0001" />
          <NumberField label="Low season Off-Peak tariff" value={tariff.lowSeasonOffPeakTariff} onChange={(v) => setTariff({ lowSeasonOffPeakTariff: v })} unit="R/kWh" step="0.0001" />
          <NumberField label="High season Peak tariff" value={tariff.highSeasonPeakTariff} onChange={(v) => setTariff({ highSeasonPeakTariff: v })} unit="R/kWh" step="0.0001" />
          <NumberField label="Low season Peak tariff" value={tariff.lowSeasonPeakTariff} onChange={(v) => setTariff({ lowSeasonPeakTariff: v })} unit="R/kWh" step="0.0001" />
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Eskom High Demand Season is currently fixed to Jun/Jul/Aug (RuraFlex definition). Blended tariffs shown on the
          Consumption Analysis page are calculated automatically from these values.
        </p>
      </Card>
    </div>
  );
}
