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

## Reference file: "Solar calc - claude.xlsx" (supersedes the items below)

A second reference workbook was supplied after Phase 1's initial build,
containing simpler "quick calc" methodologies for Grid-Tied and Off-Grid
sizing plus a non-linear monthly solar-yield table. All three were adopted
as the new source of truth, replacing the from-scratch methodologies
described further down this section (kept below, struck through in spirit,
for the historical record).

1. **Non-linear monthly solar yield** (`src/lib/calculations/solarYieldProfile.ts`).
   Source: 'kWhkWp' sheet - 12 monthly specific-yield figures (kWh/kWp),
   averaging to 1,565.36 kWh/kWp/yr. Because the sheet's own headline figure
   is the *average*, not the *sum*, of the 12 monthly values, each monthly
   figure is a seasonal index rather than a standalone monthly production
   number. The app normalises each month to its share of the 12-month total
   (fractions summing to 1) and applies that shape to whatever annual
   specific-yield assumption is in force - so changing the annual yield
   assumption rescales every month proportionally while the seasonal shape
   stays fixed, per the brief. Used in the Solar Sizing production chart and
   in the Off-Grid worst-month check.

2. **Grid-Tied / Solar PV-only quick calc** (`solarSizing.ts`, `method:
   "grid_tied_ratio"`). Source: 'Solar Grid Tied Calc' sheet. Formula:
   `PV kWp = (average monthly total consumption x target ratio x 12) /
   annual specific yield`. Default ratio 50%, matching the sheet. Default
   annual yield defaults to the kWhkWp table's own average (1,565.36) rather
   than the sheet's own separately-typed 1,550 figure in cell B5 - **the
   sheet uses two slightly different numbers for what should be the same
   assumption; both are editable in-app, and this discrepancy should be
   confirmed with HolmStone.** This also resolves the open item below about
   reconciling the original Mardale workbook's two specific-yield figures -
   the new file's 1,550 kWh/kWp/yr figure lines up with that same open
   question and should be resolved together.

3. **Off-Grid quick calc** (`offGridSizing.ts`). Source: 'Off-Grid' sheet.
   Formulas: `daily average = average monthly total consumption / 30.5`;
   `BESS usable = daily average x 0.85`; `BESS installed = usable x 1.2`;
   `solar kWp = daily average / (4 x 0.8) x 1.1`. **The 0.85 "BESS usable"
   factor is unlabeled in the source sheet - its exact intended meaning
   (coverage ratio? DoD? something else?) was not confirmed and is flagged
   here rather than guessed at.** Implemented literally, exposed as an
   editable `batteryCoverageRatio` assumption.

## Superseded: original from-scratch methodology (historical record only)

**Off-Grid Sizing (original)** - the source Mardale workbook had no
off-grid calculation at all, so Phase 1 initially implemented a from-scratch
methodology (critical/non-critical load split, required autonomy in days, a
minimum state-of-charge reserve separate from DoD, worst-case winter yield,
generator sizing). This has been **replaced** by the "Off-Grid" quick calc
above per the user's explicit instruction to rebuild Grid-Tied and Off-Grid
against the new reference file. The generator, inverter/PCS sizing, and the
mandatory undersized-system warning remain as app-level additions layered on
top of the new core formulas (not overwritten by them) - the warning now
also checks the site's real worst calendar month (via the seasonal yield
profile above) against that month's actual metered demand, in addition to
the generator-backup and generator-sizing checks.

## Default assumption values (all editable in-app)

| Assumption | Default | Source |
|---|---|---|
| Battery DoD | 90% | Workbook |
| Battery round-trip efficiency | 95% | Workbook (combines battery + PCS) |
| Battery design margin | 1.0x | Workbook |
| Battery worst-month rounding step | 5 kWh | Workbook |
| Battery annual-average rounding step | 10 kWh | Workbook |
| Solar Peak Sun Hours (Hybrid) | 4.5 hr/day | Workbook |
| Solar panel derating (Hybrid) | 80% | Workbook |
| Solar specific yield (Hybrid) | 4 kWh/kWp/day | Workbook (Solar Sizing sheet's own figure) |
| Solar-to-consumption ratio (Grid-Tied) | 50% | Solar calc - claude.xlsx, 'Solar Grid Tied Calc'!B2 |
| Annual specific yield (Grid-Tied & chart) | 1,565.36 kWh/kWp/yr | Solar calc - claude.xlsx, 'kWhkWp' table average (sheet's own separate Grid-Tied estimate is 1,550 - flagged above) |
| Panel wattage | 620 Wp | Workbook |
| Off-grid battery coverage ratio | 85% | Solar calc - claude.xlsx, 'Off-Grid'!B3 factor - unlabeled, flagged above |
| Off-grid battery install margin | 1.2x | Solar calc - claude.xlsx, 'Off-Grid'!B4 |
| Off-grid solar PSH / derating / margin | 4 hr, 80%, 1.1x | Solar calc - claude.xlsx, 'Off-Grid'!B5 |
| Off-grid generator power factor | 0.8 | Industry-standard default (app addition) |
| Eskom High Demand Season months | Jun/Jul/Aug | Eskom RuraFlex definition |

## Multi-project & version history (new)

`src/lib/projects/` adds project + version management: create a new
project, keep prior projects, and create numbered versions (Version 1,
Version 2, ...) within a project - each version is a full snapshot of that
project's inputs/assumptions. Persisted to the browser's `localStorage` as
the Phase 1 stopgap (per "calculators first, infra after"); Phase 2/3 will
replace this with Postgres-backed persistence without changing the
calculation engine or the shape of a project snapshot (`ProjectData`).

## Open items carried over from the Phase 1 spec doc (unresolved)

These do not block Phase 1 (calculators), but must be resolved before
Phase 2/3 (costing) work begins - see
`Workbook_Analysis_and_Application_Specification.docx`, Section 7:

- Costing module scope: itemised BOQ vs. the workbook's PPA/CAPEX model vs.
  both.
- `Battery Sizing!E19` broken reference (zeroes out battery costs in both
  Costing sheets) - must be fixed before porting costing formulas.
- The two slightly different annual specific-yield figures in "Solar calc -
  claude.xlsx" itself (1,565.36 kWh/kWp/yr table average vs. 1,550 kWh/kWp/yr
  typed into 'Solar Grid Tied Calc'!B5) should be reconciled with HolmStone.
- The unlabeled 0.85 "BESS Usable" factor in the 'Off-Grid' sheet needs a
  confirmed definition (coverage ratio? DoD-adjacent? something else?).
