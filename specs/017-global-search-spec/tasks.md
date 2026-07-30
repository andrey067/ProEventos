# Tasks: Global Search (Specification Pattern + Debounce)

**Input**: Design documents from `/specs/017-global-search-spec/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included — FR-010 requires automated coverage for Specification matching and debounce/immediate-submit on each frontend list.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `Back/src/ProEventos.*/` and `Back/tests/`
- **Vue**: `Front/Front-Vue/`
- **React**: `Front/Front-React/`
- **Angular**: `Front/Front-Angular/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align feature branch/docs and create Domain specification folder scaffolding

- [X] T001 Confirm `specs/017-global-search-spec/` design docs (`plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`) match intended delivery and set `SPECIFY_FEATURE=017-global-search-spec`
- [X] T002 [P] Create Domain specifications folder `Back/src/ProEventos.Domain/Specifications/` (placeholder ready for `ISpecification` / concrete specs)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared Specification abstraction and term-resolution helper used by all list stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add `ISpecification<T>` with `Expression<Func<T, bool>> Criteria` in `Back/src/ProEventos.Domain/Specifications/ISpecification.cs`
- [X] T004 Add `IQueryable<T>` apply helper (e.g. `Where(this IQueryable<T> source, ISpecification<T> spec)`) in `Back/src/ProEventos.Persistence/Extensions/SpecificationExtensions.cs` (or Domain if expression-only)
- [X] T005 [P] Add shared search-term resolver (trim; prefer `q`; Eventos fallback `tema`; Palestrantes fallback `nome` then `tema`) in `Back/src/ProEventos.Services/Helpers/SearchTermResolver.cs` (or Api Extensions if preferred)

**Checkpoint**: Foundation ready — US1–US4 can proceed

---

## Phase 3: User Story 1 - Global text search on Eventos list (Priority: P1) 🎯 MVP

**Goal**: `GET /eventos?q=` matches Tema|Local|Email|Telefone via `EventoGlobalSearchSpecification`; pagination unchanged; three frontends send `q` on Eventos list (submit/clear still OK without debounce yet).

**Independent Test**: Seed distinct Local/Email/Telefone/Tema; `GET /eventos?q=<localFragment>` returns only matching rows; empty `q` = unfiltered page; UI Eventos search uses `q`.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T006 [P] [US1] Add Persistence tests for Evento global match fields (Local-only, Email-only, Telefone-only, Tema-only, empty term) in `Back/tests/ProEventos.Persistence.Tests/EventoRepositoryTests.cs` (or new `EventoGlobalSearchTests.cs`)
- [X] T007 [P] [US1] Extend Api pagination/search tests for `q` + `Pagination` header and legacy `tema` fallback in `Back/tests/ProEventos.Api.Tests/PaginationEndpointsTests.cs`
- [X] T008 [P] [US1] Update Evento service HTTP tests to expect `q` in `Front/Front-Vue/src/services/eventoService.spec.ts`
- [X] T009 [P] [US1] Update Evento service HTTP tests to expect `q` in `Front/Front-React/src/services/eventoService.test.ts`
- [X] T010 [P] [US1] Update Evento service HTTP tests to expect `q` in `Front/Front-Angular/src/app/services/evento.service.spec.ts`

### Implementation for User Story 1

- [X] T011 [US1] Implement `EventoGlobalSearchSpecification` in `Back/src/ProEventos.Domain/Specifications/EventoGlobalSearchSpecification.cs` (Tema|Local|Email|Telefone, case-insensitive Contains)
- [X] T012 [US1] Change `GetPagedEventosAsync` signature from `tema` to search term / apply specification in `Back/src/ProEventos.Domain/Interfaces/Repositories/IEventoRepository.cs` and `Back/src/ProEventos.Persistence/Repository/EventoRepository.cs`
- [X] T013 [US1] Pass resolved `q` through `Back/src/ProEventos.Services/Interfaces/IEventoService.cs` and `Back/src/ProEventos.Services/Services/EventoService.cs` (update `Back/tests/ProEventos.Services.Tests/EventoServiceTests.cs` as needed)
- [X] T014 [US1] Accept `q` (+ legacy `tema` fallback) on list and `/tema/{tema}` convenience route in `Back/src/ProEventos.Api/Endpoints/EventoEndpoints.cs`
- [X] T015 [P] [US1] Migrate list params `tema` → `q` in `Front/Front-Vue/src/services/eventoService.ts` and search form field naming in `Front/Front-Vue/src/forms/schemas/eventoSearchSchema.ts` + `Front/Front-Vue/src/components/eventos/EventoLista.vue`
- [X] T016 [P] [US1] Migrate list params `tema` → `q` in `Front/Front-React/src/services/eventoService.ts` and `Front/Front-React/src/forms/schemas/eventoSearchSchema.ts` + `Front/Front-React/src/components/eventos/EventosPage.tsx`
- [X] T017 [P] [US1] Migrate list params `tema` → `q` in `Front/Front-Angular/src/app/services/evento.service.ts`, `Front/Front-Angular/src/app/forms/schemas/evento-search.factory.ts`, and `Front/Front-Angular/src/app/components/eventos/eventos-list/eventos-list.component.ts` (+ `.html`)
- [X] T018 [P] [US1] Update Eventos list component tests for `q` in `Front/Front-Vue/src/components/eventos/EventoLista.spec.ts`, `Front/Front-React/src/components/eventos/EventosPage.test.tsx`, and `Front/Front-Angular/src/app/components/eventos/eventos-list/eventos-list.component.spec.ts`

**Checkpoint**: Eventos global search works via API and all three UIs (without debounce)

---

## Phase 4: User Story 2 - Global text search on Palestrantes list (Priority: P1)

**Goal**: `GET /palestrantes?q=` matches Nome|MiniCurriculo|Email|Telefone|linked Evento.Tema via `PalestranteGlobalSearchSpecification`; frontends send `q` on Palestrantes list.

**Independent Test**: Seed distinct MiniCurriculo/Nome; `GET /palestrantes?q=<curriculoFragment>` returns expected rows; theme-linked discovery still works via `q`; empty `q` = unfiltered page.

### Tests for User Story 2

- [X] T019 [P] [US2] Add Persistence tests for Palestrante global match fields (including linked Evento.Tema) in `Back/tests/ProEventos.Persistence.Tests/PalestrantesRepositoryTests.cs` (or new `PalestranteGlobalSearchTests.cs`)
- [X] T020 [P] [US2] Extend Api tests for `GET /palestrantes?q=` + pagination + legacy `nome`/`tema` fallback in `Back/tests/ProEventos.Api.Tests/PaginationEndpointsTests.cs`
- [X] T021 [P] [US2] Update Palestrante service HTTP tests for `q` in `Front/Front-Vue/src/services/palestranteService.spec.ts`, `Front/Front-React/src/services/palestranteService.test.ts`, and `Front/Front-Angular/src/app/services/palestrante.service.spec.ts`

### Implementation for User Story 2

- [X] T022 [US2] Implement `PalestranteGlobalSearchSpecification` in `Back/src/ProEventos.Domain/Specifications/PalestranteGlobalSearchSpecification.cs`
- [X] T023 [US2] Replace separate `nome`/`tema` filters with single search term + specification in `Back/src/ProEventos.Domain/Interfaces/Repositories/IPalestrantesRepository.cs` and `Back/src/ProEventos.Persistence/Repository/PalestrantesRepository.cs`
- [X] T024 [US2] Pass resolved `q` through `Back/src/ProEventos.Services/Interfaces/IPalestranteService.cs` and `Back/src/ProEventos.Services/Services/PalestranteService.cs` (update `Back/tests/ProEventos.Services.Tests/PalestranteServiceTests.cs`)
- [X] T025 [US2] Accept `q` (+ legacy aliases) on list and convenience `/nome/{nome}` `/tema/{tema}` routes in `Back/src/ProEventos.Api/Endpoints/PalestranteEndpoints.cs`
- [X] T026 [P] [US2] Migrate Palestrantes list to `q` in `Front/Front-Vue/src/services/palestranteService.ts` and `Front/Front-Vue/src/components/palestrantes/PalestrantesPage.vue`
- [X] T027 [P] [US2] Migrate Palestrantes list to `q` in `Front/Front-React/src/services/palestranteService.ts` and `Front/Front-React/src/components/palestrantes/PalestrantesPage.tsx`
- [X] T028 [P] [US2] Migrate Palestrantes list to `q` in `Front/Front-Angular/src/app/services/palestrante.service.ts` and `Front/Front-Angular/src/app/components/palestrantes/palestrantes/palestrantes.component.ts` (+ `.html`)
- [X] T029 [P] [US2] Update Palestrantes list component tests for `q` in `Front/Front-Vue/src/components/palestrantes/PalestrantesPage.spec.ts`, `Front/Front-React/src/components/palestrantes/PalestrantesPage.test.tsx`, and `Front/Front-Angular/src/app/components/palestrantes/palestrantes/palestrantes.component.spec.ts`

**Checkpoint**: Palestrantes global search works via API and all three UIs

---

## Phase 5: User Story 3 - Debounced search while typing (Priority: P1)

**Goal**: 350 ms debounce on Eventos and Palestrantes search inputs in Vue, React, and Angular; submit and clear are immediate; stale responses ignored.

**Independent Test**: Fake timers / Network: rapid typing → one request after 350 ms; Enter → immediate; clear → immediate; C-02–C-05 in `contracts/client-search-behavior.md`.

### Tests for User Story 3

- [X] T030 [P] [US3] Add debounce helper unit tests (350 ms, flush/cancel) in `Front/Front-Vue/src/utils/debounce.spec.ts` (create helper under `Front/Front-Vue/src/utils/debounce.ts`)
- [X] T031 [P] [US3] Add `useDebouncedValue` (or equivalent) tests in `Front/Front-React/src/hooks/useDebouncedValue.test.ts` (create hook under `Front/Front-React/src/hooks/useDebouncedValue.ts`)
- [X] T032 [P] [US3] Add debounce behavior tests on Eventos list (fakeAsync / rxjs marble or timer mocks) in `Front/Front-Angular/src/app/components/eventos/eventos-list/eventos-list.component.spec.ts`
- [X] T033 [P] [US3] Extend Eventos/Palestrantes list tests for immediate submit/clear and no per-keystroke fetch in `Front/Front-Vue/src/components/eventos/EventoLista.spec.ts` and `Front/Front-Vue/src/components/palestrantes/PalestrantesPage.spec.ts`
- [X] T034 [P] [US3] Extend Eventos/Palestrantes list tests for debounce/submit/clear in `Front/Front-React/src/components/eventos/EventosPage.test.tsx` and `Front/Front-React/src/components/palestrantes/PalestrantesPage.test.tsx`
- [X] T035 [P] [US3] Extend Palestrantes list debounce/submit/clear tests in `Front/Front-Angular/src/app/components/palestrantes/palestrantes/palestrantes.component.spec.ts`

### Implementation for User Story 3

- [X] T036 [P] [US3] Implement Vue debounce utility in `Front/Front-Vue/src/utils/debounce.ts` and wire Eventos search in `Front/Front-Vue/src/components/eventos/EventoLista.vue` (350 ms; submit/clear bypass; stale guard)
- [X] T037 [P] [US3] Wire Vue debounce on Palestrantes search in `Front/Front-Vue/src/components/palestrantes/PalestrantesPage.vue`
- [X] T038 [P] [US3] Implement `useDebouncedValue` in `Front/Front-React/src/hooks/useDebouncedValue.ts` and wire Eventos search in `Front/Front-React/src/components/eventos/EventosPage.tsx`
- [X] T039 [P] [US3] Wire React debounce on Palestrantes search in `Front/Front-React/src/components/palestrantes/PalestrantesPage.tsx`
- [X] T040 [P] [US3] Wire Angular `valueChanges` + `debounceTime(350)` + `distinctUntilChanged` on Eventos search in `Front/Front-Angular/src/app/components/eventos/eventos-list/eventos-list.component.ts` (submit/clear immediate)
- [X] T041 [P] [US3] Wire Angular debounce on Palestrantes search in `Front/Front-Angular/src/app/components/palestrantes/palestrantes/palestrantes.component.ts`
- [X] T042 [P] [US3] Soften UI copy away from theme/name-only labels on list templates (Vue/React/Angular Eventos + Palestrantes HTML/TSX/Vue) per `contracts/client-search-behavior.md` C-08

**Checkpoint**: Debounced global search parity on all three frontends for both lists

---

## Phase 6: User Story 4 - Concentrated search rules via Specification pattern (Priority: P2)

**Goal**: Search criteria live only in Specification types; repositories/endpoints do not re-encode field ORs; legacy helpers reuse the same specs.

**Independent Test**: Grep/review shows match fields only in `*GlobalSearchSpecification.cs`; Persistence/unit tests cover each field; changing a field in the spec changes list behavior without endpoint edits.

### Tests for User Story 4

- [X] T043 [P] [US4] Add focused Domain/Persistence tests asserting Criteria covers each documented field (and excludes ImagemURL) for Evento and Palestrante specs under `Back/tests/ProEventos.Persistence.Tests/` (or Domain test project if added)
- [X] T044 [US4] Confirm Api/endpoint handlers contain no inline multi-field `Where` for list search (cover via existing Api tests + code review checklist in PR)

### Implementation for User Story 4

- [X] T045 [US4] Refactor `GetAllEventosByTemaAsync` / related tema helpers in `Back/src/ProEventos.Persistence/Repository/EventoRepository.cs` to reuse `EventoGlobalSearchSpecification` when a term is present
- [X] T046 [US4] Refactor `GetAllPalestrantesByNameAsync` / `GetAllPalestrantesByTemaAsync` in `Back/src/ProEventos.Persistence/Repository/PalestrantesRepository.cs` to reuse `PalestranteGlobalSearchSpecification`
- [X] T047 [US4] Ensure `SearchTermResolver` is the only place that maps legacy query aliases into the term passed to specs (`Back/src/ProEventos.Services/Helpers/SearchTermResolver.cs` + endpoint call sites)
- [X] T048 [US4] Add brief contributor note pointing to the two specification types in `specs/017-global-search-spec/research.md` (or `Back/README.md` short pointer) for SC-004

**Checkpoint**: Specification pattern is the single source of search field rules

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Contract alignment, cleanup, full validation

- [X] T049 [P] Align any remaining OpenAPI/docs references if the repo keeps a root OpenAPI copy (otherwise keep `specs/017-global-search-spec/contracts/openapi.yaml` authoritative)
- [X] T050 [P] Remove obsolete tema/nome-only comments and dead query builders across Front services after `q` migration
- [X] T051 Run backend test projects covering Persistence/Services/Api search changes under `Back/tests/`
- [X] T052 [P] Run frontend unit suites for Vue (`Front/Front-Vue`), React (`Front/Front-React`), and Angular (`Front/Front-Angular`) for list/search tests
- [X] T053 Execute manual scenarios in `specs/017-global-search-spec/quickstart.md` §§1–6 and confirm C-01–C-08

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP
- **US2 (Phase 4)**: After Foundational — can run parallel to US1 (different files); concrete specs differ
- **US3 (Phase 5)**: After US1 + US2 frontend `q` migration (lists already call `q`)
- **US4 (Phase 6)**: After US1 + US2 backend specs exist; refactors legacy helpers onto same specs
- **Polish (Phase 7)**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: Foundational only — Evento spec + Eventos API/UI
- **US2 (P1)**: Foundational only — Palestrante spec + Palestrantes API/UI (parallelizable with US1)
- **US3 (P1)**: Depends on US1 + US2 client `q` wiring
- **US4 (P2)**: Depends on US1 + US2 backend specifications; consolidates leftover filters

### Within Each User Story

- Tests (listed) written to fail before implementation where practical
- Domain specification → repository → service → endpoint → frontends
- Story complete before treating next priority as done (US3/US4 wait on list `q`)

### Parallel Opportunities

- T002 with doc confirmation; T005 with T003/T004 once interface shape is known
- US1 frontend apps T015–T018 in parallel; US1 test tasks T006–T010 in parallel
- US2 frontend apps T026–T029 in parallel; entire US2 can start alongside US1 after Phase 2
- US3 debounce helpers T036–T041 across three apps in parallel after `q` exists

---

## Parallel Example: User Story 1

```bash
# Tests first (parallel):
Task: T006 Persistence Evento global search tests
Task: T007 Api PaginationEndpointsTests for q
Task: T008–T010 Frontend eventoService tests for q

# After EventoGlobalSearchSpecification + repository:
Task: T015 Vue Eventos q migration
Task: T016 React Eventos q migration
Task: T017 Angular Eventos q migration
```

## Parallel Example: User Story 3

```bash
Task: T036 Vue EventoLista debounce
Task: T038 React EventosPage debounce
Task: T040 Angular eventos-list debounce
# Then Palestrantes counterparts T037 / T039 / T041
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1–2 (Setup + Foundational)
2. Complete Phase 3 (US1 Eventos global `q` + Evento specification)
3. **STOP and VALIDATE** via Persistence/Api tests + one frontend Eventos list
4. Demo Eventos multi-field search

### Incremental Delivery

1. Setup + Foundational → Specification infra ready
2. US1 → Eventos global search (MVP)
3. US2 → Palestrantes global search
4. US3 → Debounce on all lists
5. US4 → Spec-only concentration / legacy helper reuse
6. Polish → quickstart validation

### Parallel Team Strategy

1. Team completes Phase 1–2 together
2. Dev A: US1 backend + one frontend; Dev B: US2 backend + another frontend; Dev C: remaining frontend `q` migration
3. After US1+US2: split US3 by framework (Vue / React / Angular)
4. One owner finishes US4 consolidation + polish

---

## Notes

- Debounce interval is **350 ms** (`research.md`)
- Query param primary name is **`q`**; legacy `tema`/`nome` are fallbacks only
- Do not add a shared cross-frontend debounce package (constitution)
- Commit after each task or logical group
- Avoid reintroducing field-specific list params on new UI code
