"use client";

import { useProject } from "@/lib/context/ProjectContext";
import { PageHeader, Card, NumberField, SelectField, ResultTile, Pill, WarningBanner } from "@/components/ui";
import { formatNumber, formatZAR, formatPct } from "@/lib/format";
import type { LcoeSystemType } from "@/lib/calculations/lcoe.ts";
import {
  Bar, Line, ComposedChart, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const SYSTEM_TYPE_OPTIONS: { value: LcoeSystemType; label: string }[] = [
  { value: "solar_pv_only", label: "Solar PV only" },
  { value: "hybrid", label: "Hybrid (Solar PV + Battery)" },
  { value: "off_grid", label: "Off-Grid (Solar PV + Battery)" },
];

export default function LcoePage() {
  const { lcoeSystemType, setLcoeSystemType, lcoeAssumptions, setLcoeAssumptions, lcoe } = useProject();

  const savingsChart = lcoe.years.map((y) => ({
    year: `Yr ${y.year}`,
    "Solar savings (R)": Math.round(y.solarSavingsR),
    "Battery savings (R)": Math.round(y.batterySavingsR),
  }));

  const cumulativeChart = lcoe.years.map((y) => ({
    year: `Yr ${y.year}`,
    "Cumulative savings (R)": Math.round(y.cumulativeSavingsR),
  }));

  return (
    <div>
      <PageHeader
        title="LCOE & Savings"
        subtitle="Levelised Cost of Energy, cost of capital and 20-year savings, computed from the System Sizing and Consumption Analysis results below - no separate inputs to duplicate."
      />

      <div className="mb-4 flex items-end gap-4">
        <div className="w-72">
          <SelectField
            label="System type for this LCOE"
            value={lcoeSystemType}
            onChange={setLcoeSystemType}
            options={SYSTEM_TYPE_OPTIONS}
            tooltip="Independent of the Project Details 'System Type' proposal marker - pick any of the three to compare their LCOE/savings without changing what's proposed."
          />
        </div>
        <Pill tone="calculated">Pulled from System Sizing</Pill>
      </div>

      {lcoeSystemType === "off_grid" && (
        <WarningBanner>
          Off-Grid has no municipal grid connection at all, so its true "savings" is closer to 100% bill avoidance
          (less generator fuel/running costs, not modelled here) rather than the TOU peak-shifting savings this
          calculation assumes. The figures below reuse the same Blended Standard/Peak avoided-cost model as
          Hybrid as an approximation - treat them as a lower bound pending a dedicated Off-Grid savings model.
        </WarningBanner>
      )}

      <Card title="Financing assumptions (editable, shared - Solar & Battery)" className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField
            label="Interest rate"
            value={lcoeAssumptions.interestRatePct}
            onChange={(v) => setLcoeAssumptions({ interestRatePct: v })}
            unit="fraction (0-1)"
            step="0.0025"
            tooltip="Financing / cost-of-capital rate, applied to both the Solar and Battery annuity calculations. Sheet default 10.25%."
          />
          <NumberField
            label="Tariff escalation"
            value={lcoeAssumptions.tariffEscalationPct}
            onChange={(v) => setLcoeAssumptions({ tariffEscalationPct: v })}
            unit="fraction/yr"
            step="0.01"
            tooltip="Annual increase applied to the avoided grid tariff (Blended Standard / Peak) in the savings calc. Sheet default 9%."
          />
          <NumberField
            label="Solar degradation"
            value={lcoeAssumptions.solarDegradationPctPerYear}
            onChange={(v) => setLcoeAssumptions({ solarDegradationPctPerYear: v })}
            unit="fraction/yr"
            step="0.0005"
            tooltip="Annual panel output degradation. Sheet default 0.55%."
          />
          <NumberField
            label="DSM / funding (once-off)"
            value={lcoeAssumptions.dsmFundingR}
            onChange={(v) => setLcoeAssumptions({ dsmFundingR: v })}
            unit="R"
            step="1000"
            tooltip="Once-off rebate/funding subtracted from Solar CAPEX before financing. Sheet default R0."
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Solar - cost & CAPEX assumptions (editable)">
          <div className="space-y-4">
            <NumberField
              label="Installed cost / kWp"
              value={lcoeAssumptions.solarCostPerKwpR}
              onChange={(v) => setLcoeAssumptions({ solarCostPerKwpR: v })}
              unit="R/kWp"
              step="100"
              tooltip="No source yet - Phase 2/3 BOQ costing isn't built. Placeholder default: ~R11,000/kWp ground mount, ~R9,000/kWp roof mount. Will most likely change once real BOQ costing is added."
            />
            <NumberField
              label="Project life"
              value={lcoeAssumptions.solarProjectYears}
              onChange={(v) => setLcoeAssumptions({ solarProjectYears: v })}
              unit="years"
              tooltip="Also sets the savings-table horizon. Sheet default 20."
            />
            <NumberField
              label="Maintenance"
              value={lcoeAssumptions.solarMaintenancePct}
              onChange={(v) => setLcoeAssumptions({ solarMaintenancePct: v })}
              unit="fraction of CAPEX/yr"
              step="0.005"
              tooltip="Sheet default 3%."
            />
            <NumberField
              label="Project insurance"
              value={lcoeAssumptions.solarInsurancePct}
              onChange={(v) => setLcoeAssumptions({ solarInsurancePct: v })}
              unit="fraction of CAPEX/yr"
              step="0.005"
              tooltip="Added at your request - not in the source workbook, which had no insurance line. Default 1% of CAPEX/year."
            />
          </div>
        </Card>

        {lcoe.battery ? (
          <Card title="Battery - cost & CAPEX assumptions (editable)">
            <div className="space-y-4">
              <NumberField
                label="Installed cost / kWh"
                value={lcoeAssumptions.batteryCostPerKwhR}
                onChange={(v) => setLcoeAssumptions({ batteryCostPerKwhR: v })}
                unit="R/kWh"
                step="50"
                tooltip="No source yet - Phase 2/3 BOQ costing isn't built. Sheet-implied placeholder default R4,450/kWh."
              />
              <NumberField
                label="Project life"
                value={lcoeAssumptions.batteryProjectYears}
                onChange={(v) => setLcoeAssumptions({ batteryProjectYears: v })}
                unit="years"
                tooltip="Sheet default 15. No replacement is modelled after this - battery savings drop to R0 in later years, matching the source sheet's own behaviour."
              />
              <NumberField
                label="Depth of Discharge"
                value={lcoeAssumptions.batteryDodPct}
                onChange={(v) => setLcoeAssumptions({ batteryDodPct: v })}
                unit="fraction (0-1)"
                step="0.01"
                tooltip="Sheet default 90%."
              />
              <NumberField
                label="Cycles per day"
                value={lcoeAssumptions.batteryCyclesPerDay}
                onChange={(v) => setLcoeAssumptions({ batteryCyclesPerDay: v })}
                unit="cycles/day"
                step="0.1"
                tooltip="Sheet default 1 full cycle/day."
              />
              <NumberField
                label="Maintenance"
                value={lcoeAssumptions.batteryMaintenancePct}
                onChange={(v) => setLcoeAssumptions({ batteryMaintenancePct: v })}
                unit="fraction of CAPEX/yr"
                step="0.005"
                tooltip="Sheet default 2.5%."
              />
              <NumberField
                label="Project insurance"
                value={lcoeAssumptions.batteryInsurancePct}
                onChange={(v) => setLcoeAssumptions({ batteryInsurancePct: v })}
                unit="fraction of CAPEX/yr"
                step="0.005"
                tooltip="Added at your request - not in the source workbook. Default 1% of CAPEX/year."
              />
            </div>
          </Card>
        ) : (
          <Card title="Battery - cost & CAPEX assumptions">
            <p className="text-sm text-slate-500">Not applicable - Solar PV only has no battery.</p>
          </Card>
        )}
      </div>

      <Card title="Key results" className="mt-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <ResultTile label="Solar size" value={formatNumber(lcoe.solar.sizeKwp, 0)} unit="kWp" />
          {lcoe.battery && <ResultTile label="Battery size" value={formatNumber(lcoe.battery.sizeKwh, 0)} unit="kWh" />}
          <ResultTile label="Total CAPEX" value={formatZAR(lcoe.totalCapexR, 0)} />
          <ResultTile label="Solar LCOE" value={formatNumber(lcoe.solar.lcoeCostOfCapitalRPerKwh, 3)} unit="R/kWh" hint="Cost of capital basis" />
          {lcoe.battery && (
            <ResultTile label="Battery LCOS" value={formatNumber(lcoe.battery.lcosCostOfCapitalRPerKwh, 3)} unit="R/kWh" hint="Cost of capital basis" />
          )}
          <ResultTile
            label="Simple payback"
            value={lcoe.simplePaybackYears !== null ? formatNumber(lcoe.simplePaybackYears, 1) : "> horizon"}
            unit={lcoe.simplePaybackYears !== null ? "years" : undefined}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ResultTile label="Year 1 savings" value={formatZAR(lcoe.year1TotalSavingsR, 0)} />
          <ResultTile
            label={`Year ${lcoeAssumptions.solarProjectYears} cumulative savings`}
            value={formatZAR(lcoe.year20CumulativeSavingsR, 0)}
          />
          <ResultTile
            label="Net benefit (cumulative - CAPEX)"
            value={formatZAR(lcoe.year20CumulativeSavingsR - lcoe.totalCapexR, 0)}
          />
        </div>
      </Card>

      <Card title="Annual electricity savings" className="mt-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={savingsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={1} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v / 1000, 0) + "k"} />
              <Tooltip formatter={(v: number) => formatZAR(v, 0)} />
              <Legend />
              <Bar dataKey="Solar savings (R)" stackId="a" fill="#f59e0b" />
              {lcoe.battery && <Bar dataKey="Battery savings (R)" stackId="a" fill="#2563eb" />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Cumulative savings vs. total CAPEX" className="mt-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cumulativeChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={1} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNumber(v / 1e6, 1) + "M"} />
              <Tooltip formatter={(v: number) => formatZAR(v, 0)} />
              <Legend />
              <Line type="monotone" dataKey="Cumulative savings (R)" stroke="#16a34a" strokeWidth={2} dot={false} />
              <ReferenceLine
                y={lcoe.totalCapexR}
                stroke="#dc2626"
                strokeDasharray="4 4"
                label={{ value: `Total CAPEX (${formatZAR(lcoe.totalCapexR, 0)})`, fontSize: 11, fill: "#dc2626", position: "insideTopLeft" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        Solar CAPEX/kWp and Battery CAPEX/kWh have no source yet - Phase 2/3&apos;s BOQ costing module isn&apos;t built,
        so these are editable placeholder assumptions ({formatPct(0.01, 0)} project insurance and the cost/kWp,kWh
        rates included). See docs/assumptions.md for the full list of flagged assumptions and simplifications behind
        this page.
      </p>
    </div>
  );
}
