# Implementation Plan: Eventos Domain Business Rules

**Branch**: `005-eventos-domain-rules` (spec dir; git branch may differ) | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-eventos-domain-rules/spec.md`

**Note**: This plan is produced by `/speckit-plan`. Decisions are locked in [research.md](./research.md).

## Summary

Align the shared .NET API and three frontends (Vue, React, Angular) with the canonical ProEventos domain rules: Evento / Lote / Palestrante / Rede Social CRUD and relationships, cascade delete on evento removal, theme and speaker search, many-to-many evento–palestrante linking, plus didactic Identity/auth (register, login, profile, password change, protected edit routes, credential on requests). Prefer extending existing Minimal API endpoints and client feature folders over new stacks. Business rules stay on the server; clients mirror UX only.

## Technical Context

**Language/Version**: C# / .NET 10 (`net10.0`); TypeScript ~5.x; Vue 3.5; React 19; Angular 21

**Primary Dependencies**: ASP.NET Core Minimal APIs + EF Core (SQLite) + Mapster; ASP.NET Core Identity + JWT Bearer for auth; Vue Router / React Router / Angular Router; existing form patterns from `003`; Vitest per frontend; xUnit/API tests under `Back/tests`

**Storage**: SQLite via `ProEventos.Persistence` (`DataContext`); Identity tables co-located in same DB for didactic simplicity

**Testing**: `dotnet test` for API/services/persistence; `pnpm test` / coverage gates per frontend (`002-coverage-gate`); prefer contract + critical journey coverage over UI snapshots

**Target Platform**: Local study apps — API ~5000/5001; React 3000; Vue 5173; Angular 4200

**Project Type**: Monorepo — one shared API + three independent SPAs

**Performance Goals**: Interactive CRUD and auth flows feel immediate for local single-user study (no hard throughput targets)

**Constraints**: Constitution v2.0.0 — Contatos and premium redesign forbidden; auth in scope because this spec requires it; no tickets/payments/capacity/approval; no per-frontend API forks; keep didactic simplicity (no SSO/IdP sprawl)

**Scale/Scope**: Six domain areas (Eventos, Lotes, Palestrantes, Redes Sociais, User, Auth) across API + three frontends; gap-fill validations and missing search/link/auth surfaces more than greenfield CRUD

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (ProEventos v2.0.0):

- [x] **Shared API Contract**: One backend; auth and domain rules enforced in API; clients consume same routes/payloads
- [x] **Frontend Independence**: Vue / React / Angular each implement auth + CRUD in their own toolchain; no cross-framework UI package
- [x] **Domain Focus**: Eventos and related resources (lotes, redes, palestrantes, user/auth for maintenance); no Contatos
- [x] **Didactic Simplicity**: JWT + Identity minimal setup; clean existing UI patterns; no premium redesign
- [x] **Feature Parity**: Spec requires same behaviors on all three frontends (including auth)
- [x] **Out of scope respected**: Contatos / premium redesign excluded; Identity/auth included because this feature spec explicitly requires FR-021–FR-025

Any failed gate MUST be justified in Complexity Tracking or the plan MUST be revised.

**Post-design re-check**: Still pass — [data-model.md](./data-model.md) and [contracts/](./contracts/) describe shared API entities and auth without Contatos or redesign; [quickstart.md](./quickstart.md) validates API + one-frontend happy path with parity checklist for the other two.

## Project Structure

### Documentation (this feature)

```text
specs/005-eventos-domain-rules/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 — OpenAPI (auth + domain deltas)
└── tasks.md             # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
Back/src/
├── ProEventos.Api/                 # Minimal API endpoints + JWT middleware
│   └── Endpoints/                  # Evento, Lote, Palestrante, RedeSocial, Account (new)
├── ProEventos.Domain/Entities/     # + User/Identity integration as needed
├── ProEventos.Persistence/         # DataContext, migrations/EnsureCreated, seeds
├── ProEventos.Services/            # DTO validation, Account/Token services
└── ProEventos.CrossCutting/        # DI for Identity/JWT + existing services

Back/tests/
├── ProEventos.Api.Tests/
├── ProEventos.Services.Tests/
└── ProEventos.Persistence.Tests/

Front/
├── Front-Vue/src/                  # feature folders, services, router guards, auth interceptor
├── Front-React/src/                # same conceptual areas
└── Front-Angular/src/app/          # same + HttpInterceptor / canActivate
```

**Structure Decision**: Touch the shared API first (validations, search/link, auth, `[Authorize]` on mutating routes). Then wire each frontend independently: account screens (activate stubs), session storage of access credential, HTTP interceptor, route guards on edit/profile. Preserve feature-based layout from `004` where already applied; do not invent a fourth frontend or shared UI library.

## Complexity Tracking

> No constitution violations requiring justification.
