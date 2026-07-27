# Implementation Plan: Multi-Frontend Eventos Study Platform

**Branch**: `001-multi-front-eventos` | **Date**: 2026-07-24 (amended: unit tests) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-multi-front-eventos/spec.md`

**Note**: This plan is produced by `/speckit-plan`.

## Summary

Upgrade the shared ProEventos backend to .NET Minimal APIs (Mapster, EF Core + SQLite, Scalar OpenAPI), fix Evento create/update bugs, complete Palestrante and RedeSocial, and expose stable routes for three independent study frontends under `Front/` (`Front-Vue`, `Front-React`, `Front-Angular`) with the same CRUD flows, CORS for all three origins, **pnpm workspace**, README coverage at root and per folder, and **unit tests for backend services and each frontend** (no cross-front E2E).

## Technical Context

**Language/Version**: C# / .NET (API TFM `net10.0`); TypeScript on all frontends; Vue 3.5; React 19 + Vite 6; Angular 21 LTS standalone

**Primary Dependencies**: ASP.NET Core Minimal APIs, EF Core, SQLite, Mapster, Scalar; Vue 3 + Vite 6 + Element Plus + Axios; React + Vite + React Router; Angular HttpClient + standalone components (+ plain CSS — one system only); **pnpm** with **independent** `package.json` per frontend

**Storage**: SQLite via EF Core (`ConnectionStrings:Default`)

**Testing**: **Required unit tests** (see research.md §13) plus local **80% coverage gates** (`specs/002-coverage-gate/`):
- Backend: xUnit + Moq (+ FluentAssertions optional) in `Back/tests/ProEventos.Services.Tests` (and Persistence.Tests / Api.Tests for per-layer Coverlet thresholds)
- Front-Vue / Front-React / Front-Angular: Vitest + `@vitest/coverage-v8` with `pnpm test:coverage` thresholds 80
- Still **out of scope**: E2E cross-front, Playwright/Cypress suites spanning all three apps; CI coverage workflows
- Manual Scalar + UI smoke remains for integration confidence

**Target Platform**: Local development (macOS/Windows/Linux): Kestrel API + browser frontends

**Project Type**: Monorepo — one Web API + three independent SPAs/apps

**Performance Goals**: Study-scale only (dozens of eventos/palestrantes); p95 latency not a hard gate

**Constraints**: No Identity/JWT; no Contatos; didactic UI only; no shared npm types package; no Docker/deploy; no E2E cross-front in this feature

**Scale/Scope**: 4 API contexts (Evento, Lote, Palestrante, RedeSocial); ~3 screens × 3 frontends; login/registro shell only; unit tests with local **80% coverage gates** per layer/app (`specs/002-coverage-gate/`) — real tests, not coverage theater

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (ProEventos v1.0.0+):

- [x] **Shared API Contract**: One backend; no client-specific API forks; business rules stay on the server
- [x] **Frontend Independence**: Vue / React / Angular stay separate apps; no cross-framework UI packages; each keeps own models
- [x] **Domain Focus**: Eventos + lotes + palestrantes + redes; Contatos excluded
- [x] **Didactic Simplicity**: Clean admin UI; one accent; one UI kit per app; no premium redesign; unit tests stay teaching-oriented with an honest local 80% gate (no coverage theater / exclusion gaming)
- [x] **Feature Parity**: Same CRUD flows planned for all three frontends; each frontend ships its own unit-test toolchain
- [x] **Out of scope respected**: No Identity/JWT delivery; Contatos out; no Docker; no E2E cross-front (unit tests are in scope by amended spec)

Any failed gate MUST be justified in Complexity Tracking or the plan MUST be revised.

**Post-design re-check**: Still pass — contracts are shared HTTP paths; three apps + per-app unit tests are intentional study structure (see Complexity Tracking).

## Project Structure

### Documentation (this feature)

```text
specs/001-multi-front-eventos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (repository root)

```text
ProEventos/
├── README.md
├── Back/
│   ├── README.md
│   ├── src/
│   │   ├── ProEventos.Api/
│   │   │   ├── Endpoints/          # Evento, Lote, Palestrante, RedeSocial
│   │   │   ├── Program.cs          # .NET 8 minimal hosting (no Startup Controllers)
│   │   │   └── ...
│   │   ├── ProEventos.Application/
│   │   ├── ProEventos.Domain/
│   │   ├── ProEventos.Persistence/
│   │   ├── ProEventos.Services/    # Mapster mappings replace AutoMapper
│   │   └── ProEventos.CrossCutting/
│   └── tests/
│       └── ProEventos.Services.Tests/   # xUnit unit tests (primary)
├── Front/
│   ├── Front-Vue/                  # Vue 3 + Vite (own package.json)
│   │   ├── package.json
│   │   ├── README.md
│   │   └── src/**/*.spec.ts        # Vitest
│   ├── Front-React/                # React + Vite + React Router (own package.json)
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── .env.example            # VITE_API_URL
│   │   └── src/**/*.{test,spec}.{ts,tsx}
│   └── Front-Angular/              # own package.json
│       ├── package.json
│       ├── README.md
│       ├── src/environments/environment.ts  # apiUrl
│       └── src/**/*.spec.ts        # Vitest
```

**Structure Decision**: Keep layered .NET solution under `Back/src` with a sibling `Back/tests` unit-test project. Frontends live under `Front/` as independent apps (`Front-Vue`, `Front-React`, `Front-Angular`), each with its own `package.json` — install and run with `pnpm` **inside that folder**. Root README explains ports and per-folder commands; folder READMEs are thin “how to run / how to test” pointers.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Three frontend apps | Explicit study goal: compare Vue vs React vs Angular on one API | Single frontend would defeat the comparison |
| Separate models per frontend (no shared types package) | Didactic clarity per framework stack | Shared package couples apps and hides framework-specific typing patterns |
| Four unit-test toolchains (xUnit + Vitest×3) | Matches each stack’s idiomatic test story for learners | One shared runner across fronts would blur framework differences |

## Implementation Order

1. Reorganize folders + root README skeleton  
2. Backend Minimal APIs + Mapster + full CRUD + CORS  
3. Backend unit tests (services; Evento create/update regression)  
4. Complete/update Front-Vue (behavior reference) + Vitest unit tests  
5. Scaffold Front-React (Vite) with same CRUD + Vitest unit tests  
6. Scaffold Front-Angular with same CRUD + Vitest specs  
7. Finish READMEs; smoke-check all three fronts against API; run all unit-test suites green  

## Dev Ports (CORS allowlist)

| App | Suggested port | API base URL (example) |
|-----|----------------|------------------------|
| API (Kestrel) | `5000` / `5001` | — |
| API (IIS Express legacy) | `44374` | — |
| Front-Vue | `5173` | `https://localhost:5001` or `http://localhost:5000` |
| Front-React | `3000` | same |
| Front-Angular | `4200` | same |
