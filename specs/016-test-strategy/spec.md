# Feature Specification: Test Strategy

**Feature Branch**: `016-test-strategy`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "Estratégia de Testes — cobertura mínima 90% por projeto (não agregada); backend ≥ 90% em linhas, branches, funções e statements quando suportado; pirâmide 70% unitários / 20% integração / 10% E2E; nenhuma funcionalidade concluída sem testes; bugs exigem teste de regressão; PRs devem manter ou aumentar cobertura; CI falha abaixo de 90% e executa testes em toda PR e na branch principal."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Per-project coverage gate at 90% (Priority: P1)

As a contributor, I run the documented coverage check for any single project (a backend project, a frontend app, or a shared library/service). If that project’s measured coverage for any required dimension is below 90%, the check fails so I know the work is not done. Coverage is never judged by averaging multiple projects together.

**Why this priority**: The 90% floor is the non-negotiable quality bar; without per-project enforcement, weak areas hide behind stronger ones.

**Independent Test**: Drop coverage below 90% in one project only; run that project’s coverage check and observe failure. Restore coverage and observe success. Confirm another project that remains above 90% is unaffected.

**Acceptance Scenarios**:

1. **Given** a backend project whose coverage for any required dimension is below 90%, **When** its coverage check runs, **Then** the check fails and identifies which threshold(s) failed.
2. **Given** a frontend app whose coverage for any required dimension is below 90%, **When** its coverage check runs, **Then** the check fails and identifies which threshold(s) failed.
3. **Given** a shared library or service whose coverage for any required dimension is below 90%, **When** its coverage check runs, **Then** the check fails independently of other projects.
4. **Given** every in-scope project at or above 90% on all required dimensions, **When** coverage checks run, **Then** each project’s check succeeds.
5. **Given** one strong project and one weak project, **When** coverage is evaluated, **Then** the weak project still fails—success of others does not raise an aggregate score that hides the gap.

---

### User Story 2 - Continuous integration blocks merges below 90% (Priority: P1)

As a maintainer, every pull request and every change on the main branch runs the automated test and coverage suite. If any project falls below 90%, the pipeline fails and the change cannot be treated as merge-ready.

**Why this priority**: Local discipline alone drifts; CI is what makes the 90% rule durable across contributors.

**Independent Test**: Open or simulate a PR where one project’s coverage is below 90%; observe the pipeline fail. Raise that project above 90% and observe the coverage gate pass (other checks may still apply).

**Acceptance Scenarios**:

1. **Given** a pull request that lowers any project below 90% coverage, **When** CI runs, **Then** the pipeline fails because of coverage.
2. **Given** a pull request that keeps every project at or above 90% and does not reduce coverage relative to the base branch, **When** CI runs, **Then** the coverage gate passes.
3. **Given** a change pushed to the main branch, **When** CI runs, **Then** the same automated tests and per-project coverage checks execute.
4. **Given** a pull request whose tests pass but coverage for a project is below 90%, **When** CI finishes, **Then** the pipeline still fails.

---

### User Story 3 - Work is incomplete without tests; bugs get regression tests (Priority: P1)

As a reviewer, I reject “done” features that ship without tests, and I require every bug fix to include a test that would have caught the defect. Pull requests must maintain or increase existing coverage—not trade quality for speed.

**Why this priority**: Coverage thresholds alone do not force meaningful tests on new behavior or regressions; process rules close that gap.

**Independent Test**: Review a feature change with no new/updated tests and a bug-fix change without a regression test; confirm both fail the acceptance bar defined here. Review a PR that only removes tests and drops coverage; confirm it is not acceptable.

**Acceptance Scenarios**:

1. **Given** a new or changed user-facing or API behavior, **When** the change is proposed as complete, **Then** it includes tests that exercise the new or changed behavior.
2. **Given** a bug fix, **When** the fix is proposed, **Then** it includes a test that fails without the fix and passes with it.
3. **Given** a pull request that decreases measured coverage for any project relative to the comparison base, **When** coverage is compared, **Then** the change is not acceptable unless coverage remains ≥ 90% *and* an explicit, documented exception is approved—default rule: maintain or increase coverage.
4. **Given** a pull request that only deletes or weakens tests without replacing equivalent coverage, **When** reviewed against this strategy, **Then** it is rejected.

---

### User Story 4 - Test effort follows the test pyramid (Priority: P2)

As a team, we invest most effort in fast, isolated unit tests, a smaller share in integration tests against real collaborations (data store, HTTP API, queues, cache, services), and a thin layer of end-to-end tests for critical business journeys only—roughly 70% / 20% / 10% of the suite by count or effort intent.

**Why this priority**: The pyramid keeps feedback fast and cost low while still protecting critical paths; it guides *how* we reach 90%, not a second hard percentage gate in CI.

**Independent Test**: Inventory the suite for a mature area and confirm the majority are unit-level, a minority are integration, and E2E covers only named critical flows—not a mirror of every screen.

**Acceptance Scenarios**:

1. **Given** new automated tests for domain or presentation logic, **When** authors choose a level, **Then** they default to isolated unit tests unless the risk requires a higher level.
2. **Given** behavior that depends on collaboration between components or external resources, **When** that risk is material, **Then** integration tests verify the real integration path.
3. **Given** critical business journeys (for example sign-in, create/list core domain entities), **When** E2E coverage is planned, **Then** only those critical journeys are automated end-to-end—not exhaustive UI mirroring.
4. **Given** the recommended 70/20/10 distribution, **When** the suite is reviewed over time, **Then** a large majority of tests remain unit-level; the ratio is a guiding target, not a CI fail condition of its own.

---

### Edge Cases

- What if a tool does not report every metric (lines, branches, functions/methods, statements)? Only dimensions the tool exposes are required; every exposed required dimension MUST still be ≥ 90%. Backend MUST meet 90% on all of those dimensions the backend tooling supports.
- What if a project has little or no instrumentable production code after approved exclusions? Document the case in planning; “nothing to measure” may pass only when the tool reports an empty denominator—not by inventing broad exclusions.
- What if tests all pass but coverage is under 90%? The coverage gate MUST still fail.
- What if a PR raises coverage in one project but drops another below 90% or below the base branch’s coverage? The gate evaluates each project independently; the weakened project fails the strategy.
- What if E2E flakiness threatens the pipeline? Critical E2E flows remain in scope; flaky tests must be fixed or quarantined with a replacement—removing coverage of a critical journey without replacement is not acceptable.
- What if a change is docs-only or non-executable? Coverage need not increase, but it MUST NOT decrease for any project, and CI still runs the suite.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each project (backend project, frontend app, shared library, or service) MUST independently achieve at least 90% test coverage; aggregated multi-project averages MUST NOT satisfy the gate.
- **FR-002**: Backend coverage MUST be at least 90% for every metric the tooling supports among lines, branches, functions/methods, and statements.
- **FR-003**: Frontend apps and other non-backend projects MUST meet ≥ 90% on every coverage dimension their tooling exposes and that the project adopts for gating.
- **FR-004**: Coverage thresholds MUST be evaluated automatically in CI/CD; the pipeline MUST fail when any project is below 90%.
- **FR-005**: Automated tests MUST run on every pull request and on the main branch.
- **FR-006**: A pull request MUST maintain or increase per-project coverage relative to its comparison base; decreases that leave a project below 90%, or that reduce coverage without an approved exception, MUST fail the quality bar.
- **FR-007**: No feature or behavior change MAY be considered complete without tests that cover the new or changed behavior.
- **FR-008**: Every bug fix MUST include a regression test that fails without the fix and passes with it.
- **FR-009**: The test suite MUST follow the test pyramid: prioritize unit tests (~70%), then integration tests (~20%), then end-to-end tests for critical journeys only (~10%) as a recommended distribution of effort/count—not as a separate CI percentage gate.
- **FR-010**: Unit tests MUST be fast, deterministic, and independent; they MUST target isolated functions, classes, and business rules.
- **FR-011**: Integration tests MUST verify real collaborations among components and dependencies (for example database, HTTP API, queues, cache, services) where those integrations exist in the system.
- **FR-012**: End-to-end tests MUST cover only critical business flows from the user’s perspective; they MUST NOT attempt full UI surface coverage.
- **FR-013**: This strategy SUPERSEDES the prior 80% local-only coverage gate (`002-coverage-gate`) for threshold (90%) and enforcement (CI + local); prior artifacts MUST be treated as historical once this feature is active.
- **FR-014**: Coverage exclusions, if any, MUST remain minimal (generated or non-executable noise only) and MUST NOT be used to game the 90% threshold.

### Key Entities

- **Project (coverage unit)**: A independently measurable unit of the codebase (backend project, frontend app, library, or service) with its own coverage report and gate.
- **Coverage report**: Per-project measurements for supported dimensions (lines, branches, functions/methods, statements) compared against the 90% floor.
- **Test level**: Classification of a test as unit, integration, or end-to-end for pyramid guidance.
- **Critical journey**: A named end-to-end business flow eligible for the thin E2E layer (for example authentication and core domain create/list paths).
- **Regression test**: A test added or updated with a bug fix that locks the corrected behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every in-scope frontend app reports ≥ 90% coverage on all gated dimensions when measured alone.
- **SC-002**: Every in-scope backend project reports ≥ 90% coverage on all gated dimensions when measured alone (including lines, branches, functions/methods, and statements when the tool provides them).
- **SC-003**: Every in-scope shared library or service reports ≥ 90% coverage when measured alone.
- **SC-004**: In validation runs, a deliberately under-covered project fails its gate while sibling projects at ≥ 90% still pass—proving non-aggregated evaluation.
- **SC-005**: In CI, a change that leaves any project below 90% fails before merge; a change that keeps all projects ≥ 90% and does not reduce coverage passes the coverage gate.
- **SC-006**: 100% of sampled completed features in the adoption window include tests for the new or changed behavior; 100% of sampled bug fixes include a regression test.
- **SC-007**: The automated suite’s composition is recognizably pyramid-shaped (majority unit, smaller integration, smallest E2E focused on critical journeys), verified by inventory rather than a CI hard ratio.
- **SC-008**: Contributors can determine pass/fail for a single project’s coverage in one documented local check without consulting another project’s numbers.

## Out of Scope *(mandatory for ProEventos)*

- Página Contatos
- Premium / heavy UI redesign (clean didactic UI only)
- Identity/auth product features (login/register UI changes) except insofar as existing auth flows are listed as critical E2E journeys under this strategy
- Changing product domain behavior unrelated to quality gates (Eventos/Palestrantes CRUD rules, pagination UX, etc.)
- Mandating a specific vendor, framework, or tool brand in this specification (tooling choices belong in planning)
- Hard CI failure solely because the 70/20/10 ratio is not exact (ratio is guidance)
- Exhaustive snapshot or pixel-perfect UI test farms
- Coverage of third-party or generated artifacts beyond the minimal exclusion policy

## Cross-Frontend Parity *(when UI work is included)*

This feature does not change user-facing product UI. Parity applies to **quality obligations**: each active frontend MUST independently meet the same ≥ 90% coverage gate and pyramid guidance.

| Frontend | In this feature? | Notes |
|----------|------------------|-------|
| Vue (`Front/Front-Vue`) | yes | Own coverage gate ≥ 90%; own unit/integration/E2E share |
| React (`Front/Front-React`) | yes | Own coverage gate ≥ 90%; own unit/integration/E2E share |
| Angular (`Front/Front-Angular`) | yes | Own coverage gate ≥ 90%; own unit/integration/E2E share |

## Assumptions

- All clients continue to consume the same ProEventos HTTP API (no per-frontend backends).
- “Project” means each independently built/tested unit already present in the repo layout (each backend project under `Back/`, each frontend app under `Front/`, and any shared library/service that ships its own test run)—aligned with the per-unit approach of `002-coverage-gate`, with the threshold raised to 90% and CI made mandatory.
- The recommended 70/20/10 pyramid is guidance for suite shape and investment; CI enforces coverage % and test execution, not exact ratio arithmetic.
- “Maintain or increase coverage” is evaluated per project against the PR’s comparison base; docs-only or non-code changes must not reduce coverage.
- Critical E2E journeys are the primary learner paths already in the product (for example account access where present, and core Eventos/Palestrantes flows)—exact journey list is finalized in planning without expanding product scope.
- This feature supersedes `002-coverage-gate` (80% local-only). Planning SHOULD amend project governance that still describes tests as optional or that forbids %-gates / 80% thresholds so this strategy is the single source of truth.
- Minimal exclusions for generated/non-executable noise remain allowed; expanding exclusions to pass the gate is not allowed.
- Learners still run API + one frontend locally; local coverage commands remain available in addition to CI.
