"use client";

import type { ReactNode } from "react";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 border-b border-slate-200 pb-4">
      <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>}
      {children}
    </div>
  );
}

export function ResultTile({ label, value, unit, hint }: { label: string; value: string; unit?: string; hint?: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-800">
        {value} {unit && <span className="text-sm font-normal text-slate-500">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export function Pill({ children, tone = "input" }: { children: ReactNode; tone?: "input" | "calculated" | "warning" }) {
  const styles = {
    input: "bg-blue-50 text-blue-700 border-blue-200",
    calculated: "bg-slate-100 text-slate-600 border-slate-200",
    warning: "bg-amber-50 text-amber-800 border-amber-300",
  }[tone];
  return <span className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles}`}>{children}</span>;
}

export function WarningBanner({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span className="mt-0.5">⚠</span>
      <div>{children}</div>
    </div>
  );
}

export function NumberField({
  label, value, onChange, unit, step = "any", tooltip, min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  step?: string;
  tooltip?: string;
  min?: number;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-xs font-medium text-slate-600" title={tooltip}>
        {label} <Pill>input</Pill>
      </span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          step={step}
          min={min}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
    </label>
  );
}

export function TextField({
  label, value, onChange, tooltip,
}: { label: string; value: string; onChange: (v: string) => void; tooltip?: string }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-xs font-medium text-slate-600" title={tooltip}>
        {label} <Pill>input</Pill>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </label>
  );
}

export function SelectField<T extends string>({
  label, value, onChange, options, tooltip,
}: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; tooltip?: string }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-xs font-medium text-slate-600" title={tooltip}>
        {label} <Pill>input</Pill>
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
