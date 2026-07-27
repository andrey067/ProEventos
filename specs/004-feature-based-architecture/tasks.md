# Tasks: Feature-Based Frontend Architecture

**Input**: Design documents from `/specs/004-feature-based-architecture/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/source-layout.md, quickstart.md

**Tests**: No new test suites requested in the spec. Existing Vitest specs MUST keep passing after import-path updates (FR-012). Do not invent footer/spinner/pagination UI.

**Organization**: Tasks grouped by user story for independent delivery. Paths follow `Front/Front-{Vue,React,Angular}/` from plan.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Vue**: `Front/Front-Vue/src/`
- **React**: `Front/Front-React/src/`
- **Angular**: `Front/Front-Angular/src/app/`
- Prefer per-frontend task groups so apps stay independently deliverable
- Do **not** modify `Back/`
- Keep `forms/` and `services/` in place (003 ownership)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create target Feature Based folders without moving behavior yet

- [x] T001 Create feature/shared target dirs in `Front/Front-React/src/components/eventos/`, `Front/Front-React/src/components/palestrantes/`, `Front/Front-React/src/components/user/`, and `Front/Front-React/src/shared/`
- [x] T002 [P] Create feature/shared target dirs in `Front/Front-Angular/src/app/components/eventos/`, `Front/Front-Angular/src/app/components/palestrantes/`, `Front/Front-Angular/src/app/components/user/`, and `Front/Front-Angular/src/app/shared/`
- [x] T003 [P] Confirm Vue already has `Front/Front-Vue/src/components/{eventos,palestrantes,user}/`, `Front/Front-Vue/src/Models/`, and `Front/Front-Vue/src/shared/` per [contracts/source-layout.md](./contracts/source-layout.md); note any gaps only (no empty chrome folders)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Guardrails that MUST hold before story moves begin

**⚠️ CRITICAL**: No user story file moves until this phase is complete

- [x] T004 Record current public route path strings from `Front/Front-React/src/App.tsx`, `Front/Front-Vue/src/router/index.ts`, and `Front/Front-Angular/src/app/app.routes.ts` (must remain unchanged after moves)
- [x] T005 [P] Confirm `forms/` ownership stays put: `Front/Front-React/src/forms/`, `Front/Front-Vue/src/forms/`, `Front/Front-Angular/src/app/forms/` — do not relocate schemas into feature folders
- [x] T006 [P] Confirm `services/` stay at app root: `Front/Front-React/src/services/`, `Front/Front-Vue/src/services/`, `Front/Front-Angular/src/app/services/` — out of scope to feature-colocate
- [x] T007 Add a short move checklist comment or note in `specs/004-feature-based-architecture/quickstart.md` §1 referencing L-01–L-08 from `contracts/source-layout.md` if any checklist step is missing (docs only; no Back changes)

**Checkpoint**: Target dirs exist; routes/forms/services constraints locked — story moves can begin

---

## Phase 3: User Story 1 - Evento screens under one feature area (Priority: P1) 🎯 MVP

**Goal**: All Evento list + detail/create-edit screens live under `components/eventos/` on each frontend; behavior and URLs unchanged

**Independent Test**: Tree shows Evento screens only under `components/eventos/`; open list → detail/edit → save; routes still `/eventos` and `/eventos/:id` (or Vue equivalents)

### Implementation for User Story 1

- [x] T008 [P] [US1] Move `Front/Front-React/src/pages/EventosPage.tsx` and `Front/Front-React/src/pages/EventosPage.test.tsx` to `Front/Front-React/src/components/eventos/`; update internal imports only as needed
- [x] T009 [P] [US1] Move `Front/Front-React/src/pages/EventoDetailPage.tsx` and `Front/Front-React/src/pages/EventoDetailPage.test.tsx` to `Front/Front-React/src/components/eventos/`; update internal imports only as needed
- [x] T010 [US1] Update React route imports in `Front/Front-React/src/App.tsx` to `@/components/eventos/EventosPage` and `@/components/eventos/EventoDetailPage` without changing path strings
- [x] T011 [P] [US1] Move `Front/Front-Angular/src/app/pages/eventos-list/` to `Front/Front-Angular/src/app/components/eventos/eventos-list/` (all `.ts`/`.html`/`.scss`/`.spec.ts` files)
- [x] T012 [P] [US1] Move `Front/Front-Angular/src/app/pages/evento-form/` to `Front/Front-Angular/src/app/components/eventos/evento-form/` (all related files)
- [x] T013 [US1] Update Angular imports in `Front/Front-Angular/src/app/app.routes.ts` (and any specs importing old `pages/eventos-*` paths) to `components/eventos/...` without changing `path:` values
- [x] T014 [US1] Verify Vue Evento screens already under `Front/Front-Vue/src/components/eventos/` (`EventoLista.vue`, `DetalhesEvento.vue`, `FormularioEvento.vue`, `LotesEvento.vue`, related specs); fix only if any Evento screen still lives outside that folder
- [x] T015 [US1] Remove empty `Front/Front-React/src/pages/` leftovers for Evento files only if unused; keep `pages/` only if other stories still need it
- [x] T016 [US1] Run `pnpm test` focused on Evento specs in `Front/Front-React` and `Front/Front-Angular` (and Vue Evento specs if paths changed); fix import breakage only

**Checkpoint**: US1 complete — Evento screens co-located and journeys green on each app touched

---

## Phase 4: User Story 2 - Palestrante screens under one feature area (Priority: P1)

**Goal**: All Palestrante screens live under `components/palestrantes/`; CRUD behavior unchanged

**Independent Test**: Tree shows palestrante UI under `components/palestrantes/`; create/edit/cancel still work; route `/palestrantes` unchanged

### Implementation for User Story 2

- [x] T017 [P] [US2] Move `Front/Front-React/src/pages/PalestrantesPage.tsx` and `Front/Front-React/src/pages/PalestrantesPage.test.tsx` to `Front/Front-React/src/components/palestrantes/`; update imports
- [x] T018 [US2] Update `Front/Front-React/src/App.tsx` import for `PalestrantesPage` to `@/components/palestrantes/PalestrantesPage` without changing the `/palestrantes` route
- [x] T019 [P] [US2] Move `Front/Front-Angular/src/app/pages/palestrantes/` to `Front/Front-Angular/src/app/components/palestrantes/palestrantes/` (component + template + spec)
- [x] T020 [US2] Update `Front/Front-Angular/src/app/app.routes.ts` (and specs) to import from `components/palestrantes/palestrantes/...` without changing `path: 'palestrantes'`
- [x] T021 [US2] Verify Vue palestrante screens under `Front/Front-Vue/src/components/palestrantes/` (`PalestrantesPage.vue`, `PalestrantesComponent.vue`, specs); relocate only if anything remains outside
- [x] T022 [US2] Run palestrante-related Vitest suites in React/Angular (and Vue if moved); fix path-only failures

**Checkpoint**: US1 + US2 — Eventos and Palestrantes feature folders populated on all three apps

---

## Phase 5: User Story 3 - Domain models in one place (Priority: P1)

**Goal**: Discoverable Evento, Lote, RedeSocial, Palestrante models per [data-model.md](./data-model.md); screens/services import from models area; no divergent duplicates in feature folders

**Independent Test**: Open each app’s models area; find four entities; grep feature folders for duplicate incompatible entity interfaces — none remain

### Implementation for User Story 3

- [x] T023 [P] [US3] Split `Front/Front-React/src/models/types.ts` into `Front/Front-React/src/models/Evento.ts`, `Lote.ts`, `RedeSocial.ts`, `Palestrante.ts` plus `Front/Front-React/src/models/index.ts` barrel re-exporting the same shapes (fields unchanged)
- [x] T024 [US3] Update React consumers from `@/models/types` to `@/models` (or per-entity paths) in `Front/Front-React/src/services/*.ts`, `Front/Front-React/src/components/**/*.tsx`, `Front/Front-React/src/models/types.test.ts` (rename/move test to `models/index.test.ts` or keep asserting barrel)
- [x] T025 [P] [US3] Split `Front/Front-Angular/src/app/models/evento.model.ts` into `Front/Front-Angular/src/app/models/evento.ts`, `lote.ts`, `rede-social.ts`, `palestrante.ts` plus `Front/Front-Angular/src/app/models/index.ts` barrel (fields unchanged)
- [x] T026 [US3] Update Angular imports of `evento.model` across `Front/Front-Angular/src/app/services/`, `Front/Front-Angular/src/app/components/`, and `Front/Front-Angular/src/app/forms/` to the models barrel/entity files
- [x] T027 [P] [US3] Align Vue models discoverability under `Front/Front-Vue/src/Models/`: ensure `Evento.ts`, `Lote.ts`, `RedeSocial.ts`, `Palestrante.ts` are easy to find (optional flatten `Models/Eventos/Evento.ts` → `Models/Evento.ts` with import updates in `Front/Front-Vue/src/`); leave `Models/identity/*` stubs as-is
- [x] T028 [US3] Grep each frontend for local duplicate `interface Evento` / `interface Palestrante` outside models; remove or re-export from models only (no field renames that break API mapping)
- [x] T029 [US3] Run `pnpm test` in all three frontends after model path updates; fix import-only breakage

**Checkpoint**: US3 — models area is the single source of entity shapes

---

## Phase 6: User Story 4 - Reuse shared chrome across features (Priority: P2)

**Goal**: Nav/menu and confirm/modal live under `shared/`; feature screens compose them; no duplicated chrome copies

**Independent Test**: `shared/` holds nav + confirm; feature folders import from `shared/`; nav links and delete-confirm still work

### Implementation for User Story 4

- [x] T030 [P] [US4] Move `Front/Front-React/src/components/Nav.tsx` and `Front/Front-React/src/components/Nav.test.tsx` to `Front/Front-React/src/shared/Nav.tsx` (and test alongside); update `Front/Front-React/src/App.tsx` import to `@/shared/Nav`
- [x] T031 [P] [US4] Move `Front/Front-React/src/components/ConfirmDialog.tsx` and `Front/Front-React/src/components/ConfirmDialog.test.tsx` to `Front/Front-React/src/shared/`; update imports in `Front/Front-React/src/components/eventos/*` and `Front/Front-React/src/components/palestrantes/*`
- [x] T032 [P] [US4] Move `Front/Front-Angular/src/app/components/nav/` to `Front/Front-Angular/src/app/shared/nav/`; update `Front/Front-Angular/src/app/app.ts` / `app.html` (or wherever Nav is declared) imports
- [x] T033 [P] [US4] Move `Front/Front-Angular/src/app/components/confirm-dialog/` to `Front/Front-Angular/src/app/shared/confirm-dialog/`; update imports in Eventos/Palestrantes feature components and specs
- [x] T034 [US4] Verify Vue chrome already under `Front/Front-Vue/src/shared/` (`MenuComponent.vue`, `ConfirmDialog.vue`, `TituloComponent.vue`); ensure feature components import from `shared/` not copies
- [x] T035 [US4] Do **not** create empty `footer/`, `spinner/`, or `pagination/` folders when those pieces do not exist in an app
- [x] T036 [US4] Run nav/confirm-related Vitest specs on React/Angular/Vue; fix path-only failures

**Checkpoint**: Shared vs feature separation visible on all three apps

---

## Phase 7: User Story 5 - Learners recognize Feature Based Architecture (Priority: P2)

**Goal**: Side-by-side trees show features + models + shared; User stubs under `components/user/` without auth; Contatos/JWT not introduced

**Independent Test**: Compare three `src/` trees; login stubs inert; layout contract L-01–L-08 satisfied

### Implementation for User Story 5

- [x] T037 [P] [US5] Move `Front/Front-React/src/pages/LoginPage.tsx` and `Front/Front-React/src/pages/LoginPage.test.tsx` to `Front/Front-React/src/components/user/`; update `Front/Front-React/src/App.tsx` import; keep `/login` stub behavior
- [x] T038 [P] [US5] Move `Front/Front-Angular/src/app/pages/login/` to `Front/Front-Angular/src/app/components/user/login/`; update `Front/Front-Angular/src/app/app.routes.ts`; keep stub-only
- [x] T039 [US5] Verify Vue user stubs remain under `Front/Front-Vue/src/components/user/` without adding JWT/session logic
- [x] T040 [US5] Delete empty `Front/Front-React/src/pages/` and `Front/Front-Angular/src/app/pages/` directories if fully vacated
- [x] T041 [US5] Walk [contracts/source-layout.md](./contracts/source-layout.md) L-01–L-08 against all three apps; fix any remaining misplaced screen/chrome/model
- [x] T042 [US5] Confirm no Contatos expansion and no `Back/` changes in the working tree for this feature

**Checkpoint**: Pattern parity recognizable across Vue, React, and Angular

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Full verification per quickstart; cleanup

- [x] T043 [P] Run full `pnpm test` and `pnpm build` in `Front/Front-Vue`
- [x] T044 [P] Run full `pnpm test` and `pnpm build` in `Front/Front-React`
- [x] T045 [P] Run full `pnpm test` and `pnpm build` in `Front/Front-Angular`
- [x] T046 Execute smoke journeys from [quickstart.md](./quickstart.md) §3 on at least one frontend (Eventos list/detail/create, Palestrantes, nav/confirm, login stub inert)
- [x] T047 [P] Grep for stale imports of `@/pages/`, `app/pages/`, old `components/Nav`, or `evento.model` paths and eliminate leftovers
- [x] T048 Final tree parity glance (quickstart §4): `components/{eventos,palestrantes,user}`, `models`/`Models`, `shared`, plus untouched `forms/` and `services/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: After Foundational — MVP
- **US2 (Phase 4)**: After Foundational — can run parallel to US1 if different files/apps coordinated
- **US3 (Phase 5)**: After Foundational — best after or parallel to US1/US2 once screens have stable homes (fewer double import edits if US1/US2 finish first)
- **US4 (Phase 6)**: After Foundational — ideally after US1/US2 so feature import updates land once
- **US5 (Phase 7)**: After US1–US4 preferred (user stubs + final layout audit)
- **Polish (Phase 8)**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories
- **US2 (P1)**: No dependency on US1 (parallelizable per app)
- **US3 (P1)**: Independent structurally; sequencing after US1/US2 reduces churn
- **US4 (P2)**: Independent; sequencing after US1/US2 preferred
- **US5 (P2)**: Depends on US1–US4 for a meaningful parity audit

### Within Each User Story

- Move files → update router/entry imports → update specs → run targeted tests
- No API/DTO or style redesign work
- Models before removing duplicate interfaces (US3)

### Parallel Opportunities

- T001 / T002 / T003 in Setup
- T005 / T006 in Foundational
- T008 / T009 (React Evento pages) and T011 / T012 (Angular Evento pages) in parallel
- T017 (React) and T019 (Angular) for US2 in parallel
- T023 / T025 / T027 model splits in parallel across apps
- T030–T033 shared chrome moves in parallel across apps
- T037 / T038 user stub moves in parallel
- T043 / T044 / T045 full test+build in parallel

---

## Parallel Example: User Story 1

```bash
# React Evento moves in parallel:
Task: "Move EventosPage(+test) to Front/Front-React/src/components/eventos/"
Task: "Move EventoDetailPage(+test) to Front/Front-React/src/components/eventos/"

# Angular Evento moves in parallel (separate app):
Task: "Move pages/eventos-list to app/components/eventos/eventos-list/"
Task: "Move pages/evento-form to app/components/eventos/evento-form/"

# Then sequentially per app: update App.tsx / app.routes.ts → run tests
```

---

## Parallel Example: User Story 3

```bash
# Model splits across apps in parallel:
Task: "Split Front/Front-React/src/models/types.ts into per-entity files + barrel"
Task: "Split Front/Front-Angular/src/app/models/evento.model.ts into per-entity files + barrel"
Task: "Align Front/Front-Vue/src/Models/ discoverability"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (Eventos co-location on React + Angular; Vue verify)
4. **STOP and VALIDATE**: Evento journeys + targeted tests
5. Demo structure for Eventos feature folder

### Incremental Delivery

1. Setup + Foundational → ready
2. US1 Eventos → validate (MVP)
3. US2 Palestrantes → validate
4. US3 Models → validate
5. US4 Shared → validate
6. US5 Parity + user stubs → validate
7. Polish: full test/build + quickstart smoke

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Developer A: React US1→US2→US4→US5
3. Developer B: Angular US1→US2→US4→US5
4. Developer C: Vue verify + US3 model alignment across apps
5. Everyone: Polish builds/tests

---

## Notes

- [P] = different files, no incomplete-task dependencies
- [Story] labels map to spec user stories US1–US5
- Constitution: no Identity/JWT delivery, no Contatos, no premium redesign, no Back changes
- Prefer mechanical `git mv` / moves over rewrites
- Commit after each story checkpoint when requested by the user
