# Implementation Plan: Test Strategy

**Branch**: `016-test-strategy` (spec dir; current git branch may differ) | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-test-strategy/spec.md`

**Note**: This plan is produced by `/speckit-plan`. It supersedes `002-coverage-gate` for threshold (90%) and enforcement (CI + local).

## Summary

Raise the existing per-unit Coverlet / Vitest coverage gates from **80% → 90%**, enforce them in **GitHub Actions** on every pull request and on `main`, add a simple **coverage ratchet** so PRs cannot lower a unit’s measured coverage, and codify the **test pyramid** plus “no feature/bug without tests” as project policy (constitution + contributor docs). Expand real unit/integration tests as needed to clear 90%; add a **thin Playwright E2E** layer for named critical journeys only.

## Technical Context

**Language/Version**: C# / .NET (`net10.0` for Back); TypeScript on Front-Vue, Front-React, Front-Angular

**Primary Dependencies**: Existing xUnit + Moq + FluentAssertions + Coverlet; Vitest + `@vitest/coverage-v8`; Microsoft.AspNetCore.Mvc.Testing; EF Core InMemory; **new**: GitHub Actions workflows; **new**: Playwright (devDependency) for thin E2E; optional small Node/shell script to compare Cobertura / Vitest summary vs `quality/coverage-baselines.json`

**Storage**: N/A for gates; Persistence tests keep EF InMemory; no production DB access from frontends

**Testing**: Backend — three existing test projects (`Services.Tests`, `Persistence.Tests`, `Api.Tests`) with Coverlet Threshold=**90** (line, branch, method; statements ≡ lines for Coverlet). Frontend — `pnpm test:coverage` per app with thresholds **90** on lines/functions/branches/statements. Integration — Api.Tests + Persistence.Tests remain the integration band. E2E — Playwright critical journeys only (login where present, Eventos list/create, Palestrantes list/create).

**Target Platform**: Local macOS/Windows/Linux + GitHub-hosted CI (ubuntu-latest)

**Project Type**: Monorepo quality/enforcement feature over existing Web API + three SPAs

**Performance Goals**: Full CI (unit + coverage + thin E2E) completes in normal study-repo time (target &lt; 20 minutes wall); unit/coverage jobs remain the fast feedback path

**Constraints**: Minimal exclusions only (EF Migrations, `*.Designer.cs`, `*.d.ts`, CSS, test setup)—**remove** non-approved excludes such as `AccountService.cs` from Coverlet; do not exclude Program/startup, pages, Persistence, DI, routers; no mutation testing; no coverage theater; pyramid ratio is guidance (not a CI hard fail); Contatos / premium redesign out of scope

**Scale/Scope**: 3 backend coverage units + 3 frontend apps + thin E2E suite; constitution Testing clause amended from “optional” to mandatory 90% strategy; READMEs and `002` docs marked superseded

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (ProEventos v2.0.0+):

- [x] **Shared API Contract**: No HTTP contract forks; Api.Tests / E2E exercise the shared API only
- [x] **Frontend Independence**: Coverage config, scripts, and E2E targets stay per-app under `Front/Front-*`; no shared UI package
- [x] **Domain Focus**: Tests and E2E journeys cover Eventos / Palestrantes (and related) already in product scope; no Contatos
- [x] **Didactic Simplicity**: Reuse Coverlet/Vitest already in tree; one GitHub Actions workflow family; ratchet via a committed JSON baseline—not a heavy SaaS; real behavioral tests required to hit 90%
- [x] **Feature Parity**: All three frontends get the same ≥90% gate and pyramid guidance; critical E2E journeys run against each app (or matrix)
- [x] **Out of scope respected**: No Contatos; no premium redesign; auth only as existing flows under E2E (no new IdP)

Any failed gate MUST be justified in Complexity Tracking or the plan MUST be revised.

**Post-design re-check**: Still pass — contracts are CLI/CI quality contracts (not product API changes); constitution MINOR amendment for Testing is required delivery work, not a gate violation; Complexity Tracking records CI + Playwright + baseline ratchet as justified additions.

## Project Structure

### Documentation (this feature)

```text
specs/016-test-strategy/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 — local + CI gate contracts + pyramid policy
└── tasks.md             # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
Back/
├── coverlet.runsettings                 # Threshold 90; approved excludes only
├── README.md                            # document 90% local + CI
├── src/ProEventos.sln
└── tests/
    ├── ProEventos.Services.Tests/       # Threshold 90; line,branch,method
    ├── ProEventos.Persistence.Tests/    # Threshold 90; line,branch,method
    └── ProEventos.Api.Tests/            # Threshold 90; line,branch,method

Front/
├── Front-Vue/                           # vitest thresholds 90; expand tests
├── Front-React/                         # same
└── Front-Angular/                       # same

.github/workflows/
├── ci.yml                               # PR + main: backend + 3 fronts coverage
└── e2e.yml                              # PR + main: thin Playwright (critical journeys)

quality/
├── coverage-baselines.json              # per-unit last known % on main (ratchet)
└── compare-coverage.mjs                 # fail if current < baseline or < 90

e2e/                                     # Playwright project (repo root or Back-adjacent)
├── playwright.config.ts
└── tests/                               # critical journeys only

.specify/memory/constitution.md          # MINOR: Testing mandatory / 90% strategy
CONTRIBUTING.md or docs/testing.md       # pyramid + feature/bug test rules
```

**Structure Decision**: Keep the three backend Coverlet Include scopes and three frontend `test:coverage` scripts from `002-coverage-gate`. Change threshold to **90**, add CI that runs the same commands, add baseline ratchet for FR-006, add thin Playwright for FR-009/012, and amend constitution + docs so this feature is the single source of truth (superseding `002`).

### Measurement architecture

```text
flowchart TB
  subgraph local [Local]
    BT[dotnet test + Coverlet 90]
    FT[pnpm test:coverage x3]
  end
  subgraph ci [GitHub Actions]
    J1[Backend coverage job]
    J2[Front-Vue coverage]
    J3[Front-React coverage]
    J4[Front-Angular coverage]
    J5[Compare vs baselines.json]
    J6[Playwright E2E critical]
    J1 --> J5
    J2 --> J5
    J3 --> J5
    J4 --> J5
  end
  local --> ci
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| GitHub Actions CI workflows | FR-004/FR-005 require automated fail on PR and main | Local-only 80% gate (`002`) does not block merges |
| Playwright E2E project | FR-009/FR-012 require a thin critical-journey layer (~10%) | Relying only on Vitest component tests leaves no true user-journey band |
| `quality/coverage-baselines.json` ratchet | FR-006 maintain-or-increase per project | Absolute 90% alone allows dropping from 95%→90%; external SaaS (Codecov) adds vendor lock-in for a study repo |
| Constitution Testing amendment | Spec assumes tests are mandatory; constitution still says optional | Leaving the conflict would make reviews cite contradictory sources of truth |
