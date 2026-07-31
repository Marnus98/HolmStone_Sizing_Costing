"use client";

import { useProject } from "@/lib/context/ProjectContext";
import { PageHeader, Card, NumberField, SelectField, ResultTile, Pill, WarningBanner } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { monthLabel } from "@/lib/calculations/consumption";
import { monthlyProductionKwh } from "@/lib/calculations/solarYieldProfile";
import {
  Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 mt-10 border-b border-slate-200 pb-2 first:mt-0">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

export default function SizingPage() {
  const {
    consumption,
    solarAssumptions, setSolarAssumptions,
    batteryAssumptions, setBatteryAssumptions,
    offGridAssumptions, setOffGridAssumptions,
    solarGridTied, solarHybrid, battery, offGrid,
  } = useProject();

  const gridTiedMonthlyProd = monthlyProductionKwh(solarGridTied.recommendedPvKwp, solarAssumptions.annualSpecificYieldKwhPerKwp);
  const gridTiedChart = consumption.monthlyConsumption.map((r, i) => ({
    month: monthLabel(r.month),
    "Consumption (kWh)": Math.round(r.totalKwh),
    "Est. solar production (kWh)": Math.round(gridTiedMonthlyProd[i]),
  }));

  const hybridAnnualYield = solarAssumptions.specificYieldKwhPerKwpPerDay * 365;
  const hybridMonthlyProd = monthlyProductionKwh(solarHybrid.recommendedPvKwp, hybridAnnualYield);
  const hybridChart = consumption.monthlyConsumption.map((r, i) => ({
    month: monthLabel(r.month),
    "Consumption (kWh)": Math.round(r.totalKwh),
    "Est. solar production (kWh)": Math.round(hybridMonthlyProd[i]),
  }));

  const batteryChart = [
    { name: "Worst Month", "Battery (kWh)": battery.recommendedCapacityKwh },
  ];

  return (
    <div>
      <PageHeader
        title="System Sizing"
        subtitle="All three system types are sized in the background from the same consumption data - Solar PV, Hybrid and Off-Grid, shown together below. No need to switch tabs to compare them."
      />

      {/* ================= SOLAR PV (GRID-TIED) ================= */}
      <SectionHeading title="Solar PV (Grid-Tied)" subtitle="Grid-tied solar, no battery. Source: 'Solar Grid Tied Calc' sheet, Solar calc - claude.xlsx." />
      <div className="mb-2"><Pill tone="calculated">Grid-Tied ratio methodology</Pill></div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Assumptions (editable)" className="lg:col-span-1">
          <div className="space-y-4">
            <NumberField
              label="Solar-to-consumption ratio"
              value={solarAssumptions.solarToConsumptionRatioPct}
              onChange={(v) => setSolarAssumptions({ solarToConsumptionRatioPct: v })}
              unit="fraction (0-1)"
              step="0.01"
              tooltip="Target fraction of total average monthly consumption the solar array should supply."
            />
            <NumberField
              label="Annual specific yield"
              value={solarAssumptions.annualSpecificYieldKwhPerKwp}
              onChange={(v) => setSolarAssumptions({ annualSpecificYieldKwhPerKwp: v })}
              unit="kWh/kWp/yr"
              step="1"
            />
            <NumberField label="Panel wattage" value={solarAssumptions.panelWattage} onChange={(v) => setSolarAssumptions({ panelWattage: v })} unit="Wp" />
            <NumberField label="PV rounding step" value={solarAssumptions.capacityRoundingStepKwp} onChange={(v) => setSolarAssumptions({ capacityRoundingStepKwp: v })} unit="kWp" />
          </div>
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card title="Calculated results">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ResultTile label="Average monthly consumption" value={formatNumber(solarGridTied.averageMonthlyConsumptionKwh, 0)} unit="kWh" />
              <ResultTile label="Target monthly solar supply" value={formatNumber(solarGridTied.targetMonthlySolarSupplyKwh, 0)} unit="kWh" />
              <ResultTile label="Required PV array" value={formatNumber(solarGridTied.requiredPvArrayKwp, 2)} unit="kWp" />
            </div>
          </Card>
          <Card title="Recommended solar system size">
            <div className="grid grid-cols-2 gap-4">
              <ResultTile label="Solar PV array size" value={formatNumber(solarGridTied.recommendedPvKwp, 0)} unit="kWp" hint={`${solarGridTied.panelCount} panels`} />
              <ResultTile label="Grid inverter rating" value={formatNumber(solarGridTied.recommendedGridInverterKw, 0)} unit="kW" />
            </div>
          </Card>
          <Card title="Solar production vs. consumption">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={gridTiedChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Consumption (kWh)" fill="#94a3b8" />
                  <Line type="monotone" dataKey="Est. solar production (kWh)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* ================= HYBRID ================= */}
      <SectionHeading title="Hybrid (Solar PV + Battery)" subtitle="Grid-tied solar with battery storage. Source: original Mardale workbook methodology." />
      <div className="mb-2"><Pill tone="calculated">Hybrid daytime-offset methodology</Pill></div>

      <Card title="Battery - Assumptions (editable)" className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField
            label="Sizing scenario"
            value={batteryAssumptions.scenario}
            onChange={(v) => setBatteryAssumptions({ scenario: v, capacityRoundingStepKwh: v === "worst_month" ? 5 : 10 })}
            options={[
              { value: "worst_month", label: "Worst Month (conservative)" },
              { value: "annual_average", label: "Annual Average" },
            ]}
          />
          <NumberField label="Required backup period" value={batteryAssumptions.requiredBackupHours} onChange={(v) => setBatteryAssumptions({ requiredBackupHours: v })} unit="hr/day" />
          <NumberField label="Depth of Discharge" value={batteryAssumptions.depthOfDischarge} onChange={(v) => setBatteryAssumptions({ depthOfDischarge: v })} unit="fraction (0-1)" step="0.01" />
          <NumberField label="Round-trip efficiency" value={batteryAssumptions.roundTripEfficiency} onChange={(v) => setBatteryAssumptions({ roundTripEfficiency: v })} unit="fraction (0-1)" step="0.01" />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Battery - Recommended size" className="lg:col-span-1">
          <div className="space-y-3">
            <ResultTile label="Installed battery capacity" value={formatNumber(battery.recommendedCapacityKwh, 0)} unit="kWh" />
            <ResultTile label="Inverter / PCS rating" value={formatNumber(battery.recommendedInverterKw, 0)} unit="kW" />
            <ResultTile label="Daily discharge energy" value={formatNumber(battery.dailyDischargeEnergyKwh, 1)} unit="kWh" />
          </div>
        </Card>
        <div className="lg:col-span-2">
          <Card title="Battery capacity">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={batteryChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Battery (kWh)" fill="#2563eb" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Solar - Assumptions (editable)" className="lg:col-span-1">
          <div className="space-y-4">
            <NumberField label="Peak Sun Hours" value={solarAssumptions.peakSunHours} onChange={(v) => setSolarAssumptions({ peakSunHours: v })} unit="hr/day" />
            <NumberField label="Panel derating factor" value={solarAssumptions.panelDeratingFactor} onChange={(v) => setSolarAssumptions({ panelDeratingFactor: v })} unit="fraction (0-1)" step="0.01" />
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={solarAssumptions.includeBatteryRecharge}
                onChange={(e) => setSolarAssumptions({ includeBatteryRecharge: e.target.checked })}
              />
              Solar must also recharge the battery daily
            </label>
            <NumberField label="Daytime offset target" value={solarAssumptions.daytimeOffsetTargetPct} onChange={(v) => setSolarAssumptions({ daytimeOffsetTargetPct: v })} unit="fraction (0-1)" step="0.01" />
            <NumberField label="Specific yield" value={solarAssumptions.specificYieldKwhPerKwpPerDay} onChange={(v) => setSolarAssumptions({ specificYieldKwhPerKwpPerDay: v })} unit="kWh/kWp/day" step="0.1" />
          </div>
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card title="Calculated results">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {solarAssumptions.includeBatteryRecharge && (
                <ResultTile label="Daily battery recharge" value={formatNumber(solarHybrid.dailyBatteryRechargeKwh, 1)} unit="kWh" />
              )}
              <ResultTile label="Daytime load to offset" value={formatNumber(solarHybrid.dailyStandardLoadToOffsetKwh, 1)} unit="kWh" />
              <ResultTile label="Total daily solar required" value={formatNumber(solarHybrid.totalDailySolarEnergyRequiredKwh, 1)} unit="kWh" />
            </div>
          </Card>
          <Card title="Recommended solar system size">
            <div className="grid grid-cols-2 gap-4">
              <ResultTile label="Solar PV array size" value={formatNumber(solarHybrid.recommendedPvKwp, 0)} unit="kWp" hint={`${solarHybrid.panelCount} panels`} />
              <ResultTile label="Grid / hybrid inverter rating" value={formatNumber(solarHybrid.recommendedGridInverterKw, 0)} unit="kW" />
            </div>
          </Card>
          <Card title="Solar production vs. consumption">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={hybridChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Consumption (kWh)" fill="#94a3b8" />
                  <Line type="monotone" dataKey="Est. solar production (kWh)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* ================= OFF-GRID ================= */}
      <SectionHeading title="Off-Grid (Solar PV + Battery)" subtitle="No grid connection. Source: 'Off-Grid' sheet, Solar calc - claude.xlsx quick calc, plus generator/warning additions." />
      <div className="mb-2"><Pill tone="calculated">Reference quick-calc methodology</Pill></div>

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
            />
            <NumberField
              label="Install margin (usable -> installed)"
              value={offGridAssumptions.batteryInstallMarginMultiplier}
              onChange={(v) => setOffGridAssumptions({ batteryInstallMarginMultiplier: v })}
              unit="multiplier"
              step="0.01"
            />
            <NumberField label="Solar Peak Sun Hours" value={offGridAssumptions.solarPeakSunHours} onChange={(v) => setOffGridAssumptions({ solarPeakSunHours: v })} unit="hr/day" step="0.1" />
            <NumberField label="Solar derating factor" value={offGridAssumptions.solarDeratingFactor} onChange={(v) => setOffGridAssumptions({ solarDeratingFactor: v })} unit="fraction (0-1)" step="0.01" />
            <NumberField label="Solar safety margin" value={offGridAssumptions.solarMarginMultiplier} onChange={(v) => setOffGridAssumptions({ solarMarginMultiplier: v })} unit="multiplier" step="0.01" />
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input type="checkbox" checked={offGridAssumptions.generatorIncluded} onChange={(e) => setOffGridAssumptions({ generatorIncluded: e.target.checked })} />
              Include generator backup
            </label>
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
              <ResultTile label="Estimated worst-month production" value={formatNumber(offGrid.worstMonthProductionKwh, 0)} unit="kWh" />
              <ResultTile label="That month's actual demand" value={formatNumber(offGrid.worstMonthDemandKwh, 0)} unit="kWh" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
