# Assumptions and deliberate corrections - Phase 1

This is the running log requested in the application brief ("all assumptions
must be editable where appropriate... clearly list every assumption in the
README and application settings"). Every item below is exposed as an
editable field in the app; nothing here is hardcoded into the calculation
logic itself unless stated otherwise.

## Corrections to workbook logic (flagged first, in the Nov 2026 spec doc)

1. **Section 3 month mapping.** The workbook hand-maps bill rows to calendar
   months with formulas like `C46='=C13+E12'`, fragile to any change in bill
   start month. The app aggregates by each bill row's own calendar-month
   field instead - verified to reproduce the workbook's own annual totals
   exactly (7,911 / 28,262 / 9,825 / 45,998 kWh for Peak/Standard/Off-Peak/
   Total) for the Mardale dataset.
2. **Battery Sizing scenario formula divergence.** Workbook Scenario 1 used
   "peak hours per weekday" and Scenario 2 used "hours to cover" for the same
   daily-discharge-energy calculation. The app always uses the "required
   backup hours" input for both scenarios. (Numerically identical to the
   workbook for the Mardale data, since both values happened to be 5.)
3. **Solar Sizing daytime-offset default.** Workbook formula
   `=IF(C7=0,40%,C14)` silently ignored manual overrides in Solar-only mode.
   Replaced with a single, always-editable `daytimeOffsetTargetPct` input,
   pre-filled to 100% for Hybrid and 40% for Solar-only (matching the
   workbook's own effective defaults).
4. **Dual inverter-sizing methods.** Battery Sizing's own inverter/PCS
   rating (from discharge power) and Solar Sizing's grid/hybrid inverter
   rating (from historical peak kVA demand) are two different numbers for
   two different purposes. Both are shown explicitly, labelled separately.
5. **`Inputs!AF16:AF17`.** Dropped the Network Access Charge term present in
   every other row of that column. Fixed to always include it.

## New methodology (no workbook equivalent)

**Off-Grid Sizing** - the source workbook has no off-grid calculation at
all. `src/lib/calculations/offGridSizing.ts` implements a new methodology
following the same style as Battery Sizing, using:

- Critical vs. non-critical load split.
- Required autonomy (days), not just backup hours.
- A minimum state-of-charge reserve, separate from Depth of Discharge.
- Worst-case (winter) specific solar yield for PV sizing.
- Generator sizing (suggested minimum, and a check against a user-specified
  generator).
- An always-visible undersized-system warning: triggers when there is no
  generator backup (the classic under-protected off-grid design), when
  worst-case solar production can't meet total daily load even at the
  recommended PV size, when a specified generator is smaller than the
  suggested minimum, or when required autonomy is under 1 day.

**This methodology is pending HolmStone engineering sign-off** before being
treated as authoritative - it is clearly labelled "New methodology - pending
review" in the app.

## Default assumption values (all editable in-app)

| Assumption | Default | Source |
|---|---|---|
| Battery DoD | 90% | Workbook |
| Battery round-trip efficiency | 95% | Workbook (combines battery + PCS) |
| Battery design margin | 1.0x | Workbook |
| Battery worst-month rounding step | 5 kWh | Workbook |
| Battery annual-average rounding step | 10 kWh | Workbook |
| Solar Peak Sun Hours | 4.5 hr/day | Workbook |
| Solar panel derating | 80% | Workbook |
| Solar specific yield | 4 kWh/kWp/day | Workbook (Solar Sizing sheet's own figure - the separate 1,550 kWh/kWp/yr figure used on the Costing/LCOE sheets is deferred to Phase 2/3 and should be reconciled with this one then) |
| Panel wattage | 620 Wp | Workbook |
| Off-grid autonomy | 1.5 days | New - needs HolmStone review |
| Off-grid min SOC reserve | 10% | New - needs HolmStone review |
| Off-grid worst-month specific yield | 3 kWh/kWp/day | New - needs HolmStone review |
| Off-grid generator power factor | 0.8 | Industry-standard default |
| Eskom High Demand Season months | Jun/Jul/Aug | Eskom RuraFlex definition |

## Open items carried over from the Phase 1 spec doc (unresolved)

These do not block Phase 1 (calculators), but must be resolved before
Phase 2/3 (costing) work begins - see
`Workbook_Analysis_and_Application_Specification.docx`, Section 7:

- Costing module scope: itemised BOQ vs. the workbook's PPA/CAPEX model vs.
  both.
- `Battery Sizing!E19` broken reference (zeroes out battery costs in both
  Costing sheets) - must be fixed before porting costing formulas.
- Reconciling the two different specific-yield assumptions (4 kWh/kWp/day
  vs. 1,550 kWh/kWp/yr) once costing/LCOE work begins.
