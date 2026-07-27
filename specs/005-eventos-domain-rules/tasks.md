# Tasks: Eventos Domain Business Rules

**Input**: Design documents from `/specs/005-eventos-domain-rules/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

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

- [x] T001 Confirm feature docs present under `specs/005-eventos-domain-rules/` (`plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`) and `.specify/feature.json` points at this directory
- [x] T002 [P] Confirm API boots from `Back/src/ProEventos.Api/` (`dotnet run`) and CORS origins in `Back/src/ProEventos.Api/Program.cs` still include `5173` / `3000` / `4200`
- [x] T003 [P] Confirm each frontend starts with pnpm from `Front/Front-Vue/`, `Front/Front-React/`, and `Front/Front-Angular/` (ports 5173 / 3000 / 4200)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Identity/JWT infrastructure and shared DI so domain + auth stories can land without reworking the host

**⚠️ CRITICAL**: No user-story auth or `[Authorize]` work until this phase is complete. Domain gap-fills (US1–US4) may proceed after T004–T007; Account UI (US5) needs the full phase.

- [x] T004 Add ASP.NET Core Identity + JWT Bearer package references to `Back/src/ProEventos.Api/ProEventos.Api.csproj`, `Back/src/ProEventos.Persistence/ProEventos.Persistence.csproj`, and `Back/src/ProEventos.CrossCutting/ProEventos.CrossCutting.csproj` as required by DI ownership
- [x] T005 Extend `Back/src/ProEventos.Persistence/DataContext.cs` to integrate Identity (`IdentityDbContext` or equivalent) for User tables in the same SQLite database
- [x] T006 [P] Implement JWT + Identity registration in `Back/src/ProEventos.CrossCutting/DependencyInjection/ConfigureService.cs` (token options, `AddIdentity`, `AddAuthentication`/`AddJwtBearer`)
- [x] T007 Wire `UseAuthentication` / `UseAuthorization` in `Back/src/ProEventos.Api/Program.cs` without yet locking domain endpoints (keep mutating routes open until US5)
- [x] T008 [P] Fill account DTOs in `Back/src/ProEventos.Services/Dtos/` (replace empty `UserDto.cs`; add register/login/profile/change-password request/response types matching `specs/005-eventos-domain-rules/contracts/openapi.yaml`)
- [x] T009 Create `IAccountService` / `AccountService` under `Back/src/ProEventos.Services/Interfaces/` and `Back/src/ProEventos.Services/Services/` (register, login→token, profile get/update, change password, unique email)
- [x] T010 Register `IAccountService` in `Back/src/ProEventos.CrossCutting/DependencyInjection/ConfigureService.cs`
- [x] T011 [P] Ensure Mapster mappings for account DTOs in `Back/src/ProEventos.Services/Mappings/MapsterConfig.cs` if needed
- [x] T012 Document local JWT settings (secret, issuer, audience, lifetime) in `Back/src/ProEventos.Api/appsettings.Development.json` (or existing config files) for didactic local use only

**Checkpoint**: Identity + JWT host ready; Account service exists; domain endpoints still callable without token for US1–US4 API work

---

## Phase 3: User Story 1 - Manage eventos (Priority: P1) 🎯 MVP

**Goal**: Evento create/list/theme-search/get/edit/delete obey FR-001–FR-007; cascade removes lotes + redes (FR-004)

**Independent Test**: Via HTTP client — create with required fields (incl. Local), list, `GET /eventos/tema/{tema}`, update, delete; after delete, related lotes/redes are gone (SC-002, SC-004)

### Implementation for User Story 1

- [x] T013 [P] [US1] Add `[Required]` (and any missing annotations) for `Local` and required create fields on `Back/src/ProEventos.Services/Dtos/EventoDto.cs` per FR-001 / data-model
- [x] T014 [US1] Confirm theme search uses case-insensitive contains in `Back/src/ProEventos.Services/Services/EventoService.cs` and repository; fix if exact-match only
- [x] T015 [US1] Verify Evento delete cascades lotes + redes in `Back/src/ProEventos.Services/Services/EventoService.cs` / EF config under `Back/src/ProEventos.Persistence/`; add persistence/API coverage under `Back/tests/ProEventos.Persistence.Tests/` or `Back/tests/ProEventos.Api.Tests/` if missing
- [x] T016 [P] [US1] Align Vue Evento form required fields (Local included) in `Front/Front-Vue/src/forms/schemas/eventoSchema.ts` and `Front/Front-Vue/src/components/eventos/` create/edit screens
- [x] T017 [P] [US1] Align React Evento form required fields in `Front/Front-React/src/forms/schemas/eventoSchema.ts` and `Front/Front-React/src/components/eventos/EventoDetailPage.tsx`
- [x] T018 [P] [US1] Align Angular Evento form required fields in `Front/Front-Angular/src/app/forms/schemas/evento-form.factory.ts` and `Front/Front-Angular/src/app/components/eventos/evento-form/`
- [x] T019 [US1] Confirm theme-search UX exists on all three list screens (`Front/Front-Vue/src/components/eventos/EventoLista.vue`, `Front/Front-React/src/components/eventos/EventosPage.tsx`, `Front/Front-Angular/src/app/components/eventos/eventos-list/`); wire to existing `GET /eventos/tema/{tema}` services if gaps

**Checkpoint**: US1 MVP — Evento CRUD + theme search + cascade verified on API; forms collect required fields on three fronts

---

## Phase 4: User Story 2 - Manage lotes of an evento (Priority: P1)

**Goal**: Lotes belong to one evento; name/price/dates/quantity required; reject invalid dates and non-positive price/qty; delete lote without deleting evento

**Independent Test**: Authenticated-or-open `PUT /lotes/{eventoId}` rejects `preco≤0`, `quantidade≤0`, `dataIncio>dataFim`; valid save + `DELETE /lotes/{eventoId}/{loteId}` leaves Evento (SC-003)

### Implementation for User Story 2

- [x] T020 [P] [US2] Add DataAnnotations / custom validation on `Back/src/ProEventos.Services/Dtos/LoteDto.cs` (`Nome` required, `Preco>0`, `Quantidade>0`, `DataFim>=DataIncio`)
- [x] T021 [US2] Enforce lote validation in `Back/src/ProEventos.Services/Services/LotesServices.cs` returning clear 400-capable failures before persist
- [x] T022 [US2] Update seed generators in `Back/src/ProEventos.Persistence/Seeds/EventoSeeds.cs` so sample lotes always have `Preco>0` and `Quantidade>0` with ordered dates
- [x] T023 [P] [US2] Align Vue lote client validation in `Front/Front-Vue/src/components/eventos/` (e.g. `LotesEvento.vue`) and any lote schemas under `Front/Front-Vue/src/forms/`
- [x] T024 [P] [US2] Align React lote validation in `Front/Front-React/src/components/eventos/EventoDetailPage.tsx` (and lote-related schemas if present under `Front/Front-React/src/forms/`)
- [x] T025 [P] [US2] Align Angular lote validation in `Front/Front-Angular/src/app/components/eventos/evento-form/` (and forms factories under `Front/Front-Angular/src/app/forms/`)
- [x] T026 [US2] Confirm single-lote delete path via `Front/*/services` calling `DELETE /lotes/{eventoId}/{loteId}` without deleting parent Evento

**Checkpoint**: US2 — invalid lotes rejected server-side; fronts surface validation; lote delete is independent

---

## Phase 5: User Story 3 - Manage palestrantes and link them to eventos (Priority: P2)

**Goal**: Palestrante CRUD; search by nome and by evento tema; many-to-many associate/disassociate (FR-014–FR-017)

**Independent Test**: CRUD palestrante; `GET /palestrantes/nome/{nome}` and `GET /palestrantes/tema/{tema}`; `PUT`/`DELETE /eventos/{eventoId}/palestrantes/{palestranteId}`; same palestrante on two eventos (SC-005)

### Implementation for User Story 3

- [x] T027 [P] [US3] Extend `Back/src/ProEventos.Domain/Interfaces/Repositories/IPalestrantesRepository.cs` and `Back/src/ProEventos.Persistence/Repository/PalestrantesRepository.cs` with search-by-nome, search-by-tema, and associate/disassociate helpers (unique pair guard)
- [x] T028 [US3] Extend `Back/src/ProEventos.Services/Interfaces/IPalestranteService.cs` and `Back/src/ProEventos.Services/Services/PalestranteService.cs` for search + link operations
- [x] T029 [US3] Add routes in `Back/src/ProEventos.Api/Endpoints/PalestranteEndpoints.cs` and/or `Back/src/ProEventos.Api/Endpoints/EventoEndpoints.cs` for `GET /palestrantes/nome/{nome}`, `GET /palestrantes/tema/{tema}`, `PUT|DELETE /eventos/{eventoId}/palestrantes/{palestranteId}` per `contracts/openapi.yaml`
- [x] T030 [P] [US3] Add Vue service methods in `Front/Front-Vue/src/services/` (palestrante/evento services) for search + associate/disassociate
- [x] T031 [P] [US3] Add React service methods in `Front/Front-React/src/services/` for search + associate/disassociate
- [x] T032 [P] [US3] Add Angular service methods in `Front/Front-Angular/src/app/services/` for search + associate/disassociate
- [x] T033 [P] [US3] Expose search-by-name and search-by-tema UI in `Front/Front-Vue/src/components/palestrantes/`
- [x] T034 [P] [US3] Expose search-by-name and search-by-tema UI in `Front/Front-React/src/components/palestrantes/`
- [x] T035 [P] [US3] Expose search-by-name and search-by-tema UI in `Front/Front-Angular/src/app/components/palestrantes/`
- [x] T036 [US3] Add didactic associate/disassociate controls on Evento and/or Palestrante edit screens for all three fronts (reuse existing feature folders; no redesign)

**Checkpoint**: US3 — palestrante search + N:N links work via API and three UIs

---

## Phase 6: User Story 4 - Manage redes sociais for evento or palestrante (Priority: P2)

**Goal**: Multiple redes per Evento or Palestrante; XOR owner; cascade with Evento delete; individual delete leaves owner

**Independent Test**: CRUD redes under evento and under palestrante via `/redes-sociais/...`; delete Evento removes its redes; delete one rede keeps owner (FR-018–FR-020)

### Implementation for User Story 4

- [x] T037 [US4] Enforce XOR owner invariant (EventoId xor PalestranteId) in `Back/src/ProEventos.Services/Services/RedeSocialService.cs` and DTO validation under `Back/src/ProEventos.Services/Dtos/`
- [x] T038 [US4] Confirm owner-scoped endpoints in `Back/src/ProEventos.Api/Endpoints/RedeSocialEndpoints.cs` match contract behavior; fix gaps only
- [x] T039 [P] [US4] Verify Vue redes UI on Evento/Palestrante edit under `Front/Front-Vue/src/components/eventos/` and `Front/Front-Vue/src/components/palestrantes/`; fix save/delete wiring if broken
- [x] T040 [P] [US4] Verify React redes UI under `Front/Front-React/src/components/eventos/` and `Front/Front-React/src/components/palestrantes/`; fix gaps
- [x] T041 [P] [US4] Verify Angular redes UI under `Front/Front-Angular/src/app/components/eventos/` and `Front/Front-Angular/src/app/components/palestrantes/`; fix gaps

**Checkpoint**: US4 — redes ownership rules hold; UIs manage links for both owners

---

## Phase 7: User Story 5 - Account access and protected maintenance (Priority: P3)

**Goal**: Register/login/profile/password; Bearer credential; deny unauthenticated edit/profile; interceptor attaches token (FR-021–FR-025)

**Independent Test**: Register unique email; duplicate email fails; login returns token; without token POST/PUT/DELETE → 401; with token full maintain flow; unauthenticated frontend cannot open edit/profile (SC-007, SC-008)

### Implementation for User Story 5

- [x] T042 [US5] Map Account Minimal API endpoints in new `Back/src/ProEventos.Api/Endpoints/AccountEndpoints.cs` (`/account/register`, `/login`, `/profile`, `/change-password`) and register in `Back/src/ProEventos.Api/Program.cs`
- [x] T043 [US5] Apply `.RequireAuthorization()` (or equivalent) to mutating domain endpoint groups in `Back/src/ProEventos.Api/Endpoints/EventoEndpoints.cs`, `LoteEndpoints.cs`, `PalestranteEndpoints.cs`, `RedeSocialEndpoints.cs` while keeping GET anonymous
- [x] T044 [P] [US5] Create Vue auth service + token storage in `Front/Front-Vue/src/services/` (e.g. `accountService.ts` / `authService.ts`) and models under `Front/Front-Vue/src/Models/identity/`
- [x] T045 [P] [US5] Create React auth service + token storage in `Front/Front-React/src/services/` and models under `Front/Front-React/src/models/`
- [x] T046 [P] [US5] Create Angular auth service + token storage in `Front/Front-Angular/src/app/services/` and models under `Front/Front-Angular/src/app/models/`
- [x] T047 [P] [US5] Add Vue HTTP auth interceptor/plugin so requests include `Authorization: Bearer` from `Front/Front-Vue/src/services/` (or axios/fetch wrapper already used)
- [x] T048 [P] [US5] Add React auth header injection in `Front/Front-React/src/services/http.ts` (or equivalent shared HTTP helper)
- [x] T049 [P] [US5] Add Angular `AuthInterceptor` under `Front/Front-Angular/src/app/` (services or `core/`) and register in app config
- [x] T050 [P] [US5] Activate Vue login + register screens in `Front/Front-Vue/src/components/user/login/` and `Front/Front-Vue/src/components/user/registrar/`; add profile + change-password views under `Front/Front-Vue/src/components/user/`
- [x] T051 [P] [US5] Activate React login in `Front/Front-React/src/components/user/LoginPage.tsx`; add register + profile + change-password pages under `Front/Front-React/src/components/user/`
- [x] T052 [P] [US5] Activate Angular login in `Front/Front-Angular/src/app/components/user/login/`; add register + profile + change-password under `Front/Front-Angular/src/app/components/user/`
- [x] T053 [P] [US5] Add Vue route guards in `Front/Front-Vue/src/router/index.ts` blocking evento edit, palestrante edit, and profile routes when unauthenticated
- [x] T054 [P] [US5] Add React route guards in `Front/Front-React/src/App.tsx` (or router module) for the same protected paths
- [x] T055 [P] [US5] Add Angular `canActivate` guards in `Front/Front-Angular/src/app/app.routes.ts` for the same protected paths
- [x] T056 [US5] Update nav links (login/logout/perfil) in `Front/Front-Vue/src/shared/`, `Front/Front-React/src/shared/Nav.tsx`, and `Front/Front-Angular/src/app/shared/nav/` for session state

**Checkpoint**: US5 — auth end-to-end on API + three fronts; protected maintenance enforced

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Contract sync, regression, quickstart validation

- [x] T057 [P] Diff `specs/005-eventos-domain-rules/contracts/openapi.yaml` against implemented routes; update contract or code for remaining deltas (keep 001 baseline + 005 extensions consistent)
- [x] T058 [P] Run `dotnet test` from `Back/` and fix regressions in `Back/tests/ProEventos.Api.Tests/`, `ProEventos.Services.Tests/`, `ProEventos.Persistence.Tests/`
- [x] T059 [P] Run `pnpm test` in `Front/Front-Vue/`, `Front/Front-React/`, and `Front/Front-Angular/`; fix auth/guard/import breakage only
- [x] T060 Execute validation scenarios in `specs/005-eventos-domain-rules/quickstart.md` (API smoke + one frontend full journey + note parity on the other two)
- [x] T061 Confirm Contatos and premium redesign remain untouched; no SSO/IdP packages added beyond didactic JWT Identity

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS US5; strongly recommended before locking writes
- **US1 (Phase 3)**: After Setup (and ideally T013-ready DTOs); can start once T001–T003 done if Foundation JWT not required for open mutating routes
- **US2 (Phase 4)**: Independent of US1 UI; shares Evento existence (use seeds or US1)
- **US3 (Phase 5)**: Independent search/link APIs; benefits from existing Evento/Palestrante CRUD
- **US4 (Phase 6)**: Independent of US3; cascade checked with US1 delete
- **US5 (Phase 7)**: Depends on Phase 2 (Account service + JWT); should run after US1–US4 API surfaces exist so Authorize covers real routes
- **Polish (Phase 8)**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: MVP — no dependency on other stories
- **US2 (P1)**: Needs an Evento id (seed or US1)
- **US3 (P2)**: Needs Evento + Palestrante entities (existing CRUD OK)
- **US4 (P2)**: Needs Evento and/or Palestrante owners
- **US5 (P3)**: Depends on Phase 2; locks writes after domain routes exist

### Within Each User Story

- Backend validation/services before frontend alignment
- API routes before client service methods before UI
- Story complete before relying on it in Polish

### Parallel Opportunities

- T002–T003 (Setup) in parallel
- T006–T008–T011 (Foundation packages/DTOs/Mapster) in parallel where files differ
- T016–T018 (US1 three fronts) in parallel
- T023–T025 (US2 three fronts) in parallel
- T030–T035 (US3 services + search UI) in parallel across apps
- T039–T041 (US4) in parallel
- T044–T055 (US5 per-app auth) largely parallel after T042–T043
- T057–T059 (Polish) in parallel

---

## Parallel Example: User Story 1

```bash
# After T013–T015 (API rules):
Task: "Align Vue Evento form required fields in Front/Front-Vue/src/forms/schemas/eventoSchema.ts"
Task: "Align React Evento form required fields in Front/Front-React/src/forms/schemas/eventoSchema.ts"
Task: "Align Angular Evento form required fields in Front/Front-Angular/src/app/forms/schemas/evento-form.factory.ts"
```

## Parallel Example: User Story 5

```bash
# After T042–T043 (Account API + Authorize):
Task: "Create Vue auth service in Front/Front-Vue/src/services/"
Task: "Create React auth service in Front/Front-React/src/services/"
Task: "Create Angular auth service in Front/Front-Angular/src/app/services/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational (JWT host ready; endpoints still open)  
3. Complete Phase 3: US1 Evento rules + forms  
4. **STOP and VALIDATE**: Theme search + cascade via HTTP / one frontend  

### Incremental Delivery

1. Setup + Foundational → host ready  
2. US1 Eventos → MVP demo  
3. US2 Lotes → validation demo  
4. US3 Palestrantes links → search/associate demo  
5. US4 Redes → ownership demo  
6. US5 Auth → lock writes + three-front parity  
7. Polish → quickstart green  

### Parallel Team Strategy

1. Team finishes Setup + Foundational together  
2. Then:  
   - Dev A: US1 + US2 (API + one frontend)  
   - Dev B: US3 + US4 (API + another frontend)  
   - Dev C: US5 frontend parity after T042–T043  
3. Integrate on shared API contract from `contracts/openapi.yaml`

---

## Notes

- [P] = different files, no incomplete-task dependencies
- Keep business rules on the API; fronts only mirror UX
- Do not add tickets, payments, capacity, Contatos, or SSO
- Commit after each task or logical group when requested by the user
- Stop at any checkpoint to validate the story independently
