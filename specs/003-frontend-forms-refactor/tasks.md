# Tasks: Frontend Forms Best Practices

**Input**: Design documents from `/specs/003-frontend-forms-refactor/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Spec FR-011 requires existing form-journey tests to keep passing. Include **update** tasks for existing specs (not greenfield TDD). Do not weaken behavioral assertions.

**Organization**: Tasks grouped by user story for independent delivery. Paths follow `Front/Front-{React,Vue,Angular}/` from plan.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete work)
- **[Story]**: US1–US4 map to spec user stories
- Exact file paths in every task

## Path Conventions

- **React**: `Front/Front-React/src/`
- **Vue**: `Front/Front-Vue/src/`
- **Angular**: `Front/Front-Angular/src/app/`
- Prefer per-frontend task groups so apps stay independently deliverable
- Login stubs stay out of scope (`LoginPage.tsx`, `pages/login/`, Vue `user/login/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies and empty `forms/` trees so stories can land schemas without tooling friction

- [x] T001 Create forms folder tree `Front/Front-React/src/forms/{schemas,hooks,components}/` (add `.gitkeep` or index placeholders as needed)
- [x] T002 [P] Create forms folder tree `Front/Front-Vue/src/forms/{schemas,validators,hooks}/` (placeholders as needed)
- [x] T003 [P] Create forms folder tree `Front/Front-Angular/src/app/forms/{validators,schemas}/` (placeholders as needed)
- [x] T004 Install React form deps with `pnpm add react-hook-form zod @hookform/resolvers` in `Front/Front-React/`
- [x] T005 [P] Install Vue form deps with `pnpm add vee-validate zod @vee-validate/zod` in `Front/Front-Vue/`
- [x] T006 [P] Confirm `@angular/forms` is listed in `Front/Front-Angular/package.json` (no new package unless missing)

**Checkpoint**: All three apps can import locked form libraries; `forms/` directories exist

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared-within-app helpers that every story reuses; no screen migration yet

**⚠️ CRITICAL**: No user story form migrations until this phase completes

- [x] T007 [P] Add reusable Angular validators (e.g. trim/min-length helpers) in `Front/Front-Angular/src/app/forms/validators/` per research.md §3–4
- [x] T008 [P] Add optional React field-error helper component in `Front/Front-React/src/forms/components/` only if it avoids duplicating error markup (keep existing CSS classes)
- [x] T009 [P] Add Vue forms barrel or schema helper notes in `Front/Front-Vue/src/forms/` so Zod + `@vee-validate/zod` `toTypedSchema` usage is consistent
- [x] T010 Document (comment or short README in each `forms/` root is optional) that login/Contatos are out of scope — do **not** modify `Front/Front-React/src/pages/LoginPage.tsx`, `Front/Front-Angular/src/app/pages/login/`, or Vue login stubs

**Checkpoint**: Foundation ready — Evento / Palestrante / Search migrations can proceed (in parallel across apps if staffed)

---

## Phase 3: User Story 1 — Create and edit Evento (Priority: P1) 🎯 MVP

**Goal**: Migrate Evento create/edit (including nested lotes/redes where already present) on all three frontends to locked form stacks without changing layout, API payloads, or navigation

**Independent Test**: On each app — open novo evento → empty submit shows field errors and no create; valid save persists and returns to list; edit prefills and updates. Visual chrome unchanged. See contracts C-01–C-05, C-08.

### Implementation for User Story 1

- [x] T011 [P] [US1] Create Zod `eventoSchema` (+ nested lote/rede schemas mirroring current UI constraints) in `Front/Front-React/src/forms/schemas/eventoSchema.ts` with `z.infer` exports
- [x] T012 [P] [US1] Create Zod `eventoSchema` (+ nested schemas) in `Front/Front-Vue/src/forms/schemas/eventoSchema.ts` with typed exports
- [x] T013 [P] [US1] Create Evento `FormGroup`/`FormArray` factory defaults (and validator wiring) in `Front/Front-Angular/src/app/forms/schemas/evento-form.factory.ts` (or equivalent under `forms/`)
- [x] T014 [US1] Migrate full `Front/Front-React/src/pages/EventoDetailPage.tsx` to React Hook Form (`useForm` + `zodResolver` + `register` + `useFieldArray` for lotes/redes; `reset` on load; keep `loading`/`saving`/`error` state; preserve Tailwind classes and service calls)
- [x] T015 [P] [US1] Migrate full `Front/Front-Vue/src/components/eventos/FormularioEvento.vue` to VeeValidate (`useForm`/`useField` or `defineField` + Zod `toTypedSchema`); remove hand-rolled `fieldErrors`/`validate()`; preserve template classes and save flow
- [x] T016 [P] [US1] Migrate full `Front/Front-Angular/src/app/pages/evento-form/evento-form.component.ts` and `evento-form.component.html` from `ngModel`/`FormsModule` to Reactive Forms (`FormBuilder`, `formControlName`, `FormArray`); preserve classes and save/load behavior
- [x] T017 [US1] Update `Front/Front-React/src/pages/EventoDetailPage.test.tsx` (and related App tests if needed) so assertions still cover prefill, field updates, and submit behavior under RHF
- [x] T018 [P] [US1] Update `Front/Front-Vue/src/components/eventos/FormularioEvento.spec.ts` for VeeValidate wiring while keeping tema validation and load/save behavioral coverage
- [x] T019 [P] [US1] Update `Front/Front-Angular/src/app/pages/evento-form/evento-form.component.spec.ts` for Reactive Forms while keeping create/edit behavioral coverage

**Checkpoint**: US1 complete on all three frontends — MVP demoable

---

## Phase 4: User Story 2 — Manage Palestrantes (Priority: P1)

**Goal**: Migrate palestrante create/edit/cancel forms on all three frontends to locked stacks with same persistence and reset behavior

**Independent Test**: Invalid submit → validation, no persist; valid create → list refresh + form reset; edit then cancel → empty/create state. Contracts C-02, C-03, C-06.

### Implementation for User Story 2

- [x] T020 [P] [US2] Create Zod `palestranteSchema` in `Front/Front-React/src/forms/schemas/palestranteSchema.ts`
- [x] T021 [P] [US2] Create Zod `palestranteSchema` in `Front/Front-Vue/src/forms/schemas/palestranteSchema.ts`
- [x] T022 [P] [US2] Create palestrante `FormGroup` factory/validators in `Front/Front-Angular/src/app/forms/schemas/palestrante-form.factory.ts` (or under `forms/validators/`)
- [x] T023 [US2] Migrate full `Front/Front-React/src/pages/PalestrantesPage.tsx` to RHF (`defaultValues`, `reset` on cancel/edit/success); remove input-only `useState` for form fields; preserve list/delete/`ConfirmDialog` behavior
- [x] T024 [P] [US2] Migrate full `Front/Front-Vue/src/components/palestrantes/PalestrantesPage.vue` to VeeValidate + Zod; keep create/edit/cancel UX and classes
- [x] T025 [P] [US2] Migrate full `Front/Front-Angular/src/app/pages/palestrantes/palestrantes.component.ts` and `palestrantes.component.html` to Reactive Forms; remove template-driven binding on that screen
- [x] T026 [US2] Update `Front/Front-React/src/pages/PalestrantesPage.test.tsx` for RHF while preserving create/edit/cancel assertions
- [x] T027 [P] [US2] Update `Front/Front-Vue/src/components/palestrantes/PalestrantesPage.spec.ts` (and `PalestrantesComponent.spec.ts` if it covers the same form) for new wiring
- [x] T028 [P] [US2] Update `Front/Front-Angular/src/app/pages/palestrantes/palestrantes.component.spec.ts` for Reactive Forms behavioral coverage

**Checkpoint**: US1 + US2 both independently verifiable on all apps

---

## Phase 5: User Story 3 — Search/filter forms (Priority: P2)

**Goal**: Migrate eventos list search `<form>`s to the same form approach without changing filter semantics

**Independent Test**: Submit tema filter → same filtered results as before; empty/clear → prior default list behavior. Contract C-07.

### Implementation for User Story 3

- [x] T029 [P] [US3] Create Zod `eventoSearchSchema` (optional `tema` string) in `Front/Front-React/src/forms/schemas/eventoSearchSchema.ts`
- [x] T030 [P] [US3] Create Zod `eventoSearchSchema` in `Front/Front-Vue/src/forms/schemas/eventoSearchSchema.ts`
- [x] T031 [P] [US3] Add search `FormControl`/`FormGroup` helper in `Front/Front-Angular/src/app/forms/schemas/evento-search.factory.ts` (or inline builder reused by list page)
- [x] T032 [US3] Migrate search form in `Front/Front-React/src/pages/EventosPage.tsx` to RHF; keep list/delete behavior and styles
- [x] T033 [P] [US3] Migrate search binding in `Front/Front-Vue/src/components/eventos/EventoLista.vue` to VeeValidate/`useForm` (or `useField`) without changing filter semantics
- [x] T034 [P] [US3] Migrate search controls in `Front/Front-Angular/src/app/pages/eventos-list/eventos-list.component.ts` and `eventos-list.component.html` to Reactive Forms
- [x] T035 [US3] Update `Front/Front-React/src/pages/EventosPage.test.tsx` for search form wiring
- [x] T036 [P] [US3] Update `Front/Front-Vue/src/components/eventos/EventoLista.spec.ts` for search form wiring
- [x] T037 [P] [US3] Update `Front/Front-Angular/src/app/pages/eventos-list/eventos-list.component.spec.ts` for reactive search wiring

**Checkpoint**: Search journeys preserved on all three frontends

---

## Phase 6: User Story 4 — Maintainable form patterns (Priority: P2)

**Goal**: Ensure each app’s forms area is discoverable, typed, free of dead input state, and free of duplicated validation for the same entity within that app

**Independent Test**: Reviewer finds Evento/Palestrante schemas under each `forms/` tree within ~1 minute (SC-006); no `any` on form values; no leftover manual input mirrors; `pnpm test` green per app

### Implementation for User Story 4

- [x] T038 [P] [US4] Add schema barrels/exports in `Front/Front-React/src/forms/schemas/index.ts` (and hooks only if used) so pages import from one place
- [x] T039 [P] [US4] Add schema barrels/exports in `Front/Front-Vue/src/forms/schemas/index.ts`
- [x] T040 [P] [US4] Add forms public exports in `Front/Front-Angular/src/app/forms/` (index or documented import paths for factories/validators)
- [x] T041 [US4] Audit React pages for dead form `useState`/handlers; remove unused code in `EventoDetailPage.tsx`, `PalestrantesPage.tsx`, `EventosPage.tsx` after migration
- [x] T042 [P] [US4] Audit Vue Evento/Palestrante/Lista components for leftover `fieldErrors`, sync-only watchers, and `any` casts on form payloads; clean in those files under `Front/Front-Vue/src/components/`
- [x] T043 [P] [US4] Audit Angular migrated pages for residual `FormsModule`/`ngModel` on in-scope screens; ensure only `ReactiveFormsModule` (or standalone reactive imports) remain in `evento-form`, `palestrantes`, `eventos-list`
- [x] T044 [US4] Confirm TypeScript builds: `pnpm build` (or `vue-tsc`/`ng build`/`tsc -b`) succeeds in each of `Front/Front-React`, `Front/Front-Vue`, `Front/Front-Angular` with strong form typing (no `any` on form models)

**Checkpoint**: Teaching-oriented organization and type safety meet SC-006 / FR-009–FR-010

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation against quickstart and coverage gate; confirm out-of-scope boundaries

- [x] T045 Run full test suites: `pnpm test` in `Front/Front-React`, `Front/Front-Vue`, and `Front/Front-Angular`
- [x] T046 [P] Run coverage gates `pnpm test:coverage` in each frontend and confirm ≥80% thresholds from `002-coverage-gate` still pass
- [x] T047 [P] Spot-check login stubs unchanged in `Front/Front-React/src/pages/LoginPage.tsx`, `Front/Front-Angular/src/app/pages/login/`, and Vue `Front/Front-Vue/src/components/user/login/`
- [x] T048 Execute manual scenarios in `specs/003-frontend-forms-refactor/quickstart.md` §§3–5 on all three apps (Evento, Palestrantes, Search) and confirm C-01–C-08
- [x] T049 Verify no backend changes were introduced under `Back/` for this feature (git status / diff sanity check)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately
- **Foundational (Phase 2)**: Depends on Setup — **blocks** all user stories
- **US1 (Phase 3)**: Depends on Foundational — **MVP**
- **US2 (Phase 4)**: Depends on Foundational (can parallel US1 across different apps/files; avoid same-file conflicts)
- **US3 (Phase 5)**: Depends on Foundational; ideally after US1 patterns exist in that app (schemas style), but independently testable
- **US4 (Phase 6)**: Depends on US1–US3 migrations for that app (audit/cleanup)
- **Polish (Phase 7)**: Depends on desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on US2–US4
- **US2 (P1)**: After Phase 2 — independent of US1 at runtime (same app may share `forms/` conventions)
- **US3 (P2)**: After Phase 2 — independent filter journey
- **US4 (P2)**: After US1–US3 code landed — organizational polish

### Within Each User Story

- Schemas/factories before page migration
- Page migration before updating that page’s tests
- Prefer full-file delivery per migrated module (no half-wired forms)

### Parallel Opportunities

- T001–T003 folder creation; T004–T006 installs (different apps)
- T007–T009 foundational helpers (different apps)
- Within US1: T011–T013 schemas in parallel; then T014 vs T015/T016 on different apps; T017–T019 test updates in parallel after their app’s migration
- Same pattern for US2 (T020–T028) and US3 (T029–T037)
- US4 barrel/audit tasks marked [P] across apps

---

## Parallel Example: User Story 1

```bash
# Schemas in parallel (three apps):
Task: T011 Create eventoSchema in Front/Front-React/src/forms/schemas/eventoSchema.ts
Task: T012 Create eventoSchema in Front/Front-Vue/src/forms/schemas/eventoSchema.ts
Task: T013 Create evento form factory in Front/Front-Angular/src/app/forms/schemas/evento-form.factory.ts

# After schemas: migrate pages in parallel across apps:
Task: T014 Migrate EventoDetailPage.tsx (React)
Task: T015 Migrate FormularioEvento.vue (Vue)
Task: T016 Migrate evento-form component (Angular)

# Then update tests in parallel:
Task: T017 Update EventoDetailPage.test.tsx
Task: T018 Update FormularioEvento.spec.ts
Task: T019 Update evento-form.component.spec.ts
```

---

## Parallel Example: User Story 2

```bash
Task: T020 palestranteSchema (React)
Task: T021 palestranteSchema (Vue)
Task: T022 palestrante form factory (Angular)
# then migrate T023–T025 across apps; tests T026–T028
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 Setup
2. Complete Phase 2 Foundational
3. Complete Phase 3 US1 (all three frontends)
4. **STOP and VALIDATE** via Independent Test + relevant quickstart §3
5. Demo Evento forms modernization

### Incremental Delivery

1. Setup + Foundational → ready
2. US1 Evento → MVP
3. US2 Palestrantes → parity on second CRUD surface
4. US3 Search → thin forms consistent
5. US4 + Polish → discoverability, types, coverage, quickstart sign-off

### Parallel Team Strategy

1. Team finishes Setup + Foundational together
2. Then:
   - Dev A: React (US1 → US2 → US3)
   - Dev B: Vue (US1 → US2 → US3)
   - Dev C: Angular (US1 → US2 → US3)
3. Reconvene for US4 audits + Phase 7 polish

---

## Notes

- [P] = different files, no incomplete-task dependencies
- Do not change layout/styles beyond binding attributes required by form libraries
- Do not add new domain validation beyond each app’s current UI constraints (research.md §4)
- Do not share a cross-framework forms package
- Do not upgrade login stubs into real auth
- Commit after each task or logical group when the user requests commits
- Stop at any checkpoint to validate independently
