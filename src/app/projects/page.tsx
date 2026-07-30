"use client";

import { useState } from "react";
import { useProjects } from "@/lib/projects/store";
import { PageHeader, Card, TextField, SelectField, Pill } from "@/components/ui";
import type { SystemType } from "@/lib/calculations/types";

/** Projects/versions store full ISO timestamps (not the bill-history date-only strings formatDateSA expects). */
function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-ZA", { year: "numeric", month: "short", day: "numeric" }).format(d);
}

const SYSTEM_TYPE_OPTIONS: { value: SystemType; label: string }[] = [
  { value: "hybrid", label: "Hybrid solar PV and battery system" },
  { value: "off_grid", label: "Off-grid solar PV and battery system" },
  { value: "solar_pv_only", label: "Solar PV-only system" },
];

export default function ProjectsPage() {
  const { projects, activeProjectId, activeVersionNumber, createProject, switchProject, switchVersion, createVersion, renameVersion, deleteProject } =
    useProjects();

  const [showNewProject, setShowNewProject] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFarmSite, setNewFarmSite] = useState("");
  const [newSystemType, setNewSystemType] = useState<SystemType>("hybrid");

  const [versionLabelDrafts, setVersionLabelDrafts] = useState<Record<number, string>>({});

  const handleCreateProject = () => {
    if (!newName.trim()) return;
    createProject(newName, newSystemType, newFarmSite);
    setNewName("");
    setNewFarmSite("");
    setNewSystemType("hybrid");
    setShowNewProject(false);
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Every project keeps its own version history. Saved in this browser (localStorage) - Phase 1 stopgap until server-side database persistence lands."
      />

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">{projects.length} project{projects.length === 1 ? "" : "s"}</p>
        <button
          onClick={() => setShowNewProject((v) => !v)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showNewProject ? "Cancel" : "+ New project"}
        </button>
      </div>

      {showNewProject && (
        <Card title="New project" className="mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TextField label="Project name" value={newName} onChange={setNewName} />
            <TextField label="Farm / site name" value={newFarmSite} onChange={setNewFarmSite} />
            <SelectField label="System type" value={newSystemType} onChange={setNewSystemType} options={SYSTEM_TYPE_OPTIONS} />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Starts empty (no bill history) with sensible default assumptions for the chosen system type - Version 1.
          </p>
          <button
            onClick={handleCreateProject}
            disabled={!newName.trim()}
            className="mt-4 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Create project
          </button>
        </Card>
      )}

      <div className="space-y-4">
        {projects.map((project) => {
          const isActive = project.id === activeProjectId;
          const sortedVersions = [...project.versions].sort((a, b) => b.versionNumber - a.versionNumber);
          return (
            <Card key={project.id} className={isActive ? "border-blue-300 ring-1 ring-blue-200" : ""}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-800">{project.name}</h3>
                    {isActive && <Pill tone="calculated">Active</Pill>}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Created {formatTimestamp(project.createdAt)} - Updated {formatTimestamp(project.updatedAt)} -{" "}
                    {project.versions.length} version{project.versions.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isActive && (
                    <button
                      onClick={() => switchProject(project.id)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Open
                    </button>
                  )}
                  {isActive && (
                    <button
                      onClick={() => createVersion(versionLabelDrafts[-1]?.trim() || undefined)}
                      className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      + New version
                    </button>
                  )}
                  {projects.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${project.name}" and all its versions? This cannot be undone.`)) {
                          deleteProject(project.id);
                        }
                      }}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                {sortedVersions.map((v) => {
                  const isActiveVersion = isActive && v.versionNumber === activeVersionNumber;
                  return (
                    <div key={v.versionNumber} className="flex items-center justify-between gap-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${isActiveVersion ? "font-semibold text-blue-700" : "text-slate-600"}`}>
                          Version {v.versionNumber}
                        </span>
                        {v.label && <span className="text-xs text-slate-400">- {v.label}</span>}
                        <span className="text-xs text-slate-400">({formatTimestamp(v.updatedAt)})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Label..."
                          defaultValue={v.label ?? ""}
                          onBlur={(e) => {
                            if (e.target.value !== (v.label ?? "")) renameVersion(v.versionNumber, e.target.value);
                          }}
                          className="w-32 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-blue-500 focus:outline-none"
                        />
                        {!isActiveVersion && (
                          <button
                            onClick={() => {
                              if (!isActive) switchProject(project.id);
                              switchVersion(v.versionNumber);
                            }}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Switch to
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isActive && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Optional label for the next version..."
                    onChange={(e) => setVersionLabelDrafts((d) => ({ ...d, [-1]: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
