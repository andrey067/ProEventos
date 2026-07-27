# Tasks: 80% Coverage Gate

**Input**: Design documents from `/specs/002-coverage-gate/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required — this feature’s value is Coverlet/Vitest gates plus real unit/integration tests that raise coverage to ≥80%.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `Back/src/ProEventos.*/`, `Back/tests/ProEventos.*.Tests/`
- **Vue**: `Front/Front-Vue/`
- **React**: `Front/Front-React/`
- **Angular**: `Front/Front-Angular/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold tooling and harnesses without yet asserting the 80% pass

- [X] T001 Remove unused stub project `Back/src/ProEventos.Application/` (`Class1.cs` + csproj) so it never enters a coverage denominator
- [X] T002 Create `Back/coverlet.runsettings` with Cobertura format, Threshold=80, ThresholdType=line,branch,method, ThresholdStat=total, and ExcludeByFile for `**/Migrations/**` and `**/*.Designer.cs`
- [X] T003 Add `coverlet.collector` (and MSBuild threshold props if collector fail is soft) to `Back/tests/ProEventos.Services.Tests/ProEventos.Services.Tests.csproj` with Include=`[ProEventos.Services]*`
- [X] T004 Create `Back/tests/ProEventos.Persistence.Tests/ProEventos.Persistence.Tests.csproj` (xUnit, Moq optional, EF InMemory, coverlet.collector) referencing Persistence + Domain with Include=`[ProEventos.Persistence]*` + `[ProEventos.Domain]*`
- [X] T005 Create `Back/tests/ProEventos.Api.Tests/ProEventos.Api.Tests.csproj` (xUnit, Microsoft.AspNetCore.Mvc.Testing, coverlet.collector) referencing Api + CrossCutting with Include=`[ProEventos.Api]*` + `[ProEventos.CrossCutting]*`
- [X] T006 Register `ProEventos.Persistence.Tests` and `ProEventos.Api.Tests` in `Back/src/ProEventos.sln`
- [X] T007 [P] Add `@vitest/coverage-v8` and `"test:coverage": "vitest run --coverage"` to `Front/Front-Vue/package.json`
- [X] T008 [P] Add `@vitest/coverage-v8` and `"test:coverage": "vitest run --coverage"` to `Front/Front-React/package.json`
- [X] T009 [P] Add `@vitest/coverage-v8` and `"test:coverage": "vitest run --coverage"` to `Front/Front-Angular/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire native 80% thresholds so coverage commands can fail; shared config for all stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 Configure Vitest `coverage` block (provider v8, include `src/**/*.{ts,vue}`, approved excludes, thresholds 80 for lines/functions/branches/statements) in `Front/Front-Vue/vite.config.ts`
- [X] T011 [P] Configure Vitest `coverage` block (provider v8, include `src/**/*.{ts,tsx}`, approved excludes, thresholds 80) in `Front/Front-React/vite.config.ts`
- [X] T012 [P] Configure Vitest `coverage` block (provider v8, include `src/**/*.{ts}`, approved excludes, thresholds 80) in `Front/Front-Angular/vitest.config.ts`
- [X] T013 Verify root `.gitignore` keeps `**/coverage/` and that Vue/React coverage output is ignored; keep `Front/Front-Angular/.gitignore` `/coverage` entry
- [X] T014 Confirm `dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings` runs all three test projects (may fail thresholds — expected until US2)
- [X] T015 Confirm `pnpm test:coverage` resolves in each of `Front/Front-Vue`, `Front/Front-React`, `Front/Front-Angular` after `pnpm install` (may fail thresholds — expected until US2)

Do **not** add `.github/workflows` coverage jobs — CI gates are out of scope.

**Checkpoint**: Gate tooling installed; commands runnable; thresholds armed

---

## Phase 3: User Story 1 - Local coverage gate fails below threshold (Priority: P1) 🎯 MVP

**Goal**: Documented local coverage commands exit non-zero when any required dimension is below 80%

**Independent Test**: With current thin suites (or after deliberately lowering coverage), run backend + one frontend coverage command and observe non-zero exit reporting threshold failure; restoring a passing unit later is US2

### Implementation for User Story 1

- [X] T016 [US1] Prove backend gate fails below 80% by running `dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings` and capturing non-zero exit / threshold message (adjust Coverlet MSBuild props in test csprojs if collector does not fail the process)
- [X] T017 [P] [US1] Prove Front-Vue gate fails below 80% via `pnpm test:coverage` in `Front/Front-Vue` (non-zero exit)
- [X] T018 [P] [US1] Prove Front-React gate fails below 80% via `pnpm test:coverage` in `Front/Front-React` (non-zero exit)
- [X] T019 [P] [US1] Prove Front-Angular gate fails below 80% via `pnpm test:coverage` in `Front/Front-Angular` (non-zero exit)
- [X] T020 [US1] Document the failing coverage commands and fail-on-threshold behavior in `Back/README.md` per `specs/002-coverage-gate/contracts/local-coverage-gate.md`
- [X] T021 [P] [US1] Document `pnpm test:coverage` fail-on-threshold in `Front/Front-Vue/README.md`, `Front/Front-React/README.md`, and `Front/Front-Angular/README.md`
- [X] T022 [US1] Add root README pointer to backend/front coverage commands in `README.md`

**Checkpoint**: US1 MVP — contributors see local gates fail honestly before suites catch up

---

## Phase 4: User Story 2 - Per-layer and per-app 80% with real tests (Priority: P1)

**Goal**: Each backend Coverage Unit and each frontend app reaches ≥80% via real behavioral tests (not exclusion gaming)

**Independent Test**: `dotnet test` with Coverlet settings exits 0 with Services, Persistence+Domain, and Api+CrossCutting each ≥80%; each front `pnpm test:coverage` exits 0 with all four Vitest dimensions ≥80%

### Tests & coverage fill for User Story 2

- [X] T023 [US2] Expand service unit tests for all public methods and used Mapster paths in `Back/tests/ProEventos.Services.Tests/EventoServiceTests.cs`, `LotesServiceTests.cs`, `PalestranteServiceTests.cs`, and `RedeSocialServiceTests.cs` until `[ProEventos.Services]*` ≥80% line/branch/method
- [X] T024 [P] [US2] Add InMemory EF tests for `BaseRepository` and `DataContext` in `Back/tests/ProEventos.Persistence.Tests/` (e.g. `BaseRepositoryTests.cs`, `DataContextTests.cs`)
- [X] T025 [P] [US2] Add InMemory EF tests for `EventoRepository`, `PalestrantesRepository`, and `LostesRepostory` (actual filename) in `Back/tests/ProEventos.Persistence.Tests/` covering Domain entities via CRUD until Persistence+Domain ≥80%
- [X] T026 [US2] Add `WebApplicationFactory` fixture and smoke CRUD HTTP tests for Evento/Lote/Palestrante/RedeSocial endpoint groups in `Back/tests/ProEventos.Api.Tests/` so `ProEventos.Api` + `ProEventos.CrossCutting` (including `ConfigureService.cs` / `ConfigureRepository.cs`) reach ≥80%
- [X] T027 [US2] Re-run `dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings` until exit 0 for all three Include scopes
- [X] T028 [P] [US2] Expand Vue HTTP client tests with mocks for `Front/Front-Vue/src/services/eventoService.ts`, `loteService.ts`, `palestranteService.ts`, `redeSocialService.ts`, and `HttpClient.ts` (extend `eventoService.spec.ts` + new sibling `*.spec.ts`)
- [X] T029 [P] [US2] Add/expand Vue UI specs for list/form/detail/palestrantes, login/registro shell, menu/nav, App/router in `Front/Front-Vue/src/` (components, pages, `App.vue`, `router/`) until `pnpm test:coverage` ≥80%
- [X] T030 [P] [US2] Expand React HTTP client tests with mocks for `Front/Front-React/src/services/eventoService.ts`, `loteService.ts`, `palestranteService.ts`, `redeSocialService.ts`, and `http.ts`
- [X] T031 [P] [US2] Add/expand React UI tests for pages/components, login/registro shell, `Nav`, `App.tsx` / router wiring under `Front/Front-React/src/` until `pnpm test:coverage` ≥80%
- [X] T032 [P] [US2] Expand Angular HTTP service tests with `HttpClientTestingModule` for services under `Front/Front-Angular/src/app/services/`
- [X] T033 [P] [US2] Add/expand Angular component/page/router/App specs under `Front/Front-Angular/src/app/` (including login/registro shell) until `pnpm test:coverage` ≥80%
- [X] T034 [US2] Verify models/utils/constants/env are covered by exercise in existing specs or add light asserts under each front’s `src/` as needed to clear remaining gaps without expanding excludes

**Checkpoint**: US2 — all six Coverage Units pass native 80% gates with real tests

---

## Phase 5: User Story 3 - Honest denominator via minimal exclusions (Priority: P2)

**Goal**: Only approved exclusions remain; Program/pages/Persistence/DI/routers stay in the denominator

**Independent Test**: Inspect `Back/coverlet.runsettings` and each Vitest coverage config; confirm no forbidden excludes; spot-check reports still include Persistence, DI, routers, pages

### Implementation for User Story 3

- [X] T035 [US3] Audit and lock Coverlet Exclude/ExcludeByFile in `Back/coverlet.runsettings` and per-test csproj Coverlet props to approved set only (Migrations, `*.Designer.cs`); ensure Persistence/DI/Api entrypoints are not excluded
- [X] T036 [P] [US3] Audit Vitest `coverage.exclude` in `Front/Front-Vue/vite.config.ts`, `Front/Front-React/vite.config.ts`, and `Front/Front-Angular/vitest.config.ts` to only `*.d.ts`, CSS, and test-setup paths — not pages, routers, or bootstrap
- [X] T037 [US3] Document the non-negotiable exclusion list (and forbidden excludes) in `Back/README.md` and one short note in each Front README coverage section
- [X] T038 [US3] Re-run backend + three front coverage commands after audit to confirm still ≥80% without new excludes

**Checkpoint**: US3 — honest denominators preserved

---

## Phase 6: User Story 4 - Governance docs no longer forbid %-gates (Priority: P2)

**Goal**: `001-multi-front-eventos` Speckit artifacts align with the local 80% gate; no absolute %-gate ban remains

**Independent Test**: Search `specs/001-multi-front-eventos/` for residual absolute bans; wording points to `002-coverage-gate`

### Implementation for User Story 4

- [X] T039 [US4] Amend `specs/001-multi-front-eventos/spec.md`: remove “Hard coverage %-gates or mutation testing” from out-of-scope (keep mutation testing out if desired); add FR/NFR that local 80% coverage gates are required per `specs/002-coverage-gate/`
- [X] T040 [P] [US4] Amend `specs/001-multi-front-eventos/plan.md` Testing / Scale / Didactic notes to document Coverlet + Vitest thresholds and local fail (no coverage theater)
- [X] T041 [P] [US4] Amend `specs/001-multi-front-eventos/research.md` §13 to replace “didactic, not coverage %” with the adopted 80% local gate + commands, linking to `002-coverage-gate`
- [X] T042 [US4] Grep `specs/001-multi-front-eventos/` for leftover absolute %-gate prohibitions and fix any stragglers

**Checkpoint**: US4 — Speckit guidance consistent

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and hygiene across stories

- [X] T043 [P] Align root `README.md` testing section with `specs/002-coverage-gate/contracts/local-coverage-gate.md` and `quickstart.md`
- [X] T044 Run full validation from `specs/002-coverage-gate/quickstart.md` §§1, 3, 5 (pass paths) and record that §§2/4 fail-signal were demonstrated once during US1/US2
- [X] T045 Confirm no coverage CI workflow was added under `.github/workflows/`
- [X] T046 Final solution build: `dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings` exit 0 and all three `pnpm test:coverage` exit 0

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP (prove fail)
- **US2 (Phase 4)**: Depends on Foundational; practically follows US1 so fail→pass is visible; backend Services fill (T023) before solution-wide pass (T027); Persistence/Api tests can parallel after T004–T006
- **US3 (Phase 5)**: Depends on US2 passing so audit does not “fix” coverage with new excludes
- **US4 (Phase 6)**: Can start after Foundational (docs-only); ideally after US1 so documented policy matches observed gate
- **Polish (Phase 7)**: Depends on US1–US4 complete

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — no dependency on US2–US4
- **User Story 2 (P1)**: After Foundational — uses same gate as US1; delivers pass side of the gate
- **User Story 3 (P2)**: After US2 (verify denominator without undoing pass)
- **User Story 4 (P2)**: Docs — independent of code after Foundational; coordinate with US1 wording

### Parallel Opportunities

- T007–T009 (front package.json) in parallel
- T010–T012 (vitest configs) in parallel after package scripts
- T017–T019 (prove front fail) in parallel
- T024–T025 (Persistence tests) in parallel; T028–T033 (three fronts) in parallel after Foundational
- T040–T041 (001 plan/research) in parallel with T039

---

## Parallel Example: User Story 2 (frontends)

```bash
# After Foundational + backend Services path underway, three fronts in parallel:
Task: "Expand Vue HTTP + UI specs under Front/Front-Vue/src/ until pnpm test:coverage ≥80%"
Task: "Expand React HTTP + UI tests under Front/Front-React/src/ until pnpm test:coverage ≥80%"
Task: "Expand Angular service + component specs under Front/Front-Angular/src/app/ until pnpm test:coverage ≥80%"
```

## Parallel Example: User Story 1 (fail proof)

```bash
Task: "Prove Front-Vue pnpm test:coverage fails below 80% in Front/Front-Vue"
Task: "Prove Front-React pnpm test:coverage fails below 80% in Front/Front-React"
Task: "Prove Front-Angular pnpm test:coverage fails below 80% in Front/Front-Angular"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (gates fail + docs)
4. **STOP and VALIDATE**: Coverage commands fail locally with clear threshold errors

### Incremental Delivery

1. Setup + Foundational → tooling armed
2. US1 → fail-visible MVP
3. US2 → all units ≥80% pass
4. US3 → exclusion audit locked
5. US4 → 001 Speckit amendments
6. Polish → quickstart green, no CI

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then:
   - Dev A: US1 fail proofs + README commands
   - Dev B: Backend US2 (Services → Persistence → Api)
   - Dev C: Frontend US2 (Vue/React/Angular in parallel if capacity)
3. US3 audit after US2 green; US4 docs anytime after Foundational

---

## Notes

- [P] tasks = different files, no dependencies on incomplete sibling work
- Persistence file on disk is `LostesRepostory.cs` — do not invent a rename in this feature unless separately requested
- Prefer real behavioral tests over trivial asserts; do not expand excludes to pass
- Commit after each task or logical group
- Stop at checkpoints to validate story independently
