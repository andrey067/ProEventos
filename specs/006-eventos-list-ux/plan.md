# Implementation Plan: Eventos List UX, Pagination & Lotes Cards

**Branch**: `006-eventos-list-ux` (spec dir; git branch may differ) | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-eventos-list-ux/spec.md`

**Note**: This plan is produced by `/speckit-plan`. Decisions are locked in [research.md](./research.md).

## Summary

Enrich the shared study experience across Vue, React, and Angular: eventos list gains an Unsplash thumbnail column (left of Tema) with hide/show, client-side pagination (10/20/30), and `dd/MM/yyyy` dates everywhere; edit screens show one labeled card per lote with início/fim dates; backend Bogus seeds ≥50 eventos with coherent lotes and Unsplash `imagemURL`s. Relax `ImagemURL` validation for HTTPS URLs. No new auth flows; Contatos/premium redesign stay out of scope.

## Technical Context

**Language/Version**: C# / .NET 10 (`net10.0`); TypeScript ~5.x; Vue 3.5; React 19; Angular 21

**Primary Dependencies**: ASP.NET Core Minimal APIs + EF Core (SQLite) + Mapster + Bogus (seeds); existing frontend form stacks (Zod / VeeValidate / Reactive Forms); Vitest; xUnit

**Storage**: SQLite via `ProEventos.Persistence`; seed upgrade in `EventoSeeds`

**Testing**: `dotnet test` for DTO validation / seed volume smoke; frontend unit tests for date helpers and pagination slicing; prefer critical journey over snapshots

**Target Platform**: Local study — API ~5000/5001; React 3000; Vue 5173; Angular 4200

**Project Type**: Monorepo — one shared API + three independent SPAs

**Performance Goals**: List of ~50–80 eventos feels immediate with client pagination; image failures must not block rows

**Constraints**: Constitution v2.0.0 — Contatos / premium redesign forbidden; no new Identity scope; never send ProEventos JWT to Unsplash; didactic UI only; shared HTTP contract (array list unchanged; clients paginate)

**Scale/Scope**: API seed + ImagemURL validation; list + edit UX on three frontends; date formatting helpers per app

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (ProEventos v2.0.0):

- [x] **Shared API Contract**: One backend; list remains shared array contract; ImagemURL rule updated once for all clients
- [x] **Frontend Independence**: Vue / React / Angular each implement list pagination, image column, date helpers, lote cards; no cross-framework UI package
- [x] **Domain Focus**: Eventos + lotes list/edit; Unsplash only as event image source
- [x] **Didactic Simplicity**: Client pagination; seeded CDN URLs; no Unsplash proxy microservice; clean existing UI patterns
- [x] **Feature Parity**: Spec requires same UX on all three frontends
- [x] **Out of scope respected**: Contatos / premium redesign excluded; no new auth feature

Any failed gate MUST be justified in Complexity Tracking or the plan MUST be revised.

**Post-design re-check**: Still pass — [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md) stay within eventos/lotes, shared contract, and didactic UI without Contatos or redesign.

## Project Structure

### Documentation (this feature)

```text
specs/006-eventos-list-ux/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 — OpenAPI delta + client UX contract
└── tasks.md             # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
Back/src/
├── ProEventos.Api/                 # unchanged routes (list still GET /eventos)
├── ProEventos.Domain/Entities/     # Evento.ImagemURL / Lote dates as-is
├── ProEventos.Persistence/Seeds/   # EventoSeeds Bogus ≥50 + Unsplash URLs
├── ProEventos.Services/Dtos/       # Relax EventoDto.ImagemURL validation
└── ProEventos.CrossCutting/

Back/tests/                         # seed volume / ImagemURL validation tests

Front/
├── Front-Vue/src/                  # list column, pagination, dates, lote cards
├── Front-React/src/                # same conceptual areas
└── Front-Angular/src/app/          # same conceptual areas
```

**Structure Decision**: Backend first (Bogus seed + ImagemURL validation). Then each frontend independently: date helpers → list image column + hide/show + pagination → edit lote cards with labeled início/fim. Preserve feature-folder layout from `004`. Do not add a fourth frontend or shared UI library.

## Complexity Tracking

> No constitution violations requiring justification.
