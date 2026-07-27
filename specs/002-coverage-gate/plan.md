# Implementation Plan: 80% Coverage Gate

**Branch**: `002-coverage-gate` (spec dir; current git branch may still be `001-multi-front-eventos`) | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-coverage-gate/spec.md`

**Note**: This plan is produced by `/speckit-plan`. Measurement architecture and tooling choices were closed in the plan command input.

## Summary

Enforce a **local** ≥80% coverage gate on every backend coverage unit (Services; Persistence+Domain; Api+CrossCutting) and on each frontend app (Vue, React, Angular) using **native thresholds** (Coverlet + Vitest/`@vitest/coverage-v8`) plus **real tests**—not exclusion gaming. Documented commands must fail below threshold; **no CI workflows**. Amend `001-multi-front-eventos` artifacts that currently ban %-gates. Prefer removing unused empty `ProEventos.Application` (stub `Class1.cs`, not in solution) rather than gating false coverage.

## Technical Context

**Language/Version**: C# / .NET (`net10.0` for Back); TypeScript on Front-Vue, Front-React, Front-Angular

**Primary Dependencies**: xUnit + Moq + FluentAssertions; Coverlet (`coverlet.collector` + threshold via `.runsettings` and/or MSBuild props); Microsoft.AspNetCore.Mvc.Testing (`WebApplicationFactory`); EF Core InMemory for Persistence tests; Vitest + `@vitest/coverage-v8` on all three fronts; existing Vue Test Utils / Testing Library / Angular testing helpers

**Storage**: N/A for gate itself; Persistence tests use EF InMemory against `DataContext` (not production SQLite file)

**Testing**: Backend — three test projects (expand Services.Tests; add Persistence.Tests; add Api.Tests), Coverlet Threshold=80 for line+branch+method (statements ≈ lines where Coverlet does not expose a separate dimension). Frontend — `pnpm test:coverage` per app with thresholds lines/functions/branches/statements = 80

**Target Platform**: Local development (macOS/Windows/Linux); developers run gates on their machines

**Project Type**: Monorepo quality/enforcement feature over existing Web API + three SPAs

**Performance Goals**: Study-scale; coverage runs need only complete in normal local feedback time (order of minutes), not a hard latency SLO

**Constraints**: Minimal exclusions only (EF Migrations, `*.Designer.cs`, `*.d.ts`, CSS, test setup); do **not** exclude Program/startup, pages, Persistence, DI, routers; no `.github/workflows` coverage jobs; no mutation testing; no coverage theater (empty tests / broad excludes)

**Scale/Scope**: 3 backend coverage units + 3 frontend apps; expand existing ~12 Services tests and ~2 specs/app until each unit passes native 80% gates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (ProEventos v1.0.0+):

- [x] **Shared API Contract**: No API shape changes required; Api.Tests exercise existing shared HTTP contract
- [x] **Frontend Independence**: Coverage config and tests stay per-app under `Front/Front-*`; no shared UI package
- [x] **Domain Focus**: Tests cover Evento/Lote/Palestrante/RedeSocial paths already in product scope; no Contatos
- [x] **Didactic Simplicity**: Gate teaches honest testing; real behavioral tests required; expansive exclusions and trivial assert-only “coverage filler” remain forbidden
- [x] **Feature Parity**: All three frontends get the same 80% local gate and comparable test breadth
- [x] **Out of scope respected**: No Identity/JWT delivery; login/registro **shell** may be covered by UI unit tests as existing didactic stubs only; no Contatos; no CI; no premium redesign

Any failed gate MUST be justified in Complexity Tracking or the plan MUST be revised.

**Post-design re-check**: Still pass — contracts are local command contracts only; new test projects are justified in Complexity Tracking; Application stub removal reduces noise rather than adding layers.

## Project Structure

### Documentation (this feature)

```text
specs/002-coverage-gate/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 — local coverage command contract
└── tasks.md             # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
Back/
├── README.md                              # document coverage command from ProEventos.sln
├── coverlet.runsettings                   # shared Format/ExcludeByFile + threshold config (or per-test props)
├── src/
│   ├── ProEventos.sln                     # register Persistence.Tests + Api.Tests; keep Application out / remove stub
│   ├── ProEventos.Api/
│   ├── ProEventos.Application/            # REMOVE preferred (unused Class1 stub, not in sln)
│   ├── ProEventos.Domain/                 # gated via Persistence.Tests Include
│   ├── ProEventos.Persistence/            # Exclude Migrations/** from denominator
│   ├── ProEventos.Services/
│   └── ProEventos.CrossCutting/           # gated via Api.Tests Include (ConfigureService/Repository)
└── tests/
    ├── ProEventos.Services.Tests/         # expand; Include=[ProEventos.Services]*
    ├── ProEventos.Persistence.Tests/      # NEW; Include Persistence+Domain; InMemory EF
    └── ProEventos.Api.Tests/              # NEW; WebApplicationFactory; Include Api+CrossCutting

Front/
├── Front-Vue/     # @vitest/coverage-v8 + test:coverage + thresholds; expand specs
├── Front-React/   # same
└── Front-Angular/ # same (vitest.config.ts)

specs/001-multi-front-eventos/
├── spec.md / plan.md / research.md        # amend: adopt local 80% gate; remove %-gate ban
```

**Structure Decision**: Measurement units follow the closed flowchart — three backend test projects map to three Coverlet Include scopes; three independent frontend `test:coverage` scripts. Root `.gitignore` already has `**/coverage/`; keep Angular’s `/coverage` as-is.

### Measurement architecture

```text
flowchart LR
  subgraph back [Back local]
    S[Services.Tests]
    P[Persistence.Tests]
    A[Api.Tests]
    S -->|Coverlet Threshold 80| SAsm[ProEventos.Services]
    P -->|Coverlet Threshold 80| PAsm[ProEventos.Persistence plus Domain]
    A -->|Coverlet Threshold 80| AAsm[ProEventos.Api plus CrossCutting]
  end
  subgraph front [Front local]
    V[Front-Vue test:coverage]
    R[Front-React test:coverage]
    G[Front-Angular test:coverage]
    V --> V80[thresholds 80]
    R --> R80[thresholds 80]
    G --> G80[thresholds 80]
  end
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Second and third backend test projects (`Persistence.Tests`, `Api.Tests`) | Per-layer 80% gate requires independent Include scopes and layer-appropriate harnesses (InMemory vs WebApplicationFactory) | Single Services.Tests project cannot honestly instrument Persistence/Api/CrossCutting without dragging unrelated code or faking excludes |
| Api integration-style tests via `WebApplicationFactory` | DI (`ConfigureService` / `ConfigureRepository`) and endpoint maps must stay in the denominator | Pure unit mocks of Minimal API wiring would miss Program/DI paths the spec forbids excluding |

## Implementation order (backend)

1. Add Coverlet + runsettings/props (Threshold=80, line+branch+method, ThresholdStat=total) with per-test-project Include filters.
2. Baseline `dotnet test` with coverage (expect fail) → expand Services.Tests until Services ≥80%.
3. Add Persistence.Tests until Persistence+Domain ≥80% (Migrations excluded).
4. Add Api.Tests until Api+CrossCutting ≥80%.
5. Resolve Application: **remove** unused stub project from tree (preferred; already absent from `.sln`).
6. Document exact command in `Back/README.md` (solution-relative path).

## Implementation order (frontends)

For each of Vue / React / Angular: add `@vitest/coverage-v8`, `test:coverage` script, coverage include/exclude/thresholds block → expand service + page/component + router/App tests until gate passes → README note.

## Documentation / SpecKit amendments

- `001` spec: remove “Hard coverage %-gates” from out-of-scope; add local 80% gate as NFR/FR pointer to `002`.
- `001` plan + research §13: document Coverlet/Vitest thresholds and commands.
- Root / Back / each Front README: coverage commands + fail-on-threshold.
- **No** `.github/workflows`.
