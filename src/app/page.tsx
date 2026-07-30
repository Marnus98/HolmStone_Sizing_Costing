"use client";

import { useProject } from "@/lib/context/ProjectContext";
import { PageHeader, Card, TextField, SelectField, ResultTile } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import type { SystemType } from "@/lib/calculations/types";

const SYSTEM_TYPE_OPTIONS: { value: SystemType; label: string }[] = [
  { value: "hybrid", label: "Hybrid solar PV and battery system" },
  { value: "off_grid", label: "Off-grid solar PV and battery system" },
  { value: "solar_pv_only", label: "Solar PV-only system" },
];

const SYSTEM_TYPE_BLURB: Record<SystemType, string> = {
  hybrid: "Solar PV + battery storage, connected to the grid. Battery charges from solar and/or grid, offsets peak-period cost and provides limited backup.",
  off_grid: "Solar PV + battery storage with no normal grid supply. Sized for a required autonomy period, with optional generator backup.",
  solar_pv_only: "Grid-tied solar PV, no battery. Daytime self-consumption offset only - battery sizing, storage and off-grid modules are hidden.",
};

export default function ProjectDetailsPage() {
  const { projectName, setProjectName, farmSiteName, setFarmSiteName, systemType, setSystemType, consumption, battery, solar, resetToMardaleDemo } = useProject();

  return (
    <div>
      <PageHeader
        title="Project Details"
        subtitle="Phase 1 demo - seeded with the real Mardale Apple Farm billing data from the source workbook."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Project">
          <div className="space-y-4">
            <TextField label="Project name" value={projectName} onChange={setProjectName} />
            <TextField label="Farm / site name" value={farmSiteName} onChange={setFarmSiteName} />
            <SelectField
              label="System type"
              value={systemType}
              onChange={setSystemType}
              options={SYSTEM_TYPE_OPTIONS}
              tooltip="Drives which sections and calculations are shown throughout the app."
            />
            <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">{SYSTEM_TYPE_BLURB[systemType]}</p>
            <button
              onClick={resetToMardaleDemo}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Reset to Mardale Apple Farm demo data
            </button>
          </div>
        </Card>

        <Card title="Quick summary">
          <div className="grid grid-cols-2 gap-3">
            <ResultTile label="Annual consumption" value={formatNumber(consumption.annualConsumptionKwh, 0)} unit="kWh" />
            <ResultTile label="Annual electricity cost" value={formatNumber(consumption.annualCostR, 0)} unit="R" />
            {systemType !== "solar_pv_only" && (
              <ResultTile label="Recommended battery" value={formatNumber(battery.recommendedCapacityKwh, 0)} unit="kWh" />
            )}
            <ResultTile label="Recommended PV" value={formatNumber(solar.recommendedPvKwp, 0)} unit="kWp" />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Full sizing detail is on the Battery Sizing / Solar Sizing pages. Values recalculate automatically as you edit inputs.
          </p>
        </Card>
      </div>

      <Card title="What's built in Phase 1" className="mt-6">
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li>Section 1 &amp; 2 input capture (municipal bill history + tariff structure)</li>
          <li>Section 3 &amp; 4 auto-calculated consumption and cost analysis, with graphs</li>
          <li>Battery Sizing (Worst-Month and Annual-Average scenarios)</li>
          <li>Solar Sizing (Hybrid and Solar PV-only)</li>
          <li>Off-Grid Sizing (new methodology, with undersized-system warning)</li>
          <li>All calculations validated against the source workbook&apos;s own numbers (see docs/assumptions.md)</li>
        </ul>
        <p className="mt-3 text-sm text-slate-500">
          Not yet built (Phase 2/3 per the agreed plan): database persistence, login/roles, multi-project &amp; version
          history, supplier cost import, itemised BOQ costing, LCOE/financials, PDF/Excel reports.
        </p>
      </Card>
    </div>
  );
}
