# Tasks: NetDevPack Identity & Palestrante Roles

**Input**: Design documents from `/specs/007-netdevpack-identity-roles/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not mandated as TDD in the spec; verification covered in Polish via API integration tests (SC-002 / research §9).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `Back/src/ProEventos.*/`
- **Tests**: `Back/tests/ProEventos.Api.Tests/`
- Frontends deferred (no UI tasks in this feature)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add NetDevPack and align package/config baselines

- [x] T001 Add NuGet package `NetDevPack.Identity` 8.0.0 to `Back/src/ProEventos.Api/ProEventos.Api.csproj` and/or `Back/src/ProEventos.CrossCutting/ProEventos.CrossCutting.csproj` (prefer CrossCutting for DI extensions)
- [x] T002 Align `Microsoft.AspNetCore.Identity.*` / `JwtBearer` package versions across `Back/src/ProEventos.Domain/ProEventos.Domain.csproj`, `Back/src/ProEventos.Persistence/ProEventos.Persistence.csproj`, `Back/src/ProEventos.CrossCutting/ProEventos.CrossCutting.csproj`, and `Back/src/ProEventos.Api/ProEventos.Api.csproj` with NetDevPack.Identity 8.0.0 `net10.0` dependency graph
- [x] T003 [P] Add role name constants (`User`, `Palestrante`) in `Back/src/ProEventos.Domain/Identity/AppRoles.cs` (or equivalent under Domain)
- [x] T004 [P] Replace/retire `Jwt` options with NetDevPack `AppJwtSettings` in `Back/src/ProEventos.Api/appsettings.json`, `Back/src/ProEventos.Api/.env.example`, and remove or stop binding obsolete `Back/src/ProEventos.Services/Options/JwtOptions.cs` from startup
- [x] T005 Update test host config in `Back/tests/ProEventos.Api.Tests/CustomWebApplicationFactory.cs` to supply `AppJwtSettings` (and drop obsolete `Jwt:*` keys)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire NetDevPack Identity/JWT on the existing `DataContext` and auth pipeline before any story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Replace manual `AddIdentityCore` + symmetric `AddJwtBearer` in `Back/src/ProEventos.CrossCutting/DependencyInjection/ConfigureService.cs` with NetDevPack `AddIdentityConfiguration` (ensure roles via `AddRoles<IdentityRole>()` if not included), EF stores on `DataContext`, and `AddJwtConfiguration(...).AddNetDevPackIdentity<User>()`
- [x] T007 Wire `UseAuthConfiguration()` in `Back/src/ProEventos.Api/Program.cs` in the correct pipeline order (with existing CORS / exception handling); keep `Map*Endpoints` after auth middleware
- [x] T008 Register authorization policy `RequireUserRole` (role `User` from `AppRoles`) in `Back/src/ProEventos.CrossCutting/DependencyInjection/ConfigureService.cs` or `Back/src/ProEventos.Api/Program.cs`
- [x] T009 Ensure `DataContext` remains the single Identity store (`Back/src/ProEventos.Persistence/DataContext.cs`); do not introduce `NetDevPackAppDbContext` unless restore forces it — document context name for any EF commands
- [x] T010 Remove obsolete `JwtOptions` binding/`ValidateOnStart` from `Back/src/ProEventos.Api/Program.cs` once NetDevPack config is live; confirm API builds with `dotnet build Back/src/ProEventos.Api/ProEventos.Api.csproj`

**Checkpoint**: Foundation ready — Identity/JWT via NetDevPack; policy registered; app builds

---

## Phase 3: User Story 1 - Authenticate and receive role-aware access (Priority: P1) 🎯 MVP

**Goal**: Login/register issue credentials that include roles via NetDevPack `IJwtBuilder`

**Independent Test**: Register or seed an organizer, login, confirm response `roles` includes `User` and JWT carries role claims; invalid credentials return 401 without token

### Implementation for User Story 1

- [x] T011 [US1] Extend `AuthResponseDto` with `Roles` (`string[]`) and optional `PalestranteId` in `Back/src/ProEventos.Services/Dtos/UserDto.cs`
- [x] T012 [US1] Refactor `AccountService` in `Back/src/ProEventos.Services/Services/AccountService.cs` to inject `IJwtBuilder` (and `UserManager` / `RoleManager` as needed); replace `GenerateJwtToken` with builder chain including `WithUserRoles()`; populate `AuthResponseDto.Roles` from user roles
- [x] T013 [US1] On organizer `RegisterAsync` in `Back/src/ProEventos.Services/Services/AccountService.cs`, assign role `AppRoles.User` after successful create (idempotent if already assigned)
- [x] T014 [US1] Keep `Back/src/ProEventos.Api/Endpoints/AccountEndpoints.cs` login/register/profile routes working with the new response shape; ensure claim lookup for profile still resolves user id after NetDevPack JWT claims
- [x] T015 [US1] Update `Back/src/ProEventos.Persistence/Seeds/IdentitySeeds.cs` so seeded `admin` receives role `User` (create role if missing)

**Checkpoint**: Organizer can login/register and receive role-aware token/response (MVP)

---

## Phase 4: User Story 2 - Palestrante linked to User identity (Priority: P1)

**Goal**: Every Palestrante has required `UserId` + `User` navigation; reject missing links

**Independent Test**: Create/seed Palestrante with UserId; load and verify link; create without UserId fails validation

### Implementation for User Story 2

- [x] T016 [P] [US2] Add required `UserId` (`string`) and `User` navigation to `Back/src/ProEventos.Domain/Entities/Palestrante.cs`
- [x] T017 [US2] Configure EF required FK + unique index on `UserId` in `Back/src/ProEventos.Persistence/DataContext.cs` (Fluent API)
- [x] T018 [US2] Extend `PalestranteDto` (and Mapster maps in `Back/src/ProEventos.Services/Mappings/MapsterConfig.cs` if needed) with `UserId` in `Back/src/ProEventos.Services/Dtos/PalestranteDto.cs`
- [x] T019 [US2] Enforce UserId presence and existing-User check in `Back/src/ProEventos.Services/Services/PalestranteService.cs` on create/update; return validation/not-found errors
- [x] T020 [US2] Handle existing SQLite data: Development reseed/migrate path so orphan Palestrantes get linked Users or are cleared — update seeds under `Back/src/ProEventos.Persistence/Seeds/` and startup seed block in `Back/src/ProEventos.Api/Program.cs` as needed

**Checkpoint**: Domain enforces User↔Palestrante ownership

---

## Phase 5: User Story 3 - User write vs Palestrante ReadOnly roles (Priority: P1)

**Goal**: Seed both roles; maintenance writes require `User`; Palestrante denied on create/update/delete

**Independent Test**: Login as Palestrante → POST `/eventos` → 401/403; login as User → same POST → 2xx; GET `/eventos` anonymous still 200

### Implementation for User Story 3

- [x] T021 [US3] Centralize role seed helper in `Back/src/ProEventos.Persistence/Seeds/IdentitySeeds.cs` ensuring roles `User` and `Palestrante` exist before user assignment; call from `Back/src/ProEventos.Api/Program.cs`
- [x] T022 [P] [US3] Apply `.RequireAuthorization("RequireUserRole")` (or Roles=`User`) on write endpoints in `Back/src/ProEventos.Api/Endpoints/EventoEndpoints.cs`
- [x] T023 [P] [US3] Apply `RequireUserRole` on write endpoints in `Back/src/ProEventos.Api/Endpoints/LoteEndpoints.cs`
- [x] T024 [P] [US3] Apply `RequireUserRole` on write endpoints in `Back/src/ProEventos.Api/Endpoints/PalestranteEndpoints.cs`
- [x] T025 [P] [US3] Apply `RequireUserRole` on write endpoints in `Back/src/ProEventos.Api/Endpoints/RedeSocialEndpoints.cs`
- [x] T026 [US3] Seed sample speaker account (`palestrante` / didactic password) with role `Palestrante` only + linked `Palestrante` row (`UserId`) in `Back/src/ProEventos.Persistence/Seeds/IdentitySeeds.cs` (and Program seed invocation)
- [x] T027 [US3] Leave GET routes anonymous and Account profile/password as `[Authorize]` without requiring `User` role in the Account/Eventos endpoint files already touched

**Checkpoint**: Role policy enforced on maintenance writes; ReadOnly palestrante deniable

---

## Phase 6: User Story 4 - Register/provision both account kinds (Priority: P2)

**Goal**: Organizer register keeps `User` role; new speaker register creates User + Palestrante + `Palestrante` role

**Independent Test**: `POST /account/register-palestrante` returns roles `["Palestrante"]` and `palestranteId`; duplicate email/username → 409

### Implementation for User Story 4

- [x] T028 [P] [US4] Add `UserRegisterPalestranteDto` (nome, userName, email, password, optional miniCurriculo/telefone/imagemURL) in `Back/src/ProEventos.Services/Dtos/UserDto.cs`
- [x] T029 [US4] Add `RegisterPalestranteAsync` to `Back/src/ProEventos.Services/Interfaces/IAccountService.cs` and implement in `Back/src/ProEventos.Services/Services/AccountService.cs` (create User → role `Palestrante` only → create Palestrante with UserId → build auth response with roles + palestranteId; mutual exclusivity — never assign `User` role here)
- [x] T030 [US4] Map `POST /account/register-palestrante` in `Back/src/ProEventos.Api/Endpoints/AccountEndpoints.cs` per `specs/007-netdevpack-identity-roles/contracts/openapi.yaml`
- [x] T031 [US4] Confirm organizer `RegisterAsync` never creates a Palestrante row and only assigns `User` role in `Back/src/ProEventos.Services/Services/AccountService.cs`

**Checkpoint**: Both account kinds provisionable via API

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification, test factory auth helpers, docs alignment

- [x] T032 [P] Extend `Back/tests/ProEventos.Api.Tests/AuthTestHelper.cs` (and related) to login as seeded User vs Palestrante and assert `roles` on auth response
- [x] T033 [P] Add/adjust tests in `Back/tests/ProEventos.Api.Tests/AccountEndpointsTests.cs` for register, register-palestrante, login roles, and conflict cases
- [x] T034 Add/adjust tests in `Back/tests/ProEventos.Api.Tests/ApiEndpointsTests.cs` (or dedicated file) asserting Palestrante token gets 403/401 on evento write and User token succeeds
- [x] T035 [P] Sync OpenAPI/Scalar notes if generated from code attributes; keep `specs/007-netdevpack-identity-roles/contracts/openapi.yaml` as source of truth for clients
- [x] T036 Run validation scenarios from `specs/007-netdevpack-identity-roles/quickstart.md` against local API; fix any gaps found
- [x] T037 [P] Remove dead JWT helper code / unused usings from `Back/src/ProEventos.Services/Services/AccountService.cs` and CrossCutting after NetDevPack migration

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: After Foundational — MVP auth with roles
- **US2 (Phase 4)**: After Foundational; ideally after or with US1 (needed before speaker seed in US3/US4)
- **US3 (Phase 5)**: After US1 (JWT roles) + US2 (UserId) for meaningful palestrante seed + write denial
- **US4 (Phase 6)**: After US2 + US3 role seed helpers
- **Polish (Phase 7)**: After desired stories complete

### User Story Dependencies

- **US1**: Foundational only — MVP
- **US2**: Foundational; independent domain change; pairs with US1 for speaker auth later
- **US3**: Depends on US1 token roles + US2 UserId for seed speaker; policies can land once policy exists (T008)
- **US4**: Depends on US2 domain + US3 role names/seeds

### Within Each User Story

- Domain/DTO before services
- Services before endpoints
- Seeds after roles/domain ready
- Story complete before next priority when sequential

### Parallel Opportunities

- T003/T004 in Setup; T022–T025 endpoint policy updates in US3; T028 DTO vs earlier work; T032/T033/T035/T037 in Polish
- After Foundational, US1 and US2 can proceed in parallel if staffed (different primary files)

---

## Parallel Example: User Story 3

```bash
# After T021 role seed helper exists, apply policies on endpoint files in parallel:
Task: "Apply RequireUserRole on EventoEndpoints.cs"
Task: "Apply RequireUserRole on LoteEndpoints.cs"
Task: "Apply RequireUserRole on PalestranteEndpoints.cs"
Task: "Apply RequireUserRole on RedeSocialEndpoints.cs"
```

## Parallel Example: User Story 1 + 2 (after Foundational)

```bash
Task: "Extend AuthResponseDto + AccountService IJwtBuilder (US1)"
Task: "Add Palestrante.UserId + DataContext FK (US2)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational  
3. Complete Phase 3: US1 (role-aware login/register via NetDevPack)  
4. **STOP and VALIDATE**: Login as admin → `roles` contains `User`  
5. Continue US2 → US3 → US4 for full acceptance

### Incremental Delivery

1. Setup + Foundational → NetDevPack wired  
2. US1 → Role-aware organizer auth (MVP)  
3. US2 → Palestrante.UserId enforced  
4. US3 → Write policy + ReadOnly palestrante seed  
5. US4 → `register-palestrante`  
6. Polish → quickstart + API tests  

### Parallel Team Strategy

1. Team completes Setup + Foundational together  
2. Dev A: US1 · Dev B: US2  
3. Then US3 (needs both) → US4 → Polish  

---

## Notes

- [P] = different files, no incomplete-task dependencies  
- Frontends deferred — no `Front/` tasks  
- Do not invent Contatos or premium UI work  
- Prefer extending existing layers over new projects  
- Commit after each task or logical group  
- Format validation: all tasks use `- [ ]`, Task ID, optional `[P]`/`[Story]`, and file paths
