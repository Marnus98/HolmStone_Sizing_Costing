"use client";

import { useProject } from "@/lib/context/ProjectContext";
import { PageHeader, Card, ResultTile } from "@/components/ui";
import { formatNumber, formatZAR, formatPct } from "@/lib/format";
import { monthLabel } from "@/lib/calculations/consumption";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = { peak: "#dc2626", standard: "#2563eb", offPeak: "#16a34a" };

export default function ConsumptionAnalysisPage() {
  const { consumption } = useProject();

  const barData = consumption.monthlyConsumption.map((r) => ({
    month: monthLabel(r.month),
    Peak: Math.round(r.peakKwh),
    Standard: Math.round(r.standardKwh),
    "Off-Peak": Math.round(r.offPeakKwh),
  }));

  const costData = consumption.monthlyCost.map((r) => ({
    month: monthLabel(r.month),
    Peak: Math.round(r.peakCost),
    Standard: Math.round(r.standardCost),
    "Off-Peak": Math.round(r.offPeakCost),
  }));

  const pieData = [
    { name: "Peak", value: consumption.consumptionMixPct.peak, fill: COLORS.peak },
    { name: "Standard", value: consumption.consumptionMixPct.standard, fill: COLORS.standard },
    { name: "Off-Peak", value: consumption.consumptionMixPct.offPeak, fill: COLORS.offPeak },
  ];

  return (
    <div>
      <PageHeader
        title="Consumption Analysis"
        subtitle="Section 3 & 4 - calculated automatically from Inputs. Updates immediately when Section 1 or 2 changes."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ResultTile label="Annual consumption" value={formatNumber(consumption.annualConsumptionKwh, 0)} unit="kWh" />
        <ResultTile label="Annual cost" value={formatZAR(consumption.annualCostR, 0)} />
        <ResultTile label="Avg monthly consumption" value={formatNumber(consumption.averageMonthlyConsumptionKwh, 0)} unit="kWh" />
        <ResultTile label="Avg monthly cost" value={formatZAR(consumption.averageMonthlyCostR, 0)} />
        <ResultTile label="Min month" value={formatNumber(consumption.minMonthlyConsumptionKwh, 0)} unit="kWh" />
        <ResultTile label="Max month" value={formatNumber(consumption.maxMonthlyConsumptionKwh, 0)} unit="kWh" />
        <ResultTile label="Blended Standard tariff" value={formatNumber(consumption.blendedTariffs.standard, 2)} unit="R/kWh" />
        <ResultTile label="Blended Peak tariff" value={formatNumber(consumption.blendedTariffs.peak, 2)} unit="R/kWh" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Monthly electrical consumption" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: "kWh", angle: -90, position: "insideLeft", fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Peak" stackId="a" fill={COLORS.peak} />
                <Bar dataKey="Standard" stackId="a" fill={COLORS.standard} />
                <Bar dataKey="Off-Peak" stackId="a" fill={COLORS.offPeak} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Annual consumption mix">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label={(d) => `${d.name} ${formatPct(d.value, 0)}`}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatPct(v, 1)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Monthly electricity cost" className="mt-6">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: "R", angle: -90, position: "insideLeft", fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatZAR(v, 0)} />
              <Legend />
              <Bar dataKey="Peak" stackId="a" fill={COLORS.peak} />
              <Bar dataKey="Standard" stackId="a" fill={COLORS.standard} />
              <Bar dataKey="Off-Peak" stackId="a" fill={COLORS.offPeak} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Monthly detail" className="mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">Month</th>
                <th className="py-2 pr-4 text-right">Peak (kWh)</th>
                <th className="py-2 pr-4 text-right">Standard (kWh)</th>
                <th className="py-2 pr-4 text-right">Off-Peak (kWh)</th>
                <th className="py-2 pr-4 text-right">Total (kWh)</th>
                <th className="py-2 pr-4 text-right">Cost (R)</th>
              </tr>
            </thead>
            <tbody>
              {consumption.monthlyConsumption.map((r, i) => (
                <tr key={r.month} className="border-b border-slate-100">
                  <td className="py-1.5 pr-4">{monthLabel(r.month)}</td>
                  <td className="py-1.5 pr-4 text-right">{formatNumber(r.peakKwh, 0)}</td>
                  <td className="py-1.5 pr-4 text-right">{formatNumber(r.standardKwh, 0)}</td>
                  <td className="py-1.5 pr-4 text-right">{formatNumber(r.offPeakKwh, 0)}</td>
                  <td className="py-1.5 pr-4 text-right font-medium">{formatNumber(r.totalKwh, 0)}</td>
                  <td className="py-1.5 pr-4 text-right">{formatZAR(consumption.monthlyCost[i]?.totalCost ?? 0, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
