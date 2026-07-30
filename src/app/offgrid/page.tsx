"use client";

import { useProject } from "@/lib/context/ProjectContext";
import { PageHeader, Card, NumberField, ResultTile, WarningBanner, Pill } from "@/components/ui";
import { formatNumber } from "@/lib/format";

export default function OffGridSizingPage() {
  const { systemType, offGridAssumptions, setOffGridAssumptions, offGrid } = useProject();

  if (systemType !== "off_grid") {
    return (
      <div>
        <PageHeader title="Off-Grid Sizing" />
        <Card>
          <p className="text-sm text-slate-500">
            Only applicable when System Type is set to &quot;Off-grid solar PV and battery system&quot; on the Project
            Details page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Off-Grid Sizing"
        subtitle="Quick-calc methodology - source: 'Off-Grid' sheet, Solar calc - claude.xlsx. Generator, inverter/PCS sizing and the undersized-warning are app-level additions layered on top."
      />

      <div className="mb-4">
        <Pill tone="calculated">Reference quick-calc methodology</Pill>
      </div>

      {offGrid.isUndersizedWarning && <WarningBanner>{offGrid.undersizedReason}</WarningBanner>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Assumptions (editable)" className="lg:col-span-1">
          <div className="space-y-4">
            <NumberField
              label="Battery coverage ratio"
              value={offGridAssumptions.batteryCoverageRatio}
              onChange={(v) => setOffGridAssumptions({ batteryCoverageRatio: v })}
              unit="fraction (0-1)"
              step="0.01"
              tooltip="Usable battery energy as a fraction of one day's average total consumption. Source sheet default 0.85 - the sheet does not label what this factor represents; treat as provisional pending confirmation."
            />
            <NumberField
              label="Install margin (usable -> installed)"
              value={offGridAssumptions.batteryInstallMarginMultiplier}
              onChange={(v) => setOffGridAssumptions({ batteryInstallMarginMultiplier: v })}
              unit="multiplier"
              step="0.01"
              tooltip="Uprates usable battery energy to installed capacity. Source sheet default 1.2 (implies ~83% effective usable fraction)."
            />
            <NumberField label="Solar Peak Sun Hours" value={offGridAssumptions.solarPeakSunHours} onChange={(v) => setOffGridAssumptions({ solarPeakSunHours: v })} unit="hr/day" step="0.1" />
            <NumberField label="Solar derating factor" value={offGridAssumptions.solarDeratingFactor} onChange={(v) => setOffGridAssumptions({ solarDeratingFactor: v })} unit="fraction (0-1)" step="0.01" />
            <NumberField label="Solar safety margin" value={offGridAssumptions.solarMarginMultiplier} onChange={(v) => setOffGridAssumptions({ solarMarginMultiplier: v })} unit="multiplier" step="0.01" />
            <NumberField label="Panel wattage" value={offGridAssumptions.panelWattage} onChange={(v) => setOffGridAssumptions({ panelWattage: v })} unit="Wp" />

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Equipment selection (app addition)</p>
              <div className="space-y-4">
                <NumberField label="Estimated peak load" value={offGridAssumptions.estimatedPeakLoadKw} onChange={(v) => setOffGridAssumptions({ estimatedPeakLoadKw: v })} unit="kW" tooltip="For battery inverter/PCS sizing - not part of the reference quick calc." />
                <NumberField label="Design safety margin" value={offGridAssumptions.designMarginFactor} onChange={(v) => setOffGridAssumptions({ designMarginFactor: v })} unit="multiplier" step="0.01" />
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <input type="checkbox" checked={offGridAssumptions.generatorIncluded} onChange={(e) => setOffGridAssumptions({ generatorIncluded: e.target.checked })} />
                  Include generator backup
                </label>
                {offGridAssumptions.generatorIncluded && (
                  <>
                    <NumberField label="Generator rated size" value={offGridAssumptions.generatorRatedKva} onChange={(v) => setOffGridAssumptions({ generatorRatedKva: v })} unit="kVA" />
                    <NumberField label="Generator power factor" value={offGridAssumptions.generatorPowerFactor} onChange={(v) => setOffGridAssumptions({ generatorPowerFactor: v })} unit="fraction (0-1)" step="0.01" />
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Calculated results">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ResultTile label="Daily average consumption" value={formatNumber(offGrid.dailyAverageTotalKwh, 1)} unit="kWh" />
              <ResultTile label="BESS usable energy" value={formatNumber(offGrid.usableBatteryEnergyKwh, 1)} unit="kWh" />
              <ResultTile label="BESS installed energy" value={formatNumber(offGrid.installedBatteryEnergyKwh, 1)} unit="kWh" />
            </div>
          </Card>

          <Card title="Recommended system size">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <ResultTile label="Battery capacity" value={formatNumber(offGrid.recommendedBatteryCapacityKwh, 0)} unit="kWh" />
              <ResultTile label="Battery inverter rating" value={formatNumber(offGrid.recommendedBatteryInverterKw, 0)} unit="kW" />
              <ResultTile label="Solar PV array" value={formatNumber(offGrid.recommendedPvKwp, 0)} unit="kWp" hint={`${offGrid.panelCount} panels`} />
              <ResultTile label="Generator" value={formatNumber(offGrid.generatorRequiredKva, 0)} unit="kVA" hint={offGridAssumptions.generatorIncluded ? "Included" : "Suggested minimum - not included"} />
            </div>
          </Card>

          <Card title="Worst-month reality check">
            <div className="grid grid-cols-2 gap-4">
              <ResultTile
                label="Estimated worst-month production"
                value={formatNumber(offGrid.worstMonthProductionKwh, 0)}
                unit="kWh"
                hint="Using the non-linear seasonal yield profile (kWhkWp sheet) at the recommended PV size"
              />
              <ResultTile
                label="That month's actual demand"
                value={formatNumber(offGrid.worstMonthDemandKwh, 0)}
                unit="kWh"
                hint="From the site's real metered Section 3 data"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
