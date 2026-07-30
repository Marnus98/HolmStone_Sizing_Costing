"use client";

import { useProject } from "@/lib/context/ProjectContext";
import { PageHeader, Card, NumberField, SelectField, ResultTile } from "@/components/ui";
import { formatNumber } from "@/lib/format";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function BatterySizingPage() {
  const { batteryAssumptions, setBatteryAssumptions, battery, batteryAlt, systemType } = useProject();

  if (systemType === "solar_pv_only") {
    return (
      <div>
        <PageHeader title="Battery Sizing" />
        <Card>
          <p className="text-sm text-slate-500">
            Not applicable for a Solar PV-only system. No battery capacity, no battery cost, no battery LCOE is
            calculated for this system type. Switch the System Type on the Project Details page to Hybrid or
            Off-grid to size a battery.
          </p>
        </Card>
      </div>
    );
  }

  const chartData = [
    { name: "Worst Month", "Battery (kWh)": batteryAssumptions.scenario === "worst_month" ? battery.recommendedCapacityKwh : batteryAlt.recommendedCapacityKwh },
    { name: "Annual Average", "Battery (kWh)": batteryAssumptions.scenario === "annual_average" ? battery.recommendedCapacityKwh : batteryAlt.recommendedCapacityKwh },
  ];

  return (
    <div>
      <PageHeader
        title="Battery Sizing"
        subtitle="Pulls Peak-period consumption from Consumption Analysis (Section 3). Recalculates automatically when upstream inputs change."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Assumptions (editable)" className="lg:col-span-1">
          <div className="space-y-4">
            <SelectField
              label="Sizing scenario"
              value={batteryAssumptions.scenario}
              onChange={(v) => setBatteryAssumptions({ scenario: v, capacityRoundingStepKwh: v === "worst_month" ? 5 : 10 })}
              options={[
                { value: "worst_month", label: "Worst Month (conservative)" },
                { value: "annual_average", label: "Annual Average" },
              ]}
              tooltip="Worst Month sizes for the single highest peak-demand month; Annual Average sizes for the typical month."
            />
            <NumberField label="Peak hours per weekday" value={batteryAssumptions.peakHoursPerWeekday} onChange={(v) => setBatteryAssumptions({ peakHoursPerWeekday: v })} unit="hr/day" />
            <NumberField label="Required backup period" value={batteryAssumptions.requiredBackupHours} onChange={(v) => setBatteryAssumptions({ requiredBackupHours: v })} unit="hr/day" tooltip="Hours of load the battery must be able to cover." />
            <NumberField label="Weekdays per month" value={batteryAssumptions.weekdaysPerMonth} onChange={(v) => setBatteryAssumptions({ weekdaysPerMonth: v })} unit="days" />
            <NumberField label="Depth of Discharge" value={batteryAssumptions.depthOfDischarge} onChange={(v) => setBatteryAssumptions({ depthOfDischarge: v })} unit="fraction (0-1)" step="0.01" />
            <NumberField label="Round-trip efficiency" value={batteryAssumptions.roundTripEfficiency} onChange={(v) => setBatteryAssumptions({ roundTripEfficiency: v })} unit="fraction (0-1)" step="0.01" tooltip="Combined battery + inverter/PCS efficiency." />
            <NumberField label="Design safety margin" value={batteryAssumptions.designMarginFactor} onChange={(v) => setBatteryAssumptions({ designMarginFactor: v })} unit="multiplier" step="0.01" />
            <NumberField label="Battery unit / rounding step" value={batteryAssumptions.capacityRoundingStepKwh} onChange={(v) => setBatteryAssumptions({ capacityRoundingStepKwh: v })} unit="kWh" />
            <NumberField label="Inverter/PCS rounding step" value={batteryAssumptions.powerRoundingStepKw} onChange={(v) => setBatteryAssumptions({ powerRoundingStepKw: v })} unit="kW" />
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Calculated results">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ResultTile label="Design peak kWh/month" value={formatNumber(battery.designPeakKwhPerMonth, 0)} unit="kWh" />
              <ResultTile label="Peak kWh/weekday" value={formatNumber(battery.peakKwhPerWeekday, 1)} unit="kWh" />
              <ResultTile label="Average load" value={formatNumber(battery.averageLoadKw, 2)} unit="kW" />
              <ResultTile label="Design power (with margin)" value={formatNumber(battery.designPowerKw, 2)} unit="kW" />
              <ResultTile label="Daily discharge energy" value={formatNumber(battery.dailyDischargeEnergyKwh, 1)} unit="kWh" />
              <ResultTile label="Gross (usable→installed) capacity" value={formatNumber(battery.grossCapacityRequiredKwh, 1)} unit="kWh" />
            </div>
          </Card>

          <Card title="Recommended system size">
            <div className="grid grid-cols-2 gap-4">
              <ResultTile label="Installed battery capacity" value={formatNumber(battery.recommendedCapacityKwh, 0)} unit="kWh" hint="Nominal / installed energy capacity" />
              <ResultTile label="Inverter / PCS rating" value={formatNumber(battery.recommendedInverterKw, 0)} unit="kW" hint="Power capacity, distinct from energy capacity" />
            </div>
          </Card>

          <Card title="Battery capacity vs. site load - scenario comparison">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} label={{ value: "kWh", angle: -90, position: "insideLeft", fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Battery (kWh)" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              The currently-selected scenario ({batteryAssumptions.scenario === "worst_month" ? "Worst Month" : "Annual Average"}) drives every other page. The other scenario is shown here for comparison only.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
