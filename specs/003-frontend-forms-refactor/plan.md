# Implementation Plan: Frontend Forms Best Practices

**Branch**: `003-frontend-forms-refactor` (spec dir; git branch may differ) | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-frontend-forms-refactor/spec.md`

**Note**: This plan is produced by `/speckit-plan`. Locked stacks are taken from the spec Assumptions (React Hook Form + Zod; VeeValidate + Zod; Angular Reactive Forms).

## Summary

Refactor all in-scope forms on **Front-React**, **Front-Vue**, and **Front-Angular** to each framework’s locked modern form stack, with **centralized per-app validation**, strong typing, and **no changes** to API contracts, business rules, or layout/styles. Primary surfaces: Evento create/edit (with nested lotes/redes), Palestrante CRUD, and list search forms. Login stubs stay inert.

## Technical Context

**Language/Version**: TypeScript ~5.6–5.9; React 19; Vue 3.5; Angular 21

**Primary Dependencies** (add where missing via `pnpm` in each app):
- React: `react-hook-form`, `zod`, `@hookform/resolvers`
- Vue: `vee-validate`, `zod` (+ `@vee-validate/zod` if required for Zod schema adapter)
- Angular: existing `@angular/forms` (Reactive Forms APIs)

**Storage**: N/A (forms talk to existing HTTP services only)

**Testing**: Vitest per frontend; React Testing Library / Vue Test Utils / Angular Vitest specs — update form tests for new wiring; keep behavioral assertions; respect `002-coverage-gate` 80% local thresholds

**Target Platform**: Local SPA learners (macOS/Windows/Linux browsers); ports already used (React 3000, Vue 5173, Angular 4200)

**Project Type**: Three independent frontends in a monorepo study app (shared .NET API unchanged)

**Performance Goals**: Reduce unnecessary re-renders on React via RHF uncontrolled defaults; no new UX latency budgets beyond “feels the same as today”

**Constraints**: No layout/style redesign; no new domain validation beyond existing HTML/`required`/minlength and current client checks; no shared cross-framework form package; no Identity/JWT; no Contatos; no backend changes

**Scale/Scope**: ~3 form surfaces × 3 apps (Evento detail/form, Palestrantes, Eventos list search); nested FormArray / useFieldArray for lotes & redes where already present

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (ProEventos v1.0.0+):

- [x] **Shared API Contract**: No API/DTO changes; services keep current HTTP payloads
- [x] **Frontend Independence**: Each app adds its own deps and `forms/` tree; no cross-framework shared package
- [x] **Domain Focus**: Evento / Lote / RedeSocial / Palestrante only; no Contatos
- [x] **Didactic Simplicity**: Conventional form libraries teach community patterns; no premium UI or speculative meta-framework
- [x] **Feature Parity**: All three frontends migrate the same journeys (Evento, Palestrante, search)
- [x] **Out of scope respected**: Login stubs not upgraded; no JWT; no Contatos; no redesign

Any failed gate MUST be justified in Complexity Tracking or the plan MUST be revised.

**Post-design re-check**: Still pass — contracts document client form behavior only; data-model mirrors existing UI fields; quickstart validates parity without new backend surface.

## Project Structure

### Documentation (this feature)

```text
specs/003-frontend-forms-refactor/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 — client form behavior (API unchanged)
└── tasks.md             # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
Front/
├── Front-React/
│   ├── package.json                    # + react-hook-form, zod, @hookform/resolvers
│   └── src/
│       ├── forms/
│       │   ├── schemas/                # eventoSchema, palestranteSchema, searchSchema, …
│       │   ├── hooks/                  # optional thin wrappers (e.g. useEventoForm)
│       │   └── components/             # optional FieldError / controlled adapters only if needed
│       ├── pages/
│       │   ├── EventoDetailPage.tsx    # migrate: RHF + useFieldArray for lotes/redes
│       │   ├── EventosPage.tsx         # migrate search form
│       │   ├── PalestrantesPage.tsx    # migrate CRUD form
│       │   └── LoginPage.tsx           # OUT OF SCOPE (leave stub)
│       ├── models/
│       └── services/                   # unchanged contracts
│
├── Front-Vue/
│   ├── package.json                    # + vee-validate, zod, (@vee-validate/zod)
│   └── src/
│       ├── forms/
│       │   ├── schemas/
│       │   └── …                       # validators/helpers as needed
│       ├── components/
│       │   ├── eventos/
│       │   │   ├── FormularioEvento.vue
│       │   │   └── EventoLista.vue     # search form
│       │   └── palestrantes/
│       │       └── PalestrantesPage.vue
│       └── services/                   # unchanged
│
└── Front-Angular/
    ├── package.json                    # @angular/forms already present
    └── src/app/
        ├── forms/
        │   ├── schemas/                # optional typed default factories
        │   └── validators/             # reusable Validators / custom validators
        ├── pages/
        │   ├── evento-form/            # Reactive Forms + FormArray
        │   ├── eventos-list/           # reactive search control
        │   ├── palestrantes/           # reactive palestrante form
        │   └── login/                  # OUT OF SCOPE
        └── services/                   # unchanged
```

**Structure Decision**: Touch only the three frontends under `Front/Front-{React,Vue,Angular}`. Introduce app-local `forms/` (Angular: `src/app/forms/`). Do not modify `Back/`. Prefer full-file migrations per form module (no half-wired screens).

## Complexity Tracking

> No constitution violations. Optional note only:

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|------------|-------------------------------------|
| Per-app `forms/` folder | Spec FR-005 / SC-006 discoverability; separates schemas from pages | Keeping schemas inside page files would duplicate rules and hide the teaching pattern |
| Nested field arrays (lotes/redes) | Already on Evento screens; must keep behavior | Flattening or dropping nested editors would change UX and break parity |
