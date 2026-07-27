# Tasks: Eventos List UX, Pagination & Lotes Cards

**Input**: Design documents from `/specs/006-eventos-list-ux/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Spec does not require new TDD suites. Prefer verifying via [quickstart.md](./quickstart.md) and existing `dotnet test` / `pnpm test`. Do not invent Contatos or premium UI.

**Organization**: Tasks grouped by user story for independent delivery. Paths follow plan.md (`Front/Front-{Vue,React,Angular}/`, `Back/src/`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `Back/src/ProEventos.*/` and `Back/tests/`
- **Vue**: `Front/Front-Vue/src/`
- **React**: `Front/Front-React/src/`
- **Angular**: `Front/Front-Angular/src/app/`
- Prefer per-frontend task groups so apps stay independently deliverable

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align workspace with feature docs and confirm baseline apps run

- [x] T001 Confirm feature docs present under `specs/006-eventos-list-ux/` (`plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `contracts/client-list-behavior.md`, `quickstart.md`) and `.specify/feature.json` points at this directory
- [x] T002 [P] Confirm API boots from `Back/src/ProEventos.Api/` (`dotnet run`) and CORS origins in `Back/src/ProEventos.Api/Program.cs` still include `5173` / `3000` / `4200`
- [x] T003 [P] Confirm each frontend starts with pnpm from `Front/Front-Vue/`, `Front/Front-React/`, and `Front/Front-Angular/` (ports 5173 / 3000 / 4200)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Relax `ImagemURL` validation and upgrade Bogus seeds so list images + pagination are demonstrable before UI stories

**⚠️ CRITICAL**: No user-story list/image work that depends on Unsplash HTTPS URLs until T004–T006 are done (recreate/empty SQLite so seed runs).

- [x] T004 Relax `ImagemURL` validation on `Back/src/ProEventos.Services/Dtos/EventoDto.cs` to accept either image-extension filenames **or** absolute `https://` URLs (Unsplash CDN) per `specs/006-eventos-list-ux/contracts/openapi.yaml`
- [x] T005 Rewrite Bogus generation in `Back/src/ProEventos.Persistence/Seeds/EventoSeeds.cs` to produce a fixed minimum of **50** eventos (target 50–80), each with 1–3 lotes, `Preco>0`, `Quantidade>0`, `DataFim >= DataIncio`, and `ImagemURL` set to event-themed `https://images.unsplash.com/...` URLs (curated pool; optional Access Key search only if already configured — never ProEventos JWT)
- [x] T006 Ensure seed path runs on empty DB from `Back/src/ProEventos.Api/Program.cs` (or existing EnsureCreated/seed hook in Persistence) so a fresh `ProEventos.db` yields ≥50 eventos; document recreate/delete-db step in `specs/006-eventos-list-ux/quickstart.md` if needed
- [x] T007 [P] Add or extend a persistence/API smoke assertion under `Back/tests/ProEventos.Persistence.Tests/` or `Back/tests/ProEventos.Api.Tests/` that seeded count is >30 and sample `ImagemURL` values are https (or valid relaxed pattern)

**Checkpoint**: API accepts Unsplash `imagemURL`; fresh DB has ≥50 eventos with coherent lotes — foundation for US1–US4 UI

---

## Phase 3: User Story 1 - Listar eventos com imagem e paginação (Priority: P1) 🎯 MVP

**Goal**: Lista com coluna de imagem à esquerda de Tema, hide/show, paginação client-side 10/20/30 nos três frontends (FR-001–FR-006, FR-014–FR-015)

**Independent Test**: Com volume seedado, abrir a lista em qualquer frontend — imagem à esquerda de Tema, hide/show, mudar pageSize, navegar ≥3 páginas com size 10; Network sem Bearer nas GETs de imagem CDN (SC-001, SC-002, SC-006)

### Implementation for User Story 1

- [x] T008 [P] [US1] Add client pagination helper (slice by page/pageSize ∈ {10,20,30}, totalPages, clamp page) in `Front/Front-Vue/src/` (e.g. `utils/pagination.ts` or under `shared/`)
- [x] T009 [P] [US1] Add the same pagination helper in `Front/Front-React/src/` (e.g. `utils/pagination.ts` or `shared/`)
- [x] T010 [P] [US1] Add the same pagination helper in `Front/Front-Angular/src/app/` (e.g. `shared/pagination.ts` or `utils/`)
- [x] T011 [US1] Update Vue list in `Front/Front-Vue/src/components/eventos/EventoLista.vue`: image column left of Tema (`imagemURL` thumb), hide/show control (session state), pageSize selector 10/20/30, prev/next or page controls, empty-state colspan fix
- [x] T012 [P] [US1] Update React list in `Front/Front-React/src/components/eventos/EventosPage.tsx` with the same image column, hide/show, and pagination UX per `contracts/client-list-behavior.md`
- [x] T013 [P] [US1] Update Angular list in `Front/Front-Angular/src/app/components/eventos/eventos-list/eventos-list.component.ts` (+ template) with the same image column, hide/show, and pagination UX
- [x] T014 [US1] Ensure broken/missing `imagemURL` does not break the row (placeholder/empty cell) on all three list UIs; confirm HTTP interceptors do not attach JWT to Unsplash/CDN image requests

**Checkpoint**: US1 MVP — three lists show Unsplash thumbs, hide/show, and 10/20/30 pagination over shared `GET /eventos`

---

## Phase 4: User Story 2 - Datas sempre em dd/MM/yyyy (Priority: P1)

**Goal**: Todas as datas de evento/lote na UI em `dd/MM/yyyy` (lista, detalhe, create/edit) nos três apps (FR-007–FR-008)

**Independent Test**: Percorrer lista + formulário em um frontend — 100% das datas visíveis em dd/MM/yyyy; data inválida mostra feedback (SC-003)

### Implementation for User Story 2

- [x] T015 [P] [US2] Add `formatDateBr` / parse helpers in `Front/Front-Vue/src/` (e.g. `utils/date.ts`) and use them in `Front/Front-Vue/src/components/eventos/EventoLista.vue`, `FormularioEvento.vue`, `DetalhesEvento.vue`, and lote date fields
- [x] T016 [P] [US2] Add `formatDateBr` / parse helpers in `Front/Front-React/src/` (e.g. `utils/date.ts`) and use them in `Front/Front-React/src/components/eventos/EventosPage.tsx` and `EventoDetailPage.tsx` (evento + lote dates)
- [x] T017 [P] [US2] Add `formatDateBr` / parse helpers in `Front/Front-Angular/src/app/` (e.g. `shared/date.ts` or pipe) and use them in `eventos-list` + `evento-form` components
- [x] T018 [US2] Align form schemas/validators so date inputs accept/display `dd/MM/yyyy` in `Front/Front-Vue/src/forms/schemas/eventoSchema.ts`, `Front/Front-React/src/forms/schemas/eventoSchema.ts`, and `Front/Front-Angular/src/app/forms/schemas/evento-form.factory.ts` (keep API wire ISO/`dataIncio` mapping as today)

**Checkpoint**: US2 — list and forms show/edit dates as dd/MM/yyyy on all three fronts

---

## Phase 5: User Story 3 - Editar lotes em cards com campos nomeados (Priority: P1)

**Goal**: Na edição, um card por lote com rótulos (nome, preço, quantidade, data início, data fim) e validação incluindo data fim ≥ início (FR-009–FR-012)

**Independent Test**: Abrir edição com 2+ lotes — N cards; labels visíveis; data fim < início bloqueia save com feedback no card (SC-004)

### Implementation for User Story 3

- [x] T019 [P] [US3] Refactor Vue lotes UI in `Front/Front-Vue/src/components/eventos/LotesEvento.vue` (and wire from `FormularioEvento.vue`) into one labeled card per lote with Nome, Preço, Quantidade, Data início, Data fim (`dd/MM/yyyy`) and field-level errors
- [x] T020 [P] [US3] Refactor React lotes section in `Front/Front-React/src/components/eventos/EventoDetailPage.tsx` into one labeled card per lote with the same fields, validation, and add-lote → new card
- [x] T021 [P] [US3] Refactor Angular lotes UI in `Front/Front-Angular/src/app/components/eventos/evento-form/evento-form.component.ts` (+ template) into one labeled card per lote with the same fields and validators
- [x] T022 [US3] Confirm client validation mirrors `LoteDto` rules (preço/quantidade > 0, data início ≤ data fim) and failed save shows messages on the affected card; map Vue `dataInicio` ↔ API `dataIncio` at the service/form boundary if still mismatched

**Checkpoint**: US3 — lote cards with named validated fields work on all three edit screens

---

## Phase 6: User Story 4 - Volume de dados de estudo no backend (Priority: P2)

**Goal**: Confirmar e endurecer o volume Bogus para demonstrar paginação e lotes sem cadastro manual (FR-013) — builds on Phase 2 seeds

**Independent Test**: `GET /eventos` length >30; abrir edição de evento seedado com lotes e datas coerentes (SC-005)

### Implementation for User Story 4

- [x] T023 [US4] Verify `Back/src/ProEventos.Persistence/Seeds/EventoSeeds.cs` uses a deterministic Bogus `Randomizer.Seed` (or fixed seed value) so local demos are reproducible across runs
- [x] T024 [US4] Spot-check seeded lotes via API (`GET /eventos/{id}` or lotes endpoint) for `dataIncio`/`dataFim` order and non-empty names; fix generators in `EventoSeeds.cs` if any invalid rows remain
- [x] T025 [US4] Run `dotnet test` under `Back/tests/` and confirm T007 seed assertion still passes after any US4 tweaks; update quickstart expected counts if target changed

**Checkpoint**: US4 — study DB reliably demos 10/20/30 pagination and lote edit with seed data

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Parity pass and quickstart validation across stories

- [x] T026 [P] Walk `specs/006-eventos-list-ux/contracts/client-list-behavior.md` checklist on Vue list + edit
- [x] T027 [P] Walk the same client-list-behavior checklist on React list + edit
- [x] T028 [P] Walk the same client-list-behavior checklist on Angular list + edit
- [x] T029 Execute `specs/006-eventos-list-ux/quickstart.md` end-to-end (API + one frontend happy path + note parity for the other two)
- [x] T030 Confirm no Contatos work and no premium redesign; image column / lote cards remain didactic only

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** meaningful US1 image/pagination demos (ImagemURL + ≥50 seeds)
- **User Story 1 (Phase 3)**: Depends on Foundational — 🎯 MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; can run in parallel with US1/US3 on different files (date helpers vs list chrome vs cards — coordinate if touching same form files)
- **User Story 3 (Phase 5)**: Depends on Foundational; best after US2 date helpers exist for lote date inputs
- **User Story 4 (Phase 6)**: Depends on Foundational seed baseline; polish/verify after UI stories or in parallel with them
- **Polish (Phase 7)**: After desired user stories complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on US2–US4 code (uses seeded `imagemURL` + client pagination)
- **US2 (P1)**: After Phase 2 — independently testable; recommended before finishing US3 date fields
- **US3 (P1)**: After Phase 2 — ideally after US2 helpers; independently testable on edit screens
- **US4 (P2)**: After Phase 2 baseline — hardens/verifies seed; full SC-002/SC-005 need this + US1

### Within Each User Story

- Helpers before UI wiring
- One frontend at a time is fine; `[P]` frontends can be parallelized by different people
- Story complete before treating checkpoint as done

### Parallel Opportunities

- T002–T003 (setup confirmations)
- T008–T010 (pagination helpers per frontend)
- T012–T013 after T011 pattern is clear (or all three lists in parallel if staffed)
- T015–T017 (date helpers per frontend)
- T019–T021 (lote cards per frontend)
- T026–T028 (parity checklists)

---

## Parallel Example: User Story 1

```bash
# Pagination helpers in parallel:
Task: "Add pagination helper in Front/Front-Vue/src/utils/pagination.ts"
Task: "Add pagination helper in Front/Front-React/src/utils/pagination.ts"
Task: "Add pagination helper in Front/Front-Angular/src/app/shared/pagination.ts"

# Then list UIs in parallel (after helpers):
Task: "Update EventoLista.vue image column + pagination"
Task: "Update EventosPage.tsx image column + pagination"
Task: "Update eventos-list Angular image column + pagination"
```

---

## Parallel Example: User Story 2

```bash
Task: "Add formatDateBr in Front/Front-Vue/src/utils/date.ts and wire list/forms"
Task: "Add formatDateBr in Front/Front-React/src/utils/date.ts and wire list/forms"
Task: "Add formatDateBr in Front/Front-Angular/src/app/shared/date.ts and wire list/forms"
```

---

## Parallel Example: User Story 3

```bash
Task: "Lote cards in Front/Front-Vue/src/components/eventos/LotesEvento.vue"
Task: "Lote cards in Front/Front-React/src/components/eventos/EventoDetailPage.tsx"
Task: "Lote cards in Front/Front-Angular/.../evento-form/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (ImagemURL + Bogus ≥50) — CRITICAL
3. Complete Phase 3: User Story 1 (list image + pagination on three fronts)
4. **STOP and VALIDATE** via quickstart list steps
5. Demo MVP

### Incremental Delivery

1. Setup + Foundational → seeds + valid Unsplash URLs
2. US1 → list UX MVP
3. US2 → dd/MM/yyyy everywhere
4. US3 → lote cards on edit
5. US4 → seed determinism / verify volume
6. Polish → full quickstart + parity checklist

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then:
   - Dev A: US1 Vue → React → Angular (or one app each for US1)
   - Dev B: US2 date helpers across apps
   - Dev C: US3 lote cards (after date helpers land)
3. Anyone: US4 seed verify + Polish

---

## Notes

- [P] = different files, no dependencies on incomplete tasks
- [Story] maps to US1–US4 in spec.md
- Client-side pagination only — do not change `GET /eventos` to PageList in this feature
- Never send ProEventos JWT to Unsplash/CDN
- No Contatos; no premium redesign
- Commit after each task or logical group
- Stop at checkpoints to validate independently
