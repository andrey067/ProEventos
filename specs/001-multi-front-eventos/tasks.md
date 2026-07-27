---
description: "Task list for multi-frontend eventos study platform"
---

# Tasks: Multi-Frontend Eventos Study Platform

**Input**: Design documents from `/specs/001-multi-front-eventos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: REQUIRED by spec (US6, FR-016–018) — unit tests only; no E2E cross-front

**Organization**: Tasks grouped by user story for independent delivery

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: [US1]…[US6] for story phases only
- Exact file paths in every description

## Path Conventions

- **Backend**: `Back/src/ProEventos.*/`, tests in `Back/tests/ProEventos.Services.Tests/`
- **Vue**: `Front/Front-Vue/`
- **React**: `Front/Front-React/`
- **Angular**: `Front/Front-Angular/`
- **Package manager**: pnpm per app (`cd Front/Front-* && pnpm install && pnpm dev`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Folder layout and documentation skeleton so later work lands in the right places

- [X] T001 Rename `Front/` to `Front-Vue/` at repo root (update any workspace/launch references under `.vscode/` that point at `Front/`)
- [X] T002 [P] Create root `README.md` skeleton (project purpose, folder tree placeholders, prereqs, auth-not-implemented note)
- [X] T003 [P] Create thin stubs `Back/README.md` and `Front-Vue/README.md` linking to root README
- [X] T004 [P] Ensure `Back/tests/` directory exists and note it in root README skeleton

**Checkpoint**: Repo uses `Front-Vue/`; README stubs exist

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: .NET 8 host, Mapster, CORS, Minimal API pipeline — MUST complete before story endpoints

**⚠️ CRITICAL**: No user story API work until this phase is done

- [X] T005 Retarget all projects under `Back/src/` to `net8.0` and bump EF Core / ASP.NET packages to 8.x in `*.csproj` files
- [X] T006 Replace AutoMapper with Mapster in `Back/src/ProEventos.CrossCutting/DependencyInjection/ConfigureService.cs` and remove AutoMapper package references
- [X] T007 Add Mapster mapping configs for Evento/Lote/Palestrante/RedeSocial under `Back/src/ProEventos.Services/Mappings/` (or equivalent)
- [X] T008 Convert `Back/src/ProEventos.Api/` to .NET 8 minimal hosting in `Program.cs` (Swagger/Swashbuckle 9, DI from CrossCutting, SQLite)
- [X] T009 [P] Configure CORS in `Back/src/ProEventos.Api/Program.cs` for `http://localhost:5173`, `http://localhost:3000`, `http://localhost:4200`
- [X] T010 Remove MVC Controllers usage: delete or gut `Back/src/ProEventos.Api/Controllers/*.cs` and stop registering Controllers once Endpoints exist (leave temporary no-op only if needed until US1 maps routes)
- [X] T011 [P] Create empty endpoint extension stubs `Back/src/ProEventos.Api/Endpoints/EventoEndpoints.cs`, `LoteEndpoints.cs`, `PalestranteEndpoints.cs`, `RedeSocialEndpoints.cs` and map them from `Program.cs`
- [X] T012 [P] Create xUnit test project `Back/tests/ProEventos.Services.Tests/ProEventos.Services.Tests.csproj` (Moq, optional FluentAssertions) and add it to `Back/src/ProEventos.sln`
- [X] T013 Confirm `DataContext` + connection string still use SQLite in `Back/src/ProEventos.CrossCutting/DependencyInjection/ConfigureRepository.cs` and `appsettings*.json`; apply EF migrations update if package bump requires it

**Checkpoint**: `dotnet build` on solution succeeds; API starts with Swagger; CORS configured; test project compiles empty

---

## Phase 3: User Story 1 - Manage eventos via API (Priority: P1) 🎯 MVP

**Goal**: Stable Evento CRUD + theme search; POST creates, PUT updates (bugs fixed)

**Independent Test**: Swagger/curl against `/eventos` — list, create, get, update, delete, `GET /eventos/tema/{tema}`

### Tests for User Story 1 (REQUIRED)

- [X] T014 [P] [US1] Write failing unit tests for Evento create vs update vs delete in `Back/tests/ProEventos.Services.Tests/EventoServiceTests.cs` (mocked repositories)
- [X] T015 [P] [US1] Write failing unit tests for get-by-id / get-by-tema in `Back/tests/ProEventos.Services.Tests/EventoServiceTests.cs`

### Implementation for User Story 1

- [X] T016 [US1] Complete/fix `EventoDto` validation and drop auth-only fields from required flow in `Back/src/ProEventos.Services/Dtos/EventoDto.cs`
- [X] T017 [US1] Fix `EventoService` create/update/delete methods in `Back/src/ProEventos.Services/Services/EventoService.cs` so create ≠ update ≠ delete
- [X] T018 [US1] Implement `MapEventoEndpoints` routes in `Back/src/ProEventos.Api/Endpoints/EventoEndpoints.cs` per `specs/001-multi-front-eventos/contracts/openapi.yaml` (`GET/POST /eventos`, `GET/PUT/DELETE /eventos/{id}`, `GET /eventos/tema/{tema}`)
- [X] T019 [US1] Wire validation → 400 and missing resource → 404/204 consistently in `EventoEndpoints.cs`
- [X] T020 [US1] Run `dotnet test` for Evento tests and fix until green

**Checkpoint**: Evento API MVP works in Swagger; Evento unit tests pass

---

## Phase 4: User Story 2 - Lotes and redes sociais do evento (Priority: P1)

**Goal**: Owner-scoped lotes + redes for an evento

**Independent Test**: Against a known `eventoId`, exercise `/lotes/...` and `/redes-sociais/evento/...` via Swagger

### Tests for User Story 2 (REQUIRED)

- [X] T021 [P] [US2] Write unit tests for lote get/save/delete in `Back/tests/ProEventos.Services.Tests/LotesServiceTests.cs`
- [X] T022 [P] [US2] Write unit tests for redes-sociais-by-evento save/get/delete in `Back/tests/ProEventos.Services.Tests/RedeSocialServiceTests.cs`

### Implementation for User Story 2

- [X] T023 [US2] Ensure `RedeSocial` entity/FK supports `PalestranteId` (and Evento ownership) in `Back/src/ProEventos.Domain/Entities/RedeSocial.cs` + EF config/migrations under `Back/src/ProEventos.Persistence/`
- [X] T024 [US2] Complete `ILotesService` / `LotesServices` behavior in `Back/src/ProEventos.Services/` for get/save/delete by evento
- [X] T025 [US2] Implement `LoteEndpoints.cs` (`GET/PUT /lotes/{eventoId}`, `DELETE /lotes/{eventoId}/{loteId}`)
- [X] T026 [US2] Implement RedeSocial service methods for evento owner in `Back/src/ProEventos.Services/`
- [X] T027 [US2] Implement evento-owner routes in `RedeSocialEndpoints.cs` (`GET/PUT /redes-sociais/evento/{eventoId}`, `DELETE .../{redeSocialId}`)
- [X] T028 [US2] Run `dotnet test` for Lote + RedeSocial(evento) tests until green

**Checkpoint**: Nested evento data APIs work without any frontend

---

## Phase 5: User Story 3 - Palestrantes (+ redes) (Priority: P2)

**Goal**: Full Palestrante CRUD + redes by palestrante

**Independent Test**: Swagger `/palestrantes` and `/redes-sociais/palestrante/...`

### Tests for User Story 3 (REQUIRED)

- [X] T029 [P] [US3] Write unit tests for Palestrante CRUD in `Back/tests/ProEventos.Services.Tests/PalestranteServiceTests.cs`
- [X] T030 [P] [US3] Extend `RedeSocialServiceTests.cs` for palestrante-owner paths

### Implementation for User Story 3

- [X] T031 [US3] Complete `PalestranteDto` (nome, contacts, etc.) in `Back/src/ProEventos.Services/Dtos/PalestranteDto.cs`
- [X] T032 [US3] Implement `PalestranteService` (or equivalent) in `Back/src/ProEventos.Services/Services/`
- [X] T033 [US3] Implement `PalestranteEndpoints.cs` CRUD per OpenAPI
- [X] T034 [US3] Implement palestrante-owner routes in `RedeSocialEndpoints.cs`
- [X] T035 [US3] Run full `dotnet test` under `Back/` until all service tests green

**Checkpoint**: Second domain context complete on API

---

## Phase 6: User Story 4 - Same CRUD UX on three frontends (Priority: P2)

**Goal**: Vue / Next / Angular each implement eventos + palestrantes flows against the shared API

**Independent Test**: With API up, complete list → edit → save → delete on each app; login/registro shell must not call auth APIs

### Front-Vue (reference)

- [X] T036 [US4] Upgrade `Front-Vue/package.json` to Vue 3.5 + Vite 6; keep Element Plus + Axios; remove Bootstrap/Bootswatch dependencies and imports
- [X] T037 [P] [US4] Add API base URL config (e.g. `Front-Vue/.env.example` + axios instance in `Front-Vue/src/services/httpClient.ts`)
- [X] T038 [P] [US4] Implement `Front-Vue/src/services/eventoService.ts` (list, get, create, update, delete, by tema)
- [X] T039 [P] [US4] Implement `Front-Vue/src/services/loteService.ts` and `Front-Vue/src/services/redeSocialService.ts`
- [X] T040 [P] [US4] Implement `Front-Vue/src/services/palestranteService.ts`
- [X] T041 [US4] Wire Evento lista (search, delete, navigate) in `Front-Vue/src/components/eventos/` and router
- [X] T042 [US4] Wire Evento create/edit form with lotes + redes in `Front-Vue/src/components/eventos/`
- [X] T043 [US4] Add Palestrantes list/form routes/components under `Front-Vue/src/` (no Contatos feature)
- [X] T044 [US4] Keep login/registro as visual shell only under `Front-Vue/src/components/user/` (no auth API calls); remove Contatos nav or leave inert
- [X] T045 [US4] Apply didactic UI (one accent, Element Plus only) in `Front-Vue/src` global styles

### Front-React (scaffold)

- [X] T046 [P] [US4] Scaffold React + Vite + TypeScript app in `Front-React/` with one UI system (plain CSS)
- [X] T047 [P] [US4] Add `Front-React/.env.example` with `VITE_API_URL` and API client under `Front-React/src/services/`
- [X] T048 [P] [US4] Implement Evento + Lote + RedeSocial + Palestrante service modules in `Front-React/`
- [X] T049 [US4] Create pages `Front-React/src/pages/EventosPage.tsx`, `EventoDetailPage.tsx`, `PalestrantesPage.tsx` (+ form as needed) mirroring Vue flows
- [X] T050 [US4] Add optional login/registro shell pages without auth API calls in `Front-React/src/pages/`

### Front-Angular (scaffold)

- [X] T051 [P] [US4] Scaffold Angular standalone (21 LTS preferred) app in `Front-Angular/` with one UI system (Material or plain CSS)
- [X] T052 [P] [US4] Set `apiUrl` in `Front-Angular/src/environments/environment.ts` and create HttpClient services under `Front-Angular/src/app/services/`
- [X] T053 [P] [US4] Implement Evento/Lote/RedeSocial/Palestrante services in `Front-Angular/src/app/services/`
- [X] T054 [US4] Add routes/components for eventos list/detail-form and palestrantes under `Front-Angular/src/app/` mirroring Vue
- [X] T055 [US4] Add login/registro shell routes without auth API calls in `Front-Angular/src/app/`

**Checkpoint**: Three frontends independently demonstrate the same CRUD against the API

---

## Phase 7: User Story 6 - Unit tests on API and each frontend (Priority: P2)

**Goal**: Runnable unit suites per stack; document commands (backend suites largely from US1–3 — fill gaps + frontends)

**Independent Test**: `dotnet test`, Vitest, and `ng test --watch=false --browsers=ChromeHeadless` all exit 0 without live multi-front E2E

### Backend gaps

- [X] T056 [US6] Review `Back/tests/ProEventos.Services.Tests/` coverage vs FR-016; add any missing context smoke tests and ensure `dotnet test` is documented in `Back/README.md`

### Front-Vue tests

- [X] T057 [P] [US6] Configure Vitest in `Front-Vue/` (`vitest.config.ts`, `package.json` `test` script)
- [X] T058 [P] [US6] Add unit tests for `eventoService` / `palestranteService` with Axios mocked in `Front-Vue/src/services/*.spec.ts` (or `__tests__/`)
- [X] T059 [P] [US6] Add at least one UI unit test for eventos list or form in `Front-Vue/src/components/eventos/*.spec.ts`

### Front-React tests

- [X] T060 [P] [US6] Configure Vitest + Testing Library in `Front-React/`
- [X] T061 [P] [US6] Add service/client unit tests with fetch/axios mocked under `Front-React/`
- [X] T062 [P] [US6] Add at least one UI unit test for eventos list or form under `Front-React/`

### Front-Angular tests

- [X] T063 [P] [US6] Ensure `ng test` config supports headless CI flags; document in `Front-Angular/README.md`
- [X] T064 [P] [US6] Add HttpClient-testing specs for Evento and Palestrante services in `Front-Angular/src/app/services/*.spec.ts`
- [X] T065 [P] [US6] Add at least one component spec for list or form in `Front-Angular/src/app/`

### Docs for tests

- [X] T066 [US6] Document all unit-test commands in root `README.md` and each app README (`Back/`, `Front-Vue/`, `Front-React/`, `Front-Angular/`)

**Checkpoint**: SC-006 and SC-007 satisfied

---

## Phase 8: User Story 5 - Runnable docs and folder layout (Priority: P3)

**Goal**: Complete learner-facing docs (structure already started in Setup)

**Independent Test**: Follow READMEs only → start API + one frontend; see endpoint table and auth note

- [X] T067 [P] [US5] Complete root `README.md` (structure, prereqs, how to run API, ports for three fronts, endpoint table, auth note, unit-test section)
- [X] T068 [P] [US5] Complete `Back/README.md` (run + test + link to root)
- [X] T069 [P] [US5] Complete `Front-Vue/README.md`, `Front-React/README.md`, `Front-Angular/README.md` (run, port, env, test, link to root)
- [X] T070 [US5] Verify folder names match plan (`Front-Vue`, `Front-React`, `Front-Angular`, `Back`) and Contatos is not documented as a feature

**Checkpoint**: SC-004 docs path works

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation against quickstart

- [X] T071 [P] Align launch URLs in `Back/src/ProEventos.Api/Properties/launchSettings.json` with README (5000/5001)
- [X] T072 Run manual smoke from `specs/001-multi-front-eventos/quickstart.md` (Swagger Evento POST/PUT regression + one frontend)
- [X] T073 [P] Remove dead Contatos feature code/routes if they confuse learners (or leave inert with no docs) across frontends
- [X] T074 Confirm no Identity/JWT packages or auth middleware were introduced under `Back/src/ProEventos.Api/`
- [X] T075 Run all unit suites green: `dotnet test` + `pnpm test:fronts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → no deps
- **Foundational (Phase 2)** → Setup; **blocks all API/UI stories**
- **US1 (Phase 3)** → Foundational — **MVP**
- **US2 (Phase 4)** → US1 (needs Evento ids for nested resources)
- **US3 (Phase 5)** → Foundational (can start after US1 in parallel with US2 if staffed; prefers Mapster/CORS ready)
- **US4 (Phase 6)** → US1 + US2 + US3 (API complete for parity screens)
- **US6 (Phase 7)** → US4 for frontend tests; backend tests largely done in US1–3 (T056 reviews)
- **US5 (Phase 8)** → can refine docs anytime after Setup; finalize after ports/commands known (after US4/US6)
- **Polish (Phase 9)** → after desired stories complete

### User Story Dependencies

| Story | Depends on | Independently testable with |
|-------|------------|-----------------------------|
| US1 | Foundational | Swagger Evento only |
| US2 | US1 (evento exists) | Swagger Lote/Rede evento |
| US3 | Foundational | Swagger Palestrante |
| US4 | US1–US3 | Each frontend UI vs live API |
| US6 | US1–US4 artifacts | Unit runners only |
| US5 | Setup (+ accurate commands) | README walkthrough |

### Parallel Opportunities

- T002–T004 (README stubs)
- T006/T007 vs T009/T011/T012 after T005
- T014–T015 together; T021–T022; T029–T030
- Within US4: T038–T040; T046–T048; T051–T053 across apps in parallel after API ready
- US6 frontend toolchains T057–T065 largely parallel per app
- T067–T069 docs parallel

---

## Parallel Example: User Story 1

```bash
# Tests first (parallel):
Task: "Write failing unit tests for Evento create vs update vs delete in Back/tests/ProEventos.Services.Tests/EventoServiceTests.cs"
Task: "Write failing unit tests for get-by-id / get-by-tema in Back/tests/ProEventos.Services.Tests/EventoServiceTests.cs"

# Then implement service + endpoints (sequential after tests exist):
Task: "Fix EventoService create/update/delete in Back/src/ProEventos.Services/Services/EventoService.cs"
Task: "Implement MapEventoEndpoints in Back/src/ProEventos.Api/Endpoints/EventoEndpoints.cs"
```

## Parallel Example: User Story 4 (three apps)

```bash
# After API complete, scaffold/upgrade in parallel:
Task: "Upgrade Front-Vue/package.json to Vue 3.5 + Vite 6..."
Task: "Scaffold React + Vite app in Front-React/..."
Task: "Scaffold Angular standalone app in Front-Angular/..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup  
2. Phase 2 Foundational  
3. Phase 3 US1 (Evento API + unit tests)  
4. **STOP**: Validate with Swagger + `dotnet test`  

### Incremental Delivery

1. US1 → working Evento API  
2. US2 → nested lote/rede for forms  
3. US3 → palestrantes API  
4. US4 → three frontends parity  
5. US6 → frontend unit tests + docs for tests  
6. US5 → README polish  
7. Polish → quickstart sign-off  

### Suggested MVP Scope

**US1 only** (Evento Minimal APIs + service bugfix + xUnit regression tests). Enough to unblock any single frontend spike afterward.

---

## Notes

- No Identity/JWT, Contatos feature, Docker, or cross-front E2E tasks on purpose  
- Do not share an npm types package across frontends  
- Keep UI didactic; one component library per frontend  
- Contract source of truth: `specs/001-multi-front-eventos/contracts/openapi.yaml`
