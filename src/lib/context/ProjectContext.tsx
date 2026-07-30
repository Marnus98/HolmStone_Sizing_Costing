"use client";

/**
 * Phase 1 in-memory project state.
 *
 * Deliberately NOT backed by a database yet (per the agreed Phase 1 scope:
 * "calculators first, infra after"). All state lives in React context for
 * the current browser session, seeded with the real Mardale Apple Farm data
 * so the calculators are immediately checkable against the source workbook.
 * Phase 2/3 will replace this with Postgres + Prisma-backed persistence,
 * multi-project support, and version history, without changing the
 * calculation engine itself.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  SystemType,
  MonthlyBillEntry,
  TariffStructure,
  BatterySizingAssumptions,
  SolarSizingAssumptions,
  OffGridSizingAssumptions,
} from "@/lib/calculations/types";
import {
  computeConsumptionSummary,
  computeBatterySizing,
  computeSolarSizing,
  computeOffGridSizing,
  DEFAULT_BATTERY_ASSUMPTIONS,
  defaultSolarAssumptions,
  DEFAULT_OFFGRID_ASSUMPTIONS,
} from "@/lib/calculations";
import { mardaleBills, mardaleTariff } from "@/lib/seed/mardaleAppleFarm";

interface ProjectState {
  projectName: string;
  farmSiteName: string;
  systemType: SystemType;
  bills: MonthlyBillEntry[];
  tariff: TariffStructure;
  batteryAssumptions: BatterySizingAssumptions;
  solarAssumptions: SolarSizingAssumptions;
  offGridAssumptions: OffGridSizingAssumptions;
}

interface ProjectContextValue extends ProjectState {
  setProjectName: (v: string) => void;
  setFarmSiteName: (v: string) => void;
  setSystemType: (v: SystemType) => void;
  setBills: (v: MonthlyBillEntry[]) => void;
  updateBill: (index: number, patch: Partial<MonthlyBillEntry>) => void;
  addBillRow: () => void;
  removeBillRow: (index: number) => void;
  setTariff: (patch: Partial<TariffStructure>) => void;
  setBatteryAssumptions: (patch: Partial<BatterySizingAssumptions>) => void;
  setSolarAssumptions: (patch: Partial<SolarSizingAssumptions>) => void;
  setOffGridAssumptions: (patch: Partial<OffGridSizingAssumptions>) => void;
  resetToMardaleDemo: () => void;

  // Derived / calculated (recomputed automatically whenever inputs change)
  consumption: ReturnType<typeof computeConsumptionSummary>;
  battery: ReturnType<typeof computeBatterySizing>;
  batteryAlt: ReturnType<typeof computeBatterySizing>; // the "other" scenario, for comparison
  solar: ReturnType<typeof computeSolarSizing>;
  offGrid: ReturnType<typeof computeOffGridSizing>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

const EMPTY_BILL: MonthlyBillEntry = {
  month: new Date().toISOString().slice(0, 10),
  peakLowKwh: 0, peakLowRate: 0, peakHighKwh: 0, peakHighRate: 0,
  offPeakLowKwh: 0, offPeakLowRate: 0, offPeakHighKwh: 0, offPeakHighRate: 0,
  standardLowKwh: 0, standardLowRate: 0, standardHighKwh: 0, standardHighRate: 0,
  networkCapacityKva: 0, networkCapacityRate: 0, networkAccessRate: 0,
  ancillaryChargeRate: 0, networkDemandChargeRate: 0, legacyChargeRate: 0,
  adminCharge: 0, serviceCharge: 0,
};

function initialState(): ProjectState {
  return {
    projectName: "Mardale Apple Farm - Solar & Battery Project",
    farmSiteName: "Mardale Apple Farm",
    systemType: "hybrid",
    bills: mardaleBills,
    tariff: mardaleTariff,
    batteryAssumptions: DEFAULT_BATTERY_ASSUMPTIONS,
    solarAssumptions: defaultSolarAssumptions("hybrid"),
    offGridAssumptions: DEFAULT_OFFGRID_ASSUMPTIONS,
  };
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProjectState>(initialState);

  const setProjectName = (v: string) => setState((s) => ({ ...s, projectName: v }));
  const setFarmSiteName = (v: string) => setState((s) => ({ ...s, farmSiteName: v }));

  const setSystemType = (v: SystemType) =>
    setState((s) => ({
      ...s,
      systemType: v,
      // Keep the daytime-offset / battery-recharge defaults sensible when
      // switching system type, without discarding anything the user edited.
      solarAssumptions: {
        ...s.solarAssumptions,
        includeBatteryRecharge: v === "hybrid" || v === "off_grid",
      },
    }));

  const setBills = (v: MonthlyBillEntry[]) => setState((s) => ({ ...s, bills: v }));
  const updateBill = (index: number, patch: Partial<MonthlyBillEntry>) =>
    setState((s) => ({
      ...s,
      bills: s.bills.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    }));
  const addBillRow = () => setState((s) => ({ ...s, bills: [...s.bills, { ...EMPTY_BILL }] }));
  const removeBillRow = (index: number) =>
    setState((s) => ({ ...s, bills: s.bills.filter((_, i) => i !== index) }));

  const setTariff = (patch: Partial<TariffStructure>) =>
    setState((s) => ({ ...s, tariff: { ...s.tariff, ...patch } }));
  const setBatteryAssumptions = (patch: Partial<BatterySizingAssumptions>) =>
    setState((s) => ({ ...s, batteryAssumptions: { ...s.batteryAssumptions, ...patch } }));
  const setSolarAssumptions = (patch: Partial<SolarSizingAssumptions>) =>
    setState((s) => ({ ...s, solarAssumptions: { ...s.solarAssumptions, ...patch } }));
  const setOffGridAssumptions = (patch: Partial<OffGridSizingAssumptions>) =>
    setState((s) => ({ ...s, offGridAssumptions: { ...s.offGridAssumptions, ...patch } }));

  const resetToMardaleDemo = () => setState(initialState());

  const consumption = useMemo(
    () => computeConsumptionSummary(state.bills, state.tariff),
    [state.bills, state.tariff]
  );

  const battery = useMemo(
    () => computeBatterySizing(consumption.monthlyConsumption, state.batteryAssumptions),
    [consumption, state.batteryAssumptions]
  );
  const batteryAlt = useMemo(
    () =>
      computeBatterySizing(consumption.monthlyConsumption, {
        ...state.batteryAssumptions,
        scenario: state.batteryAssumptions.scenario === "worst_month" ? "annual_average" : "worst_month",
        capacityRoundingStepKwh: state.batteryAssumptions.scenario === "worst_month" ? 10 : 5,
      }),
    [consumption, state.batteryAssumptions]
  );

  // Solar Sizing always recharges off the Annual-Average battery scenario,
  // matching the workbook's own 'Battery Sizing'!C15 cross-sheet reference.
  const annualAverageBattery = useMemo(
    () =>
      computeBatterySizing(consumption.monthlyConsumption, {
        ...state.batteryAssumptions,
        scenario: "annual_average",
        capacityRoundingStepKwh: 10,
      }),
    [consumption, state.batteryAssumptions]
  );

  const solar = useMemo(
    () =>
      computeSolarSizing(
        consumption.monthlyConsumption,
        state.bills,
        annualAverageBattery.dailyDischargeEnergyKwh,
        state.batteryAssumptions.roundTripEfficiency,
        state.solarAssumptions
      ),
    [consumption, state.bills, annualAverageBattery, state.batteryAssumptions, state.solarAssumptions]
  );

  const offGrid = useMemo(
    () => computeOffGridSizing(state.offGridAssumptions),
    [state.offGridAssumptions]
  );

  const value: ProjectContextValue = {
    ...state,
    setProjectName,
    setFarmSiteName,
    setSystemType,
    setBills,
    updateBill,
    addBillRow,
    removeBillRow,
    setTariff,
    setBatteryAssumptions,
    setSolarAssumptions,
    setOffGridAssumptions,
    resetToMardaleDemo,
    consumption,
    battery,
    batteryAlt,
    solar,
    offGrid,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within a ProjectProvider");
  return ctx;
}
