# Tasks: Test Strategy

**Input**: Design documents from `/specs/016-test-strategy/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: This feature *is* the test strategy—expanding real tests to clear 90%, wiring CI, and adding thin E2E are first-class delivery work (explicitly required by the spec).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `Back/src/ProEventos.*/`, `Back/tests/ProEventos.*.Tests/`, `Back/coverlet.runsettings`
- **Frontends**: `Front/Front-Vue/`, `Front/Front-React/`, `Front/Front-Angular/`
- **Quality/CI**: `quality/`, `.github/workflows/`, `e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create quality/E2E scaffolding directories and mark supersession of `002-coverage-gate`

- [x] T001 Create `quality/` directory and stub `quality/coverage-baselines.json` with Coverage Unit ids (`services`, `persistence-domain`, `api-crosscutting`, `front-vue`, `front-react`, `front-angular`) and placeholder dimension floors at `0` in `quality/coverage-baselines.json`
- [x] T002 [P] Create `e2e/` directory with placeholder `e2e/package.json` and `e2e/README.md` describing Playwright critical-journey intent per `specs/016-test-strategy/contracts/test-pyramid-policy.md`
- [x] T003 [P] Create `.github/workflows/` directory (empty placeholder note in `docs/testing.md` draft path) so CI paths from the plan exist before workflow files land
- [x] T004 [P] Add a short supersession note at the top of `specs/002-coverage-gate/spec.md` (or restore from git if missing) pointing readers to `specs/016-test-strategy/` as the authoritative 90% + CI strategy

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Align gate config to 90%, strip non-approved exclusions, and document local commands—MUST complete before story work that depends on honest denominators

**⚠️ CRITICAL**: No user story work that assumes the 90% gate can begin until this phase is complete

- [x] T005 Set `<Threshold>90</Threshold>` and `<ThresholdType>line,branch,method</ThresholdType>` in `Back/coverlet.runsettings`; keep ExcludeByFile limited to `**/Migrations/**/*.cs,**/*.Designer.cs` only
- [x] T006 [P] Set `Threshold` to `90` and `ThresholdType` to `line,branch,method` in `Back/tests/ProEventos.Services.Tests/ProEventos.Services.Tests.csproj`; remove non-approved `ExcludeByFile` entries (`AccountService.cs`, `IAccountService.cs`, `UserDto.cs`, etc.)
- [x] T007 [P] Set `Threshold` to `90` and `ThresholdType` to `line,branch,method` in `Back/tests/ProEventos.Persistence.Tests/ProEventos.Persistence.Tests.csproj`; remove non-approved excludes (e.g. `User.cs`) leaving only Migrations/`*.Designer.cs`
- [x] T008 [P] Set `Threshold` to `90` and `ThresholdType` to `line,branch,method` in `Back/tests/ProEventos.Api.Tests/ProEventos.Api.Tests.csproj`; remove non-approved excludes (`Program.cs`, `ConfigureService.cs`, `AccountEndpoints.cs`, `AppExceptionHandler.cs`, etc.)
- [x] T009 [P] Raise Vitest `coverage.thresholds` to `90` for lines/functions/branches/statements in `Front/Front-Vue/vite.config.ts`
- [x] T010 [P] Raise Vitest `coverage.thresholds` to `90` for lines/functions/branches/statements in `Front/Front-React/vite.config.ts`
- [x] T011 [P] Raise Vitest `coverage.thresholds` to `90` for lines/functions/branches/statements in `Front/Front-Angular/vitest.config.ts`
- [x] T012 Update local gate docs from 80% → 90% and point to `specs/016-test-strategy/` in `Back/README.md` and root `README.md`
- [x] T013 [P] Update coverage docs from 80% → 90% in `Front/Front-Vue/README.md`, `Front/Front-React/README.md`, and `Front/Front-Angular/README.md`

**Checkpoint**: Config and docs describe 90% with approved excludes only; suites may still fail until US1 fills coverage gaps

---

## Phase 3: User Story 1 - Per-project coverage gate at 90% (Priority: P1) 🎯 MVP

**Goal**: Every Coverage Unit independently meets ≥90% on required dimensions via real tests; local commands fail below 90%

**Independent Test**: Run `dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings` and each `pnpm test:coverage`; all exit 0. Sabotage one unit → only that unit’s command fails.

### Tests for User Story 1 (required — feature is coverage via real tests)

- [x] T014 [P] [US1] Expand unit tests for Account/User flows in `Back/tests/ProEventos.Services.Tests/` (cover `AccountService` and related DTOs previously excluded) until Services Include clears 90%
- [x] T015 [P] [US1] Expand Persistence/Domain tests in `Back/tests/ProEventos.Persistence.Tests/` (including `User` entity paths previously excluded) until Persistence+Domain Include clears 90%
- [x] T016 [P] [US1] Expand Api/CrossCutting tests in `Back/tests/ProEventos.Api.Tests/` (Program/DI/`AccountEndpoints`/`AppExceptionHandler`/`ConfigureService` previously excluded) until Api+CrossCutting Include clears 90%
- [x] T017 [P] [US1] Expand Vitest specs under `Front/Front-Vue/src/**/*.spec.ts` (and related) until `pnpm test:coverage` passes at 90%
- [x] T018 [P] [US1] Expand Vitest specs under `Front/Front-React/src/**/*.test.tsx` (and related) until `pnpm test:coverage` passes at 90%
- [x] T019 [P] [US1] Expand Vitest specs under `Front/Front-Angular/src/**/*.spec.ts` (and related) until `pnpm test:coverage` passes at 90%

### Implementation for User Story 1

- [x] T020 [US1] Run full backend coverage command and fix remaining gaps in `Back/tests/ProEventos.*.Tests/` until exit 0 at Threshold 90
- [x] T021 [US1] Run all three frontend `pnpm test:coverage` commands and fix remaining gaps until each exits 0 at thresholds 90
- [x] T022 [US1] Verify non-aggregated behavior: document in `specs/016-test-strategy/quickstart.md` that failing one unit does not affect siblings (spot-check once, then revert)

**Checkpoint**: Local 90% gates pass per unit; US1 MVP complete

---

## Phase 4: User Story 2 - CI blocks merges below 90% (Priority: P1)

**Goal**: GitHub Actions on PR + `main` runs tests/coverage per unit, fails below 90%, and enforces the coverage ratchet

**Independent Test**: Workflow files exist and invoke the same local gate commands; compare script fails when a unit is below baseline or below 90%; PR simulation shows red when coverage drops

### Implementation for User Story 2

- [x] T023 [US2] Implement `quality/compare-coverage.mjs` to read Cobertura/Vitest summaries, compare against `quality/coverage-baselines.json`, and exit non-zero if any unit is &lt; baseline or &lt; 90 (per `specs/016-test-strategy/contracts/coverage-gate-ci.md`)
- [x] T024 [US2] After a green local US1 run, populate real dimension percentages into `quality/coverage-baselines.json` for all six Coverage Units
- [x] T025 [US2] Create `.github/workflows/ci.yml` with `pull_request` and `push` to `main` triggers; jobs for backend Coverlet gate and Front-Vue/React/Angular `pnpm test:coverage`; upload coverage artifacts
- [x] T026 [US2] Add baseline-compare job in `.github/workflows/ci.yml` that downloads artifacts and runs `node quality/compare-coverage.mjs`
- [x] T027 [US2] Document CI triggers, jobs, and failure meaning in `docs/testing.md` (create file) and link from root `README.md`

**Checkpoint**: CI contract for absolute 90% + ratchet is implemented; merge blocked when any project fails

---

## Phase 5: User Story 3 - Features/bugs require tests; maintain coverage (Priority: P1)

**Goal**: Governance and contributor process make “done” mean tested; bug fixes need regression tests; PRs must not lower coverage

**Independent Test**: Constitution no longer says tests are optional; `docs/testing.md` / CONTRIBUTING state feature/bug rules; PR template (if added) checklists exist; ratchet already fails coverage drops (US2)

### Implementation for User Story 3

- [x] T028 [US3] Amend `.specify/memory/constitution.md` Architecture Constraints **Testing** to mandate the 90% per-unit strategy + pyramid guidance (MINOR bump `2.0.0` → `2.1.0`, update Sync Impact Report + Last Amended `2026-07-29`)
- [x] T029 [P] [US3] Document feature-completion and bug-regression rules in `docs/testing.md` (align with `specs/016-test-strategy/contracts/test-pyramid-policy.md` §§4–5)
- [x] T030 [P] [US3] Add or update `CONTRIBUTING.md` with a short “Definition of Done” pointing at `docs/testing.md` and the coverage gate commands
- [x] T031 [P] [US3] Add `.github/PULL_REQUEST_TEMPLATE.md` checkboxes: tests for new/changed behavior; regression test for bug fixes; coverage not decreased
- [x] T032 [US3] Propagate Testing guidance note into `.specify/templates/plan-template.md` and `.specify/templates/tasks-template.md` if they still imply tests are always optional without feature request (constitution sync)

**Checkpoint**: Process rules are the project source of truth; reviewers can reject incomplete work without relying only on % gates

---

## Phase 6: User Story 4 - Test pyramid with thin E2E (Priority: P2)

**Goal**: Suite shape follows ~70/20/10 guidance; Playwright covers only critical journeys on all three frontends

**Independent Test**: Inventory shows majority unit, smaller integration (Persistence/Api tests), thin E2E; Playwright runs auth + Eventos + Palestrantes journeys per `contracts/test-pyramid-policy.md`

### Tests for User Story 4

- [x] T033 [P] [US4] Add Playwright config and projects for Vue/React/Angular base URLs in `e2e/playwright.config.ts`
- [x] T034 [P] [US4] Implement critical journey `auth-login` in `e2e/tests/auth-login.spec.ts` (skip gracefully only if auth UI absent—prefer real login against running API)
- [x] T035 [P] [US4] Implement critical journey `eventos-list-create` in `e2e/tests/eventos-list-create.spec.ts`
- [x] T036 [P] [US4] Implement critical journey `palestrantes-list-create` in `e2e/tests/palestrantes-list-create.spec.ts`

### Implementation for User Story 4

- [x] T037 [US4] Finalize `e2e/package.json` scripts (`test`, `test:ui`) and install Playwright browsers; document ports/API prerequisites in `e2e/README.md`
- [x] T038 [US4] Create `.github/workflows/e2e.yml` for PR + `main` that starts API + frontends (or matrix) and runs `e2e` Playwright tests
- [x] T039 [US4] Add pyramid band mapping (unit/integration/E2E harness table) to `docs/testing.md` without making ratio a CI fail
- [x] T040 [US4] Spot-check suite inventory and note pyramid shape in `specs/016-test-strategy/checklists/` or `docs/testing.md` (SC-007)

**Checkpoint**: Thin E2E exists; pyramid is documented and recognizable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Align docs, validate quickstart, ensure supersession is clear

- [x] T041 [P] Align root `README.md`, `Back/README.md`, and Front READMEs so all cite 90%, CI, and `specs/016-test-strategy/` (no leftover “local 80% only / no CI” claims)
- [x] T042 [P] Ensure `specs/016-test-strategy/contracts/coverage-gate-ci.md` matches implemented commands and workflow names
- [x] T043 Run full validation from `specs/016-test-strategy/quickstart.md` (§§1–8) and fix any drift
- [x] T044 [P] Update `.cursor/rules/specify-rules.mdc` Speckit plan pointer if needed (should remain `specs/016-test-strategy/plan.md`)
- [x] T045 Commit-ready sweep: confirm no new non-approved Coverlet/Vitest excludes were reintroduced in `Back/coverlet.runsettings` and `Back/tests/**/*.csproj`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories that assume honest 90% gates
- **User Story 1 (Phase 3)**: Depends on Foundational — MVP
- **User Story 2 (Phase 4)**: Depends on US1 green local gates (baselines need real numbers); CI can be drafted earlier but must not merge red
- **User Story 3 (Phase 5)**: Can start after Foundational in parallel with US1/US2 for docs/constitution; PR template ideally after US2 ratchet exists
- **User Story 4 (Phase 6)**: Can start after Foundational; E2E CI should not block US1 MVP; prefer after API/frontends are stable under 90%
- **Polish (Phase 7)**: After desired stories complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on US2–US4
- **US2 (P1)**: Needs US1 passing locally to seed baselines; otherwise independently testable once fixtures exist
- **US3 (P1)**: Mostly docs/governance — parallelizable with US1/US2
- **US4 (P2)**: Independent E2E band; uses running API + frontends

### Within Each User Story

- Raise/clean config before claiming pass
- Expand real tests before relaxing excludes
- CI after local green (US2)
- E2E journeys after Playwright scaffold

### Parallel Opportunities

- T006–T011 (threshold/exclude edits across projects/apps)
- T014–T019 (fill coverage gaps per harness)
- T029–T031 (docs/PR template)
- T033–T036 (Playwright specs per journey)

---

## Parallel Example: User Story 1

```bash
# Fill coverage gaps in parallel (different harness trees):
Task: "Expand Services.Tests for Account/User in Back/tests/ProEventos.Services.Tests/"
Task: "Expand Persistence.Tests including User in Back/tests/ProEventos.Persistence.Tests/"
Task: "Expand Api.Tests for Program/DI/Account in Back/tests/ProEventos.Api.Tests/"
Task: "Expand Front-Vue Vitest specs until test:coverage ≥ 90"
Task: "Expand Front-React Vitest specs until test:coverage ≥ 90"
Task: "Expand Front-Angular Vitest specs until test:coverage ≥ 90"
```

---

## Parallel Example: User Story 4

```bash
# Journey specs in parallel after playwright.config.ts exists:
Task: "auth-login.spec.ts in e2e/tests/"
Task: "eventos-list-create.spec.ts in e2e/tests/"
Task: "palestrantes-list-create.spec.ts in e2e/tests/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (90% config + honest excludes)
3. Complete Phase 3: US1 — real tests until all local gates pass
4. **STOP and VALIDATE**: quickstart §§1–4
5. Demo: local commands fail below 90% and pass at ≥90%

### Incremental Delivery

1. Setup + Foundational → gates configured
2. US1 → local 90% MVP
3. US2 → CI + ratchet blocks merges
4. US3 → constitution + DoD / PR template
5. US4 → thin Playwright pyramid capstone
6. Polish → quickstart green

### Parallel Team Strategy

1. Team finishes Setup + Foundational together
2. Then:
   - Dev A: Backend coverage gaps (T014–T016, T020)
   - Dev B: Frontend coverage gaps (T017–T019, T021)
   - Dev C: US3 governance docs (T028–T032)
3. After US1 green: Dev A/B wire US2 CI; Dev C starts US4 Playwright

---

## Notes

- [P] tasks = different files, no dependencies on incomplete sibling tasks
- [Story] labels map to US1–US4 from `spec.md`
- Do **not** restore broad ExcludeByFile entries to “pass” 90%
- `002-coverage-gate` remains historical; do not reintroduce 80% or “no CI”
- Commit after each task or logical group
- Stop at checkpoints to validate independently
