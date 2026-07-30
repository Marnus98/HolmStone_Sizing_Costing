"use client";

import { useProject } from "@/lib/context/ProjectContext";
import { PageHeader, Card, NumberField, SelectField, ResultTile } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import { monthLabel } from "@/lib/calculations/consumption";
import {
  BarChart, Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function SolarSizingPage() {
  const { solarAssumptions, setSolarAssumptions, solar, consumption, systemType } = useProject();

  const productionVsConsumption = consumption.monthlyConsumption.map((r) => ({
    month: monthLabel(r.month),
    "Consumption (kWh)": Math.round(r.totalKwh),
    "Est. solar production (kWh)": Math.round((solar.recommendedPvKwp * solarAssumptions.specificYieldKwhPerKwpPerDay * 30.4)),
  }));

  return (
    <div>
      <PageHeader
        title="Solar Sizing"
        subtitle="Pulls consumption/load data from Inputs & Consumption Analysis. Recalculates automatically when upstream inputs change."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Assumptions (editable)" className="lg:col-span-1">
          <div className="space-y-4">
            <NumberField label="Peak Sun Hours" value={solarAssumptions.peakSunHours} onChange={(v) => setSolarAssumptions({ peakSunHours: v })} unit="hr/day" />
            <NumberField label="Panel derating factor" value={solarAssumptions.panelDeratingFactor} onChange={(v) => setSolarAssumptions({ panelDeratingFactor: v })} unit="fraction (0-1)" step="0.01" />
            <NumberField label="Inverter efficiency" value={solarAssumptions.inverterEfficiency} onChange={(v) => setSolarAssumptions({ inverterEfficiency: v })} unit="fraction (0-1)" step="0.01" />
            {systemType !== "solar_pv_only" && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={solarAssumptions.includeBatteryRecharge}
                  onChange={(e) => setSolarAssumptions({ includeBatteryRecharge: e.target.checked })}
                />
                Solar must also recharge the battery daily
              </label>
            )}
            <NumberField label="Daytime offset target" value={solarAssumptions.daytimeOffsetTargetPct} onChange={(v) => setSolarAssumptions({ daytimeOffsetTargetPct: v })} unit="fraction (0-1)" step="0.01" tooltip="Target share of daytime Standard-rate load solar should cover." />
            <NumberField label="Specific yield" value={solarAssumptions.specificYieldKwhPerKwpPerDay} onChange={(v) => setSolarAssumptions({ specificYieldKwhPerKwpPerDay: v })} unit="kWh/kWp/day" step="0.1" />
            <NumberField label="Panel wattage" value={solarAssumptions.panelWattage} onChange={(v) => setSolarAssumptions({ panelWattage: v })} unit="Wp" />
            <SelectField
              label="Mounting type"
              value={solarAssumptions.mountingType}
              onChange={(v) => setSolarAssumptions({ mountingType: v })}
              options={[
                { value: "roof_mount", label: "Roof-mounted" },
                { value: "ground_mount", label: "Ground-mounted" },
              ]}
            />
            <NumberField label="PV rounding step" value={solarAssumptions.capacityRoundingStepKwp} onChange={(v) => setSolarAssumptions({ capacityRoundingStepKwp: v })} unit="kWp" />
            <NumberField label="Grid inverter rounding step" value={solarAssumptions.gridInverterRoundingStepKw} onChange={(v) => setSolarAssumptions({ gridInverterRoundingStepKw: v })} unit="kW" />
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Calculated results">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {solarAssumptions.includeBatteryRecharge && (
                <ResultTile label="Daily battery recharge" value={formatNumber(solar.dailyBatteryRechargeKwh, 1)} unit="kWh" />
              )}
              <ResultTile label="Daytime load to offset" value={formatNumber(solar.dailyStandardLoadToOffsetKwh, 1)} unit="kWh" />
              <ResultTile label="Total daily solar required" value={formatNumber(solar.totalDailySolarEnergyRequiredKwh, 1)} unit="kWh" />
              <ResultTile label="Required PV array" value={formatNumber(solar.requiredPvArrayKwp, 2)} unit="kWp" />
              <ResultTile label="Panel count" value={formatNumber(solar.panelCount, 0)} />
              <ResultTile label="Actual installed (pre-rounding)" value={formatNumber(solar.actualInstalledKwp, 2)} unit="kWp" />
            </div>
          </Card>

          <Card title="Recommended solar system size">
            <div className="grid grid-cols-2 gap-4">
              <ResultTile label="Solar PV array size" value={formatNumber(solar.recommendedPvKwp, 0)} unit="kWp" />
              <ResultTile label="Grid / hybrid inverter rating" value={formatNumber(solar.recommendedGridInverterKw, 0)} unit="kW" hint="Sized off historical peak network-capacity (kVA) demand" />
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Annual production estimate: {formatNumber(solar.recommendedPvKwp * solarAssumptions.specificYieldKwhPerKwpPerDay * 365, 0)} kWh/yr
              at {solarAssumptions.specificYieldKwhPerKwpPerDay} kWh/kWp/day.
            </p>
          </Card>

          <Card title="Solar production vs. electrical consumption (estimated)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={productionVsConsumption}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: "kWh", angle: -90, position: "insideLeft", fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Consumption (kWh)" fill="#94a3b8" />
                  <Line type="monotone" dataKey="Est. solar production (kWh)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Production estimate uses a flat monthly average (specific yield x 30.4 days) - seasonal irradiance
              variation is not yet modelled; refine with monthly PSH data in a future iteration.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
