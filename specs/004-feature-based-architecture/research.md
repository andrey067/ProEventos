# Research: Feature-Based Frontend Architecture

**Feature**: `004-feature-based-architecture`  
**Date**: 2026-07-26

## 1. Target folder vocabulary

**Decision**: Use the same conceptual names across apps: `components/{domain}/` for feature screens, `models/` (Vue may keep `Models/`) for API entity types, `shared/` for reusable chrome. Domains: `eventos`, `palestrantes`, `user` (stubs only).

**Rationale**: Matches the feature description learners will see in course material; Vue already follows this shape, so React/Angular move toward Vue rather than inventing a fourth layout.

**Alternatives considered**:
- React-style `features/` + `pages/` — common in industry, but would diverge from the explicit example and from Vue’s current tree
- Keep Angular `pages/` — simpler move count, but fails SC-005 pattern recognition across frontends
- Domain folders under `app/eventos` without a `components` parent (Angular style) — acceptable idiomatic variant, rejected for teaching consistency with the written example

## 2. Gap analysis vs current trees

**Decision**: Treat Vue as the reference (mostly compliant); treat React and Angular as the primary move work; normalize models discoverability on all three.

| Area | Vue today | React today | Angular today | Action |
|------|-----------|-------------|-----------------|--------|
| Eventos screens | `components/eventos/` | flat `pages/` | flat `pages/` | Vue: minor rename polish only if needed; React/Angular: move under `components/eventos/` |
| Palestrantes | `components/palestrantes/` | `pages/PalestrantesPage` | `pages/palestrantes/` | Same |
| User stubs | `components/user/` | `pages/LoginPage` | `pages/login/` | Move under `components/user/`; no auth work |
| Models | `Models/` (file-per-entity + Eventos subfolder) | `models/types.ts` (all-in-one) | `models/evento.model.ts` (all-in-one) | Ensure Evento, Lote, RedeSocial, Palestrante are discoverable; prefer one file per entity (or clear barrel) |
| Shared | `shared/` | `components/Nav`, `ConfirmDialog` | `components/nav`, `confirm-dialog` | Move chrome into `shared/`; leave feature-only UI in domain folders |
| Forms (003) | `forms/` | `forms/` | `app/forms/` | **Do not relocate into features** |

**Rationale**: Spec requires co-location and shared vs feature separation without rewriting behavior.

**Alternatives considered**: Rewrite Vue to `features/` for “modern FBA” naming — rejected (extra churn, Vue already teaches the pattern).

## 3. Screen naming inside feature folders

**Decision**: Preserve component class/file names where possible; only change path. Optional didactic aliases (e.g. `evento-lista/`) are allowed if a rename improves clarity **and** all imports/tests/routes are updated in the same change set.

**Suggested mapping (path only unless rename is trivial)**:

| Domain | Role | Vue | React (from → to) | Angular (from → to) |
|--------|------|-----|-------------------|---------------------|
| eventos | list | `EventoLista.vue` | `EventosPage.tsx` → `components/eventos/` | `eventos-list/` → `components/eventos/eventos-list/` |
| eventos | detail/form | `DetalhesEvento` / `FormularioEvento` | `EventoDetailPage.tsx` → `components/eventos/` | `evento-form/` → `components/eventos/evento-form/` |
| palestrantes | list+form | `PalestrantesPage.vue` | `PalestrantesPage.tsx` → `components/palestrantes/` | `palestrantes/` → `components/palestrantes/palestrantes/` |
| user | login stub | `user/login/` | `LoginPage.tsx` → `components/user/` | `login/` → `components/user/login/` |

**Rationale**: Spec FR-009 — structure over rename theater.

**Alternatives considered**: Force identical filenames across frameworks — rejected (hurts framework idioms and creates noisy diffs).

## 4. Models strategy

**Decision**:
- **Required entities**: Evento, Lote, RedeSocial, Palestrante with fields already used by UI/services (see [data-model.md](./data-model.md)).
- **React/Angular**: Prefer splitting the single types file into `Evento.ts`, `Lote.ts`, `RedeSocial.ts`, `Palestrante.ts` plus optional `index.ts` barrel — or keep one file if a barrel re-exports named types clearly. Either way, FR-004 discoverability must hold.
- **Vue**: Keep per-entity files; optionally flatten `Models/Eventos/Evento.ts` → `Models/Evento.ts` for symmetry (optional polish).
- **User / identity models**: Keep under models (or `Models/identity/`) only if already present; do not expand fields for auth.

**Rationale**: Spec User Story 3; Vue already demonstrates file-per-entity.

**Alternatives considered**: Generate models from OpenAPI — rejected (YAGNI; API unchanged; didactic simplicity).

## 5. Shared chrome inventory

**Decision**: Move only pieces that already exist; do **not** invent footer/spinner/pagination UI if the app lacks them.

| Piece | Vue | React | Angular |
|-------|-----|-------|---------|
| Nav / menu | `shared/MenuComponent` | `Nav` → `shared/` | `nav` → `shared/` |
| Modal / confirm | `shared/ConfirmDialog` | `ConfirmDialog` → `shared/` | `confirm-dialog` → `shared/` |
| Title helper | `shared/TituloComponent` | n/a | n/a |
| Footer / spinner / pagination | absent | absent | absent |

**Rationale**: Spec FR-007 “whichever apply”; inventing chrome would be redesign/scope creep.

**Alternatives considered**: Add stub folders for missing spinner/footer — rejected (empty folders confuse learners).

## 6. Routing and public URLs

**Decision**: Update import paths in routers (`Front-Vue/src/router`, React `App.tsx` routes, Angular `app.routes.ts`) only. Keep path strings and menu labels identical.

**Rationale**: Spec assumptions + FR-009.

**Alternatives considered**: Align URL segments to folder names — rejected (breaks bookmarks and lesson scripts).

## 7. Relationship to `003-frontend-forms-refactor`

**Decision**: `forms/` remains a top-level (per-app) cross-cutting area. Feature folders import schemas/factories from `forms/`; do not move schemas into `components/eventos/`.

**Rationale**: Spec assumption “must not undo form-behavior requirements”; 003 SC discoverability for schemas.

**Alternatives considered**: Colocate schema next to feature screen — rejected for this study (conflicts with 003).

## 8. Services placement

**Decision**: Leave `services/` (and Vue `HttpClient`) at app root; optional future move of services into features is **out of scope** for 004.

**Rationale**: Spec focuses on screens, models, shared UI; moving services multiplies import churn without teaching the requested trio.

**Alternatives considered**: Feature-owned services — deferred.

## 9. Verification approach

**Decision**: Per app: (1) tree checklist against [contracts/source-layout.md](./contracts/source-layout.md); (2) `pnpm` build/test; (3) smoke Evento + Palestrante journeys from [quickstart.md](./quickstart.md).

**Rationale**: FR-012 + SC-004.

**Alternatives considered**: Visual regression suites — rejected (constitution: no heavy test theater unless requested).
