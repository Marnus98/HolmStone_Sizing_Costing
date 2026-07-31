/**
 * Multi-project + version-history data model.
 *
 * Phase 1 stopgap: persisted to the browser's localStorage rather than a
 * real database (per the agreed "calculators first, infra after" scope).
 * Phase 2/3 will replace this storage layer with Postgres-backed
 * persistence without changing the shape of ProjectData itself, since the
 * calculation engine only ever consumes ProjectData.
 */

import type {
  SystemType,
  MonthlyBillEntry,
  TariffStructure,
  BatterySizingAssumptions,
  SolarSizingAssumptions,
  OffGridSizingAssumptions,
} from "@/lib/calculations/types";
import type { LcoeAssumptions, LcoeSystemType } from "@/lib/calculations/lcoe.ts";

/** Everything a single version of a project snapshots - i.e. all editable inputs/assumptions. */
export interface ProjectData {
  farmSiteName: string;
  systemType: SystemType;
  bills: MonthlyBillEntry[];
  tariff: TariffStructure;
  batteryAssumptions: BatterySizingAssumptions;
  solarAssumptions: SolarSizingAssumptions;
  offGridAssumptions: OffGridSizingAssumptions;
  // Optional so projects/versions saved before the LCOE feature existed keep
  // loading fine - ProjectContext supplies defaults when these are missing.
  lcoeAssumptions?: LcoeAssumptions;
  /** Which of the three system types the LCOE & Savings page is currently showing - independent of the main "systemType" proposal marker, so you can compare LCOE across types without changing what's proposed. */
  lcoeSystemType?: LcoeSystemType;
}

export interface ProjectVersion {
  versionNumber: number; // 1, 2, 3...
  label?: string; // optional custom label, e.g. "Post-site-visit revision"
  createdAt: string; // ISO
  updatedAt: string; // ISO
  data: ProjectData;
}

export interface StoredProject {
  id: string;
  name: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  versions: ProjectVersion[];
}

export interface ProjectsPersistedState {
  projects: StoredProject[];
  activeProjectId: string | null;
  activeVersionNumber: number;
}
