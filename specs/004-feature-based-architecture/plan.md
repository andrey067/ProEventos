# Implementation Plan: Feature-Based Frontend Architecture

**Branch**: `004-feature-based-architecture` (spec dir; git branch may differ) | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-feature-based-architecture/spec.md`

**Note**: This plan is produced by `/speckit-plan`. Structural targets are locked in [research.md](./research.md).

## Summary

Reorganize **Front-Vue**, **Front-React**, and **Front-Angular** into a shared conceptual **Feature Based Architecture**: domain feature folders (Eventos, Palestrantes, User stubs), a **models** area for API entity types, and a **shared** area for reusable chrome (nav, modal/confirm, and any existing footer/spinner/pagination). Preserve routes, behavior, styles, API contracts, and the `forms/` work from `003-frontend-forms-refactor`. No backend changes; no Identity/JWT delivery.

## Technical Context

**Language/Version**: TypeScript ~5.6–5.9; Vue 3.5; React 19; Angular 21

**Primary Dependencies**: Existing per-app stacks only (Vue Router / React Router / Angular Router; Vitest; form libs from 003). No new runtime libraries required for folder moves.

**Storage**: N/A (client types + UI structure only)

**Testing**: Vitest per frontend — update import paths in specs colocated with moved screens; keep behavioral assertions; respect `002-coverage-gate` thresholds

**Target Platform**: Local SPA learners; ports unchanged (React 3000, Vue 5173, Angular 4200)

**Project Type**: Three independent frontends in a monorepo study app (shared .NET API unchanged)

**Performance Goals**: N/A beyond “same UX after moves”

**Constraints**: No layout/style redesign; no API/DTO changes; no Contatos; login/perfil remain inert stubs; do not undo 003 forms organization (`forms/` stays); no cross-framework shared packages

**Scale/Scope**: ~Eventos (list + detail/form) + Palestrantes + shared chrome + models on 3 apps; User stubs relocated only where already present

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (ProEventos v1.0.0+):

- [x] **Shared API Contract**: No API/DTO changes; services keep current HTTP payloads
- [x] **Frontend Independence**: Each app reorganizes its own `src/`; no cross-framework package
- [x] **Domain Focus**: Evento / Lote / RedeSocial / Palestrante feature folders only; Contatos untouched/excluded
- [x] **Didactic Simplicity**: Pure structural teaching pattern; no premium UI or speculative meta-framework
- [x] **Feature Parity**: All three frontends adopt features + models + shared
- [x] **Out of scope respected**: User/login moved as stubs only; no JWT; no Contatos; no redesign

Any failed gate MUST be justified in Complexity Tracking or the plan MUST be revised.

**Post-design re-check**: Still pass — contracts describe source-layout and discoverability only; data-model mirrors existing client entity fields; quickstart validates structure + smoke parity without new backend surface.

## Project Structure

### Documentation (this feature)

```text
specs/004-feature-based-architecture/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 — source layout / discoverability
└── tasks.md             # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
Front/
├── Front-Vue/
│   └── src/
│       ├── components/
│       │   ├── eventos/          # list, detalhe, formulário, lotes (already mostly here)
│       │   ├── palestrantes/     # already here
│       │   └── user/             # login/registrar stubs (already here)
│       ├── Models/               # Evento, Lote, RedeSocial, Palestrante (+ identity stubs)
│       ├── shared/               # Menu, ConfirmDialog, Titulo (already here)
│       ├── forms/                # keep from 003
│       ├── services/
│       └── router/
│
├── Front-React/
│   └── src/
│       ├── components/
│       │   ├── eventos/          # from pages/EventosPage, EventoDetailPage
│       │   ├── palestrantes/     # from pages/PalestrantesPage
│       │   └── user/             # from pages/LoginPage (stub)
│       ├── models/               # types.ts → per-entity files or keep barrel
│       ├── shared/               # from components/Nav, ConfirmDialog
│       ├── forms/                # keep from 003
│       └── services/
│
└── Front-Angular/
    └── src/app/
        ├── components/
        │   ├── eventos/          # eventos-list, evento-form (from pages/)
        │   ├── palestrantes/     # from pages/palestrantes
        │   └── user/             # from pages/login (stub)
        ├── models/               # split evento.model.ts into entity files if needed
        ├── shared/               # from components/nav, confirm-dialog
        ├── forms/                # keep from 003
        ├── services/
        └── app.routes.ts         # update lazy/import paths only; URLs unchanged
```

**Structure Decision**: Touch only the three frontends under `Front/Front-{Vue,React,Angular}`. Target the didactic trio **components/{domain}**, **models**, **shared** (Vue casing `Models` may remain). Keep `forms/` and `services/` as app-wide cross-cutting areas. Do not modify `Back/`. Prefer mechanical moves + import/path fixes over rewrites.

## Complexity Tracking

> No constitution violations. Optional note only:

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|------------|-------------------------------------|
| Relocate React/Angular `pages/` into `components/{domain}` | Spec FR-001/011 teaching parity with Vue and the user’s Feature Based example | Leaving flat `pages/` would leave React/Angular as the odd pattern in the comparison |
| Keep `forms/` outside feature folders | 003 already established centralized schemas; FR says do not undo forms work | Folding schemas into each feature would scatter validation and break 003 discoverability |
| User feature folder for stubs | Spec FR-010 + user’s example tree | Deleting stubs would change menus/routes; implementing auth would violate constitution |
