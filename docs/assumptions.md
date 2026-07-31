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
| LCOE interest rate (shared, Solar & Battery) | 10.25% | LCOE - Claude.xlsx |
| LCOE Solar project life | 20 years | LCOE - Claude.xlsx |
| LCOE Solar cost/kWp | R11,000 (ground) / R9,000 (roof) | User-supplied placeholder, no BOQ source yet |
| LCOE Solar maintenance | 3%/yr of CAPEX | LCOE - Claude.xlsx |
| LCOE Solar insurance | 1%/yr of CAPEX | **New app addition** - user-supplied |
| LCOE Solar degradation | 0.55%/yr | LCOE - Claude.xlsx |
| LCOE Battery project life | 15 years | LCOE - Claude.xlsx |
| LCOE Battery DoD | 90% | LCOE - Claude.xlsx |
| LCOE Battery cycles/day | 1 | LCOE - Claude.xlsx |
| LCOE Battery cost/kWh | R4,450 | LCOE - Claude.xlsx (implied), no BOQ source yet |
| LCOE Battery maintenance | 2.5%/yr of CAPEX | LCOE - Claude.xlsx |
| LCOE Battery insurance | 1%/yr of CAPEX | **New app addition** - user-supplied |
| LCOE tariff escalation | 9%/yr | LCOE - Claude.xlsx |

## Eskom tariff catalog (new)

`src/lib/tariffs/` adds a built-in Eskom Non-Local-Authority (NLA - direct
Eskom customer, not billed through a municipality) tariff catalog, sourced
from the uploaded "Eskom-tariffs-1-April-2026-Public.xlsm", covering
Megaflex, Miniflex, Ruraflex, Nightsave Rural and Landrate. Selecting a
tariff (+ transmission zone + voltage + kVA customer-category band, or a
Landrate variant) and clicking "Apply to all months" on the Inputs page
auto-fills every rate field for every bill row plus Section 2's tariff
structure - the user only enters kWh consumption. All rates are captured
**excluding VAT**, matching the convention already used by the app's
Mardale seed data (verified: Ruraflex NLA zone 3 / voltage 1's catalog
values match `mardaleTariff`'s figures exactly - see the golden-value test
"Eskom tariff catalog: Ruraflex NLA, Tx zone > 900km, < 500V", 9/9 pass).

Scope decisions (confirmed with the user):
- **NLA only for this build** - the workbook also has Municipal ("Munic")
  rate tables with different values; not yet wired in. Add if a project is
  actually billed through a municipality rather than directly by Eskom.
- **Every charge line item is modelled**, including the less common ones:
  generation capacity charge, transmission network charge (Megaflex only),
  urban low-voltage subsidy, electrification/rural network subsidy,
  affordability subsidy, and reactive energy - added as new optional fields
  on `MonthlyBillEntry` (default 0, so existing rows/tests are unaffected)
  and included in `computeBillRowTotals`'s `totalBillR`.
- **Nightsave Rural's seasonal "Energy demand charge" (R/kVA/m, varies by
  High/Low season)** is captured in the catalog data but not yet wired into
  a bill row - there's no seasonal-kVA-charge field in the model yet. Minor
  gap, flagged rather than silently dropped.
- **Landrate has no kVA metering concept** - its "network capacity" and
  "generation capacity" charges are R/POD/day, not R/kVA/m, so they're
  folded into `adminChargeRate` alongside its own service/administration
  charge rather than forcing them onto the kVA-based fields.
- **Service and administration charges** are billed R/POD/day per the
  catalog; the Inputs page multiplies by the actual number of days in each
  bill row's calendar month when applying a tariff (28-31 days), rather
  than using a flat monthly figure.

## LCOE & Savings (new)

`src/lib/calculations/lcoe.ts` adds a Levelised Cost of Energy / Levelised
Cost of Storage (LCOE/LCOS) + 20-year savings model, source: "LCOE -
Claude.xlsx" ('LCOE' sheet). Unlike the other reference workbooks, this one
pulled its Solar/BESS size, CAPEX-per-kW/kWh and blended tariff inputs from
two *external* linked workbooks ('[1]Costing Sheet' and '[1]Inputs' - i.e. a
real project's own separately-maintained costing and Inputs tabs) that were
not supplied. Per the brief ("all inputs should be pulled from the system
size tab"), the app instead wires the size inputs straight from this app's
own System Sizing results and Consumption Analysis's blended tariffs. Every
PMT/cost-of-capital/LCOE/LCOS/savings formula is transcribed literally from
the sheet and validated against its own numbers (18 golden-value checks,
`node --experimental-strip-types scripts/validate-calculations.ts`).

Two things were **added** beyond the source sheet, both at the user's
explicit request:

1. **Project insurance** - a new annual cost line, 1% of CAPEX/year by
   default (editable), applied separately to both the Solar and Battery
   blocks alongside their existing maintenance % lines. The source sheet has
   no insurance line at all.
2. **Mounting-type-dependent installed cost/kWp default** - ~R11,000/kWp for
   ground mount, ~R9,000/kWp for roof mount (both editable placeholders, per
   the user's own figures). CAPEX cost/kWp (Solar) and cost/kWh (Battery)
   have **no real source yet** - Phase 2/3's BOQ costing module isn't built -
   so both are plain editable assumptions rather than pulled from a costing
   sheet, and will most likely change once real BOQ costing exists.

One simplification vs. the source sheet, flagged rather than silently
folded in: the sheet technically has **two** separate interest-rate cells
(one for Solar, one for BESS), both defaulting to the same 10.25% with a
currently-zero manual adjustment. The app uses a **single shared** "Interest
rate" input for both annuity calculations - a defensible simplification for
one blended project loan, matching the user's request ("Interest rate can be
adjusted", singular).

One source-sheet quirk, preserved literally rather than "fixed": the
sheet's year-by-year solar-savings row keeps subtracting the battery's
annual energy throughput from solar generation for the ENTIRE horizon (its
`$G$9` reference is absolute), even after the battery's own modelled project
life ends and its own savings column goes to zero - so in later years that
slice of energy earns neither solar nor battery savings. Reproduced exactly
as the source sheet does it (see `lcoe.ts`'s inline comment on
`solarNetGenerationKwh`), not corrected, since it wasn't clear whether this
was intentional or a source-sheet oversight - worth confirming with
HolmStone (added to Open items below).

Also flagged, not silently assumed: for **Off-Grid**, the savings model
reuses the same Blended Standard/Peak avoided-cost approach as Hybrid, shown
with an on-page warning banner - but Off-Grid has no grid connection at all,
so its real "savings" is closer to 100% bill avoidance (less generator fuel
costs, not modelled) rather than TOU peak-shifting savings. Treat the
Off-Grid LCOE page's numbers as an approximation/lower bound pending a
dedicated Off-Grid savings model.

No battery replacement is modelled after the battery's project life expires
(matches the source sheet's own behaviour, see above) - a real proposal
spanning >15 years (default) would need a second battery CAPEX event that
isn't captured here.

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
- LCOE Solar/Battery CAPEX cost/kWp and cost/kWh have no real source yet
  (Phase 2/3's BOQ costing module isn't built) - currently editable
  placeholders (see "LCOE & Savings" section above). Should be wired to real
  supplier costing once Phase 2/3 lands.
- LCOE's source sheet subtracts the battery's annual energy throughput from
  solar generation for the ENTIRE savings horizon, even after the battery's
  own modelled project life ends (see "LCOE & Savings" section above) -
  worth confirming with HolmStone whether that's intentional.
- Off-Grid's LCOE savings currently reuse the same peak-shifting model as
  Hybrid (flagged with an on-page warning) - a dedicated 100%-bill-avoidance
  Off-Grid savings model would be more accurate.
