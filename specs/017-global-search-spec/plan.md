# Implementation Plan: Global Search (Specification Pattern + Debounce)

**Branch**: `017-global-search-spec` (spec dir; checkout when implementing) | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-global-search-spec/spec.md`

**Note**: Created because `/speckit-plan` arguments targeted global search / Specification / debounce while `feature.json` previously pointed at `016-test-strategy`. This feature supersedes theme/name-only list filters with a shared global term.

## Summary

Replace field-specific list filters (`tema` on Eventos; `nome`/`tema` on Palestrantes) with a **single global search term** (`q`) that matches multiple text fields via **Specification pattern** types applied in repositories. Keep server-side pagination unchanged. On all three frontends, **debounce** the search input (~350 ms), with **immediate** search on submit and clear. Migrate list UIs and HTTP clients to `q` in the same delivery so the shared contract stays coherent.

## Technical Context

**Language/Version**: C# / .NET (`net10.0` Back); TypeScript on Front-Vue, Front-React, Front-Angular

**Primary Dependencies**: EF Core + existing layered API (Domain / Persistence / Services / Api); frontends: Vue 3, React, Angular (rxjs already present for Angular `debounceTime`); no new third-party Specification library

**Storage**: Existing SQLite/EF `DataContext`; no schema migration required (search is query-only)

**Testing**: Backend — Persistence/Services/Api tests for specification match fields + paged `q` param; Frontend — list component/service tests for debounce timing helpers, immediate submit/clear, and `q` query wiring (Vitest / Angular TestBed as already used)

**Target Platform**: Local study stack (API + three SPAs)

**Project Type**: Monorepo Web API + three independent SPAs

**Performance Goals**: Debounce keeps typing under ~1 list request per pause; EF queries remain contains/OR over indexed-enough SQLite study data (no full-text engine)

**Constraints**: Didactic thin Specification (interface + expression criteria); shared HTTP contract only; no Contatos; no premium UI; no cross-frontend shared debounce package — same interval and behavior, idiomatic per framework

**Scale/Scope**: Eventos + Palestrantes list endpoints and list screens on Vue / React / Angular; Domain specifications + repository wiring; contract docs under this feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (ProEventos v2.0.0+):

- [x] **Shared API Contract**: One `q` (plus documented legacy aliases during cutover); same match semantics for all clients; filter rules live in server Specifications
- [x] **Frontend Independence**: Debounce implemented per app (rxjs / timer hook / Vue watch); no shared UI package
- [x] **Domain Focus**: Eventos and Palestrantes list search only
- [x] **Didactic Simplicity**: Thin hand-rolled Specification; 350 ms debounce; no Elasticsearch/FTS package
- [x] **Feature Parity**: Both lists + debounce on Vue, React, and Angular
- [x] **Out of scope respected**: No Contatos; no premium redesign; auth unchanged

Any failed gate MUST be justified in Complexity Tracking or the plan MUST be revised.

**Post-design re-check**: Still pass — contracts document `q` + Specification application points; Complexity Tracking records Specification as intentional didactic layer (not unjustified sprawl).

## Project Structure

### Documentation (this feature)

```text
specs/017-global-search-spec/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
│   ├── openapi.yaml
│   └── client-search-behavior.md
└── tasks.md             # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
Back/src/
├── ProEventos.Api/Endpoints/          # EventoEndpoints, PalestranteEndpoints — accept q
├── ProEventos.Domain/
│   ├── Entities/
│   ├── Interfaces/Repositories/
│   └── Specifications/                # NEW: ISpecification<T>, EventoGlobalSearchSpec, PalestranteGlobalSearchSpec
├── ProEventos.Persistence/Repository/ # Apply specs in GetPaged*
├── ProEventos.Services/               # Pass q through services/DTOs helpers as needed
└── ProEventos.CrossCutting/

Front/Front-Vue/src/components/{eventos,palestrantes}/
Front/Front-React/src/components/{eventos,palestrantes}/
Front/Front-Angular/src/app/components/{eventos,palestrantes}/
Front/*/src/services/                  # list params use q
```

**Structure Decision**: Touch Domain (Specifications), Persistence repositories, Api endpoints + Services for param plumbing, and all three frontends’ Eventos/Palestrantes list UIs + HTTP services. No new frontend apps.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Specification types (extra Domain types) | User-required concentration of search rules; didactic DDD pattern | Inline `Where` ORs in each repository method — duplicates Evento vs Palestrante evolution and was explicitly rejected |
| Per-framework debounce helpers | Constitution forbids shared UI package | One shared npm package — violates Frontend Independence |
