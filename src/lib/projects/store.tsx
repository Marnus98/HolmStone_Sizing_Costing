"use client";

/**
 * Projects + Versions store. See types.ts for the data model and provenance
 * notes. Persisted to localStorage under STORAGE_KEY; seeded on first run
 * with the real Mardale Apple Farm project (Version 1) so the app opens
 * exactly as it did before this feature existed.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProjectData, ProjectVersion, StoredProject, ProjectsPersistedState } from "./types";
import type { SystemType } from "@/lib/calculations/types";
import {
  DEFAULT_BATTERY_ASSUMPTIONS,
  defaultSolarAssumptions,
  DEFAULT_OFFGRID_ASSUMPTIONS,
  defaultLcoeAssumptions,
} from "@/lib/calculations";
import { mardaleBills, mardaleTariff } from "@/lib/seed/mardaleAppleFarm";

const STORAGE_KEY = "holmstone.projects.v1";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultProjectData(systemType: SystemType, farmSiteName = ""): ProjectData {
  return {
    farmSiteName,
    systemType,
    bills: [],
    tariff: mardaleTariff, // sensible starting tariff structure; bill history starts empty for a genuinely new project
    batteryAssumptions: DEFAULT_BATTERY_ASSUMPTIONS,
    solarAssumptions: defaultSolarAssumptions(systemType === "solar_pv_only" ? "solar_pv_only" : "hybrid"),
    offGridAssumptions: DEFAULT_OFFGRID_ASSUMPTIONS,
    lcoeAssumptions: defaultLcoeAssumptions(),
    lcoeSystemType: systemType,
  };
}

function mardaleDemoProjectData(): ProjectData {
  return {
    farmSiteName: "Mardale Apple Farm",
    systemType: "hybrid",
    bills: mardaleBills,
    tariff: mardaleTariff,
    batteryAssumptions: DEFAULT_BATTERY_ASSUMPTIONS,
    solarAssumptions: defaultSolarAssumptions("hybrid"),
    offGridAssumptions: DEFAULT_OFFGRID_ASSUMPTIONS,
    lcoeAssumptions: defaultLcoeAssumptions(),
    lcoeSystemType: "hybrid",
  };
}

function seedState(): ProjectsPersistedState {
  const now = new Date().toISOString();
  const project: StoredProject = {
    id: newId(),
    name: "Mardale Apple Farm - Solar & Battery Project",
    createdAt: now,
    updatedAt: now,
    versions: [
      {
        versionNumber: 1,
        createdAt: now,
        updatedAt: now,
        data: mardaleDemoProjectData(),
      },
    ],
  };
  return { projects: [project], activeProjectId: project.id, activeVersionNumber: 1 };
}

function loadState(): ProjectsPersistedState {
  if (typeof window === "undefined") return seedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as ProjectsPersistedState;
    if (!parsed.projects || parsed.projects.length === 0) return seedState();
    return parsed;
  } catch {
    return seedState();
  }
}

interface ProjectsContextValue {
  projects: StoredProject[];
  activeProjectId: string | null;
  activeVersionNumber: number;
  activeProject: StoredProject | null;
  activeVersion: ProjectVersion | null;

  createProject: (name: string, systemType: SystemType, farmSiteName?: string) => void;
  createVersion: (label?: string) => void;
  switchProject: (id: string) => void;
  switchVersion: (versionNumber: number) => void;
  renameActiveProject: (name: string) => void;
  renameVersion: (versionNumber: number, label: string) => void;
  deleteProject: (id: string) => void;
  updateActiveVersionData: (patch: Partial<ProjectData>) => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProjectsPersistedState>(() => loadState());
  const [hydrated, setHydrated] = useState(false);

  // Re-hydrate from localStorage after mount (SSR-safe: server render uses the
  // seed data, client swaps in whatever was actually saved).
  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // avoid clobbering saved data with the pre-hydration seed
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage unavailable (private browsing, quota, etc.) - fail silently, in-memory state still works
    }
  }, [state, hydrated]);

  const activeProject = useMemo(
    () => state.projects.find((p) => p.id === state.activeProjectId) ?? null,
    [state.projects, state.activeProjectId]
  );
  const activeVersion = useMemo(
    () => activeProject?.versions.find((v) => v.versionNumber === state.activeVersionNumber) ?? null,
    [activeProject, state.activeVersionNumber]
  );

  const createProject = (name: string, systemType: SystemType, farmSiteName = "") => {
    const now = new Date().toISOString();
    const project: StoredProject = {
      id: newId(),
      name: name.trim() || "Untitled project",
      createdAt: now,
      updatedAt: now,
      versions: [{ versionNumber: 1, createdAt: now, updatedAt: now, data: defaultProjectData(systemType, farmSiteName) }],
    };
    setState((s) => ({
      projects: [...s.projects, project],
      activeProjectId: project.id,
      activeVersionNumber: 1,
    }));
  };

  const createVersion = (label?: string) => {
    setState((s) => {
      const project = s.projects.find((p) => p.id === s.activeProjectId);
      if (!project) return s;
      const source = project.versions.find((v) => v.versionNumber === s.activeVersionNumber) ?? project.versions[project.versions.length - 1];
      const nextVersionNumber = Math.max(...project.versions.map((v) => v.versionNumber)) + 1;
      const now = new Date().toISOString();
      const newVersion: ProjectVersion = {
        versionNumber: nextVersionNumber,
        label,
        createdAt: now,
        updatedAt: now,
        // Deep-ish clone so editing the new version never mutates the source version's arrays/objects.
        data: JSON.parse(JSON.stringify(source.data)),
      };
      const updatedProject: StoredProject = {
        ...project,
        updatedAt: now,
        versions: [...project.versions, newVersion],
      };
      return {
        projects: s.projects.map((p) => (p.id === project.id ? updatedProject : p)),
        activeProjectId: project.id,
        activeVersionNumber: nextVersionNumber,
      };
    });
  };

  const switchProject = (id: string) => {
    setState((s) => {
      const project = s.projects.find((p) => p.id === id);
      if (!project) return s;
      const latestVersion = Math.max(...project.versions.map((v) => v.versionNumber));
      return { ...s, activeProjectId: id, activeVersionNumber: latestVersion };
    });
  };

  const switchVersion = (versionNumber: number) => {
    setState((s) => ({ ...s, activeVersionNumber: versionNumber }));
  };

  const renameActiveProject = (name: string) => {
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) =>
        p.id === s.activeProjectId ? { ...p, name: name.trim() || p.name, updatedAt: new Date().toISOString() } : p
      ),
    }));
  };

  const renameVersion = (versionNumber: number, label: string) => {
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) =>
        p.id === s.activeProjectId
          ? { ...p, versions: p.versions.map((v) => (v.versionNumber === versionNumber ? { ...v, label } : v)) }
          : p
      ),
    }));
  };

  const deleteProject = (id: string) => {
    setState((s) => {
      const remaining = s.projects.filter((p) => p.id !== id);
      if (remaining.length === 0) return seedState();
      const nextActiveId = s.activeProjectId === id ? remaining[0].id : s.activeProjectId;
      const nextActiveProject = remaining.find((p) => p.id === nextActiveId)!;
      const nextActiveVersion =
        s.activeProjectId === id ? Math.max(...nextActiveProject.versions.map((v) => v.versionNumber)) : s.activeVersionNumber;
      return { projects: remaining, activeProjectId: nextActiveId, activeVersionNumber: nextActiveVersion };
    });
  };

  const updateActiveVersionData = (patch: Partial<ProjectData>) => {
    setState((s) => {
      const project = s.projects.find((p) => p.id === s.activeProjectId);
      if (!project) return s;
      const version = project.versions.find((v) => v.versionNumber === s.activeVersionNumber);
      if (!version) return s;
      const now = new Date().toISOString();
      const updatedVersion: ProjectVersion = { ...version, updatedAt: now, data: { ...version.data, ...patch } };
      const updatedProject: StoredProject = {
        ...project,
        updatedAt: now,
        versions: project.versions.map((v) => (v.versionNumber === updatedVersion.versionNumber ? updatedVersion : v)),
      };
      return { ...s, projects: s.projects.map((p) => (p.id === project.id ? updatedProject : p)) };
    });
  };

  const value: ProjectsContextValue = {
    projects: state.projects,
    activeProjectId: state.activeProjectId,
    activeVersionNumber: state.activeVersionNumber,
    activeProject,
    activeVersion,
    createProject,
    createVersion,
    switchProject,
    switchVersion,
    renameActiveProject,
    renameVersion,
    deleteProject,
    updateActiveVersionData,
  };

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within a ProjectsProvider");
  return ctx;
}
