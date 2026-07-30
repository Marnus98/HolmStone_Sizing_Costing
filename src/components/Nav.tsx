"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/lib/context/ProjectContext";

const BASE_LINKS = [
  { href: "/", label: "Project Details" },
  { href: "/inputs", label: "Inputs" },
  { href: "/consumption", label: "Consumption Analysis" },
];

const SYSTEM_LINKS: Record<string, { href: string; label: string }[]> = {
  hybrid: [
    { href: "/battery", label: "Battery Sizing" },
    { href: "/solar", label: "Solar Sizing" },
  ],
  off_grid: [
    { href: "/battery", label: "Battery Sizing" },
    { href: "/solar", label: "Solar Sizing" },
    { href: "/offgrid", label: "Off-Grid Sizing" },
  ],
  solar_pv_only: [
    { href: "/solar", label: "Solar Sizing" },
  ],
};

export function Nav() {
  const pathname = usePathname();
  const { systemType, projectName, farmSiteName } = useProject();
  const links = [...BASE_LINKS, ...SYSTEM_LINKS[systemType]];

  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-200">
      <div className="border-b border-slate-700 px-5 py-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">HolmStone</div>
        <div className="mt-1 text-sm font-medium text-white">{projectName}</div>
        <div className="text-xs text-slate-400">{farmSiteName}</div>
      </div>
      <ul className="flex-1 space-y-0.5 px-2 py-4">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`block rounded-md px-3 py-2 text-sm transition ${
                  active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-700 px-5 py-4 text-[11px] text-slate-500">
        Phase 1 - calculators only.
        <br />
        No login / database yet.
      </div>
    </nav>
  );
}
