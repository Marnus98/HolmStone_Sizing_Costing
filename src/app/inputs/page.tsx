"use client";

import { useProject } from "@/lib/context/ProjectContext";
import { PageHeader, Card, NumberField, TextField } from "@/components/ui";
import { formatDateSA } from "@/lib/format";
import type { MonthlyBillEntry } from "@/lib/calculations/types";

const BILL_COLUMNS: { key: keyof MonthlyBillEntry; label: string; unit: string }[] = [
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
];

export default function InputsPage() {
  const { bills, updateBill, addBillRow, removeBillRow, tariff, setTariff } = useProject();

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

  return (
    <div>
      <PageHeader
        title="Inputs"
        subtitle="Section 1: municipal bill history (manual entry, paste from Excel, or CSV upload). Section 2: tariff structure."
      />

      <Card title="Section 1 - Municipal bill history">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Paste a full table copied from Excel directly into the grid, or upload a CSV (Month, then the same columns in order).
          </p>
          <div className="flex items-center gap-2">
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
                {BILL_COLUMNS.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-2 py-2 font-medium">
                    {c.label}
                    <div className="font-normal text-slate-400">({c.unit})</div>
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody onPaste={handlePaste}>
              {bills.map((bill, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="sticky left-0 whitespace-nowrap bg-white px-2 py-1.5 font-medium text-slate-700">
                    {formatDateSA(bill.month)}
                  </td>
                  {BILL_COLUMNS.map((c) => (
                    <td key={c.key} className="px-1 py-1">
                      <input
                        type="number"
                        value={bill[c.key] as number}
                        onChange={(e) => updateBill(i, { [c.key]: parseFloat(e.target.value) || 0 } as Partial<MonthlyBillEntry>)}
                        className="w-24 rounded border border-slate-200 px-1.5 py-1 text-right focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                  ))}
                  <td>
                    <button onClick={() => removeBillRow(i)} className="px-2 text-slate-400 hover:text-red-500" title="Remove month">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Section 2 - Tariff structure" className="mt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label="Tariff schedule name" value={tariff.tariffName} onChange={(v) => setTariff({ tariffName: v })} />
          <NumberField label="Legacy charge" value={tariff.legacyChargeRate} onChange={(v) => setTariff({ legacyChargeRate: v })} unit="R/kWh" step="0.0001" />
          <NumberField label="Ancillary charge" value={tariff.ancillaryChargeRate} onChange={(v) => setTariff({ ancillaryChargeRate: v })} unit="R/kWh" step="0.0001" />
          <NumberField label="Network demand charge" value={tariff.networkDemandChargeRate} onChange={(v) => setTariff({ networkDemandChargeRate: v })} unit="R/kWh" step="0.0001" />
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
