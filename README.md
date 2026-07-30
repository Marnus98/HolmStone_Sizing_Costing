# Mardale Solar & Battery Sizing - Phase 1

Web application replicating and correcting the calculation methodology from
`Project Sizing and Costing - Mardale Apple Farm.xlsx`. This is the **Phase 1**
build agreed with HolmStone: input capture, consumption analysis, and the
Battery / Solar / Off-grid sizing calculators for all three system types.
Database persistence, authentication, supplier cost import (Phase 2) and the
itemised BOQ costing module (Phase 3) are **not yet built** - see "What's
deferred" below.

## What's built

- **Inputs** (`/inputs`) - Section 1 (municipal bill history: manual entry,
  paste-from-Excel, or CSV upload) and Section 2 (tariff structure).
- **Consumption Analysis** (`/consumption`) - Section 3 & 4, auto-calculated
  monthly/annual consumption and cost, with bar and pie charts (Recharts).
- **Battery Sizing** (`/battery`) - Worst-Month and Annual-Average scenarios,
  hidden for Solar PV-only projects.
- **Solar Sizing** (`/solar`) - shared engine for Hybrid and Solar PV-only.
- **Off-Grid Sizing** (`/offgrid`) - new methodology (not in the source
  workbook), with an undersized-system warning.
- **System Type selector** (`/`) on the Project Details page, which drives
  which sections/pages are shown, per the application brief.
- The app is seeded with the **real Mardale Apple Farm billing data** from
  the source workbook, so every number on screen can be checked against the
  original file directly.

## Calculation engine - validated against the workbook

All formulas live in `src/lib/calculations/*.ts` as pure, dependency-free
TypeScript functions (no UI code mixed in), each with a doc comment citing
its source cell range in the workbook. `scripts/validate-calculations.ts`
runs the engine against the real Mardale data and checks the results against
the values Excel itself produced:

```bash
node --experimental-strip-types scripts/validate-calculations.ts
```

Current result: **21/21 checks pass** - annual/monthly consumption and cost,
both Battery Sizing scenarios, and Solar Sizing (Hybrid) all match the
workbook's own output. The Off-Grid module has no workbook baseline (see
`docs/assumptions.md`) so it's checked for sane, non-zero output and a
working undersized-warning instead.

## Deliberate corrections vs. the workbook

Every place this engine's logic differs from the workbook's literal formulas
is documented in the source file's doc comment **and** in
`docs/assumptions.md`, per the instruction to flag rather than silently
change anything that looked wrong. In short:

- Section 3's fragile month-to-bill-row mapping is replaced with a robust
  calendar-month aggregation (verified to produce identical annual totals).
- The Battery Sizing scenario formulas' inconsistent hour-basis is unified.
- The Solar Sizing daytime-offset default's confusing `IF(C7=0, 40%, C14)`
  toggle is replaced with a plain, always-editable input, pre-filled to match
  the workbook's own effective defaults per system type.
- Two different inverter-sizing methods in the workbook (Battery Sizing's own
  discharge-power-based rating vs. Solar Sizing's kVA-demand-based rating)
  are both surfaced explicitly, rather than the app silently picking one.
- `Inputs!AF16:AF17`'s dropped Network Access Charge term is fixed to be
  consistent with every other row.

None of the Costing/LCOE/PPA sheet bugs (e.g. the `Battery Sizing!E19`
broken reference) are relevant yet, since costing is Phase 2/3.

## Known limitation: local `npm install` in this build environment

This project was scaffolded and coded in a sandboxed environment whose
package-registry access made a full `npm install` of the Next.js + Tailwind
toolchain impractically slow (large native binaries - `@next/swc-*`,
`lightningcss-*` - could not be extracted reliably; a direct download of the
same file via `curl` took 3 seconds, so this is a sandbox filesystem/syscall
constraint, not a real network problem). **The calculation engine itself was
fully installed, run, and validated (21/21 passing)** using Node's built-in
TypeScript support (`node --experimental-strip-types`), which needs no
`npm install` at all - so the numbers above are real, not theoretical.

The UI code (`src/app/**`, `src/components/**`) was written and carefully
reviewed but **could not be smoke-tested in a running dev server** in this
environment. Please run the following in your own machine or let Render's
build step do it (both will have normal package-registry performance):

```bash
npm install
npm run dev
```

If anything doesn't compile, it's most likely a small import/typo issue -
please flag it and it'll be fixed immediately in the next iteration.

## What's deferred (per the agreed phased plan)

- **Phase 2**: supplier cost import (rates/pricing from supplier price
  lists), database persistence (PostgreSQL + Prisma), multi-project and
  version history, authentication and roles.
- **Phase 3**: itemised BOQ costing module, LCOE/financial module, PDF/Excel
  reports, dashboard, version comparison.

See `Workbook_Analysis_and_Application_Specification.docx` (delivered
separately) for the full database schema, page list, tech stack and
deployment architecture proposed for those phases.

## Local development

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Project structure

```
src/
  app/                  Next.js App Router pages (one per module)
  components/            Nav + shared UI primitives (NumberField, Card, etc.)
  lib/
    calculations/         Pure calculation-engine modules (the source of truth)
    context/               In-memory project state (Phase 1 - no DB yet)
    seed/                  Real Mardale Apple Farm demo data
    format.ts              ZAR / number / percentage formatting helpers
scripts/
  validate-calculations.ts  Golden-value tests against the workbook
docs/
  assumptions.md            Every assumption and correction, in one place
```
