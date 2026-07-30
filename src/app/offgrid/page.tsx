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
        subtitle="New HolmStone methodology - not present in the source workbook. Pending engineering review before being treated as authoritative."
      />

      <div className="mb-4">
        <Pill tone="warning">New methodology - pending review</Pill>
      </div>

      {offGrid.isUndersizedWarning && <WarningBanner>{offGrid.undersizedReason}</WarningBanner>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Assumptions (editable)" className="lg:col-span-1">
          <div className="space-y-4">
            <NumberField label="Critical load" value={offGridAssumptions.criticalLoadKw} onChange={(v) => setOffGridAssumptions({ criticalLoadKw: v })} unit="kW" tooltip="Must-run load that always needs power." />
            <NumberField label="Non-critical load" value={offGridAssumptions.nonCriticalLoadKw} onChange={(v) => setOffGridAssumptions({ nonCriticalLoadKw: v })} unit="kW" tooltip="Deferrable / load-shed-first load." />
            <NumberField label="Required autonomy" value={offGridAssumptions.requiredAutonomyDays} onChange={(v) => setOffGridAssumptions({ requiredAutonomyDays: v })} unit="days" step="0.1" tooltip="Days the battery alone must cover the critical load with zero solar." />
            <NumberField label="Minimum SOC reserve" value={offGridAssumptions.minimumStateOfChargeReservePct} onChange={(v) => setOffGridAssumptions({ minimumStateOfChargeReservePct: v })} unit="fraction (0-1)" step="0.01" />
            <NumberField label="Depth of Discharge" value={offGridAssumptions.depthOfDischarge} onChange={(v) => setOffGridAssumptions({ depthOfDischarge: v })} unit="fraction (0-1)" step="0.01" />
            <NumberField label="Round-trip efficiency" value={offGridAssumptions.roundTripEfficiency} onChange={(v) => setOffGridAssumptions({ roundTripEfficiency: v })} unit="fraction (0-1)" step="0.01" />
            <NumberField label="Design safety margin" value={offGridAssumptions.designMarginFactor} onChange={(v) => setOffGridAssumptions({ designMarginFactor: v })} unit="multiplier" step="0.01" />
            <NumberField label="Worst-month Peak Sun Hours" value={offGridAssumptions.peakSunHoursWorstMonth} onChange={(v) => setOffGridAssumptions({ peakSunHoursWorstMonth: v })} unit="hr/day" step="0.1" />
            <NumberField label="Panel derating factor" value={offGridAssumptions.panelDeratingFactor} onChange={(v) => setOffGridAssumptions({ panelDeratingFactor: v })} unit="fraction (0-1)" step="0.01" />
            <NumberField label="Worst-month specific yield" value={offGridAssumptions.specificYieldKwhPerKwpPerDayWorstMonth} onChange={(v) => setOffGridAssumptions({ specificYieldKwhPerKwpPerDayWorstMonth: v })} unit="kWh/kWp/day" step="0.1" />
            <NumberField label="Panel wattage" value={offGridAssumptions.panelWattage} onChange={(v) => setOffGridAssumptions({ panelWattage: v })} unit="Wp" />
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
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Calculated results">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ResultTile label="Critical daily energy" value={formatNumber(offGrid.criticalDailyEnergyKwh, 1)} unit="kWh" />
              <ResultTile label="Total daily energy" value={formatNumber(offGrid.totalDailyEnergyKwh, 1)} unit="kWh" />
              <ResultTile label="Usable battery energy required" value={formatNumber(offGrid.usableBatteryEnergyRequiredKwh, 1)} unit="kWh" />
              <ResultTile label="Gross battery capacity required" value={formatNumber(offGrid.grossBatteryCapacityRequiredKwh, 1)} unit="kWh" />
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
        </div>
      </div>
    </div>
  );
}
