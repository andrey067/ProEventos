# Implementation Plan: NetDevPack Identity & Palestrante Roles

**Branch**: `007-netdevpack-identity-roles` | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-netdevpack-identity-roles/spec.md`

## Summary

Replace ad-hoc Identity/JWT wiring with **NetDevPack.Identity** (JWT builder, roles/claims, auth pipeline helpers). Link every **Palestrante** to a required **User** via `UserId`. Seed and enforce two mutually exclusive role families: **`User`** (write/maintenance) and **`Palestrante`** (ReadOnly). Preserve one shared HTTP API; frontend UI catch-up is deferred.

## Technical Context

**Language/Version**: C# / .NET 10 (`net10.0` API and related projects)

**Primary Dependencies**: NetDevPack.Identity 8.0.0 (targets net10.0 / net8.0), ASP.NET Core Identity + EF Core Identity stores, Mapster, ErrorOr, existing Minimal API endpoints

**Storage**: SQLite via EF Core `DataContext` : `IdentityDbContext<User>` (keep single context; do not introduce NetDevPackAppDbContext)

**Testing**: xUnit (`Back/tests/ProEventos.Api.Tests`); extend account/endpoint tests for roles and write denial

**Target Platform**: Local didactic API (macOS/Linux/Windows); HTTP for Vue/React/Angular clients

**Project Type**: Web API (layered: Api, Domain, Persistence, Services, CrossCutting) + multi-frontend consumers (UI out of scope this feature)

**Performance Goals**: Didactic; login and authorized CRUD remain interactive (<2s local)

**Constraints**: Constitution v2.0.0 — shared API, didactic simplicity, auth in scope because this spec requires it; no Contatos/premium redesign; no SSO sprawl

**Scale/Scope**: Two roles, User↔Palestrante 1:1 for speakers, authorize existing maintenance endpoints; ~1 new account provision path + seed updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (ProEventos v2.0.0):

- [x] **Shared API Contract**: One backend; OpenAPI delta documents auth response + role policies; no client-specific forks
- [x] **Frontend Independence**: No Vue/React/Angular toolchain coupling; UI deferred in spec
- [x] **Domain Focus**: Eventos-related domain + Identity linkage for Palestrante; no Contatos
- [x] **Didactic Simplicity**: Two roles, NetDevPack helpers instead of custom JWT crypto; no speculative IdP
- [x] **Feature Parity**: Spec marks all frontends **deferred** with explicit catch-up note
- [x] **Out of scope respected**: No Contatos/premium redesign; Identity explicitly required by this feature

Post-design re-check: still pass — contracts keep anonymous GET reads; writes require `User` role; NetDevPack stays behind shared Account endpoints.

## Project Structure

### Documentation (this feature)

```text
specs/007-netdevpack-identity-roles/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md             # (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
Back/src/
├── ProEventos.Api/                 # Program.cs auth pipeline; endpoint policies; OpenAPI
├── ProEventos.Domain/              # User, Palestrante (+ UserId), role name constants
├── ProEventos.Persistence/         # DataContext Fluent API; IdentitySeeds + palestrante seed
├── ProEventos.Services/            # AccountService via IJwtBuilder; role assignment; DTOs
└── ProEventos.CrossCutting/        # NetDevPack Identity/JWT DI (replace manual JwtBearer key)

Back/tests/ProEventos.Api.Tests/    # Role-aware auth + write denial tests

Front/ / Front-React/ / Front-Angular/   # not modified in this feature
```

**Structure Decision**: Backend-only. Touch Api, Domain, Persistence, Services, CrossCutting, and API tests. Frontends consume the documented contract later.

## Complexity Tracking

> No constitution violations requiring justification.
