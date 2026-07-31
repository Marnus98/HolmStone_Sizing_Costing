"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/lib/context/ProjectContext";
import { useProjects } from "@/lib/projects/store";

// Solar/Battery/Off-Grid Sizing are no longer separate tabs gated by System
// Type - they're always computed together and shown stacked on one page
// (/sizing), so every project gets the same nav regardless of system type.
const LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/", label: "Project Details" },
  { href: "/inputs", label: "Inputs" },
  { href: "/consumption", label: "Consumption Analysis" },
  { href: "/sizing", label: "System Sizing" },
  { href: "/lcoe", label: "LCOE & Savings" },
];

export function Nav() {
  const pathname = usePathname();
  const { farmSiteName } = useProject();
  const { activeProject, activeVersion, switchVersion } = useProjects();

  return (
    <nav className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-slate-200">
      <div className="border-b border-slate-700 px-5 py-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">HolmStone</div>
        <div className="mt-1 text-sm font-medium text-white">{activeProject?.name ?? "Loading..."}</div>
        <div className="text-xs text-slate-400">{farmSiteName}</div>
        {activeProject && activeProject.versions.length > 0 && (
          <select
            value={activeVersion?.versionNumber ?? 1}
            onChange={(e) => switchVersion(Number(e.target.value))}
            className="mt-3 w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            {[...activeProject.versions]
              .sort((a, b) => a.versionNumber - b.versionNumber)
              .map((v) => (
                <option key={v.versionNumber} value={v.versionNumber}>
                  Version {v.versionNumber}
                  {v.label ? ` - ${v.label}` : ""}
                </option>
              ))}
          </select>
        )}
      </div>
      <ul className="flex-1 space-y-0.5 px-2 py-4">
        {LINKS.map((l) => {
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
        Projects/versions saved in this browser (no login / server database yet).
      </div>
    </nav>
  );
}
