# Feature Specification: 80% Coverage Gate

**Feature Branch**: `002-coverage-gate`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Plano: 80% coverage gate — Escopo opção 3 (80% por camada/projeto backend e por app frontend); Enforcement local (comandos falham abaixo de 80%, sem CI); Abordagem opção A (thresholds nativos + testes reais); Métricas lines/branches/methods/functions/statements ≥ 80 onde a ferramenta expõe; Exclusões mínimas apenas (Migrations EF, *.Designer.cs, *.d.ts, CSS, setup de teste); Não excluir Program.cs, páginas, Persistence, DI, routers; Emendar spec/plan/research de 001 que proíbem %-gates."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Local coverage gate fails below threshold (Priority: P1)

As a learner or contributor working on ProEventos, I run the documented local “test with coverage” command for a backend layer or a frontend app. If any measured coverage dimension for that unit is below 80%, the command fails with a clear non-zero exit so I know I must add real tests before considering the work done.

**Why this priority**: Without a hard local gate, the 80% target is aspirational and will not change day-to-day habits; this is the enforcement value of the feature.

**Independent Test**: Temporarily reduce tests or exclude a large tested file so coverage drops below 80% for one unit; run that unit’s coverage command; observe failure. Restore tests and observe success when all dimensions are ≥ 80%.

**Acceptance Scenarios**:

1. **Given** a backend project whose measured coverage for any required dimension is below 80%, **When** I run that project’s documented coverage command, **Then** the command exits with failure and reports which threshold(s) failed.
2. **Given** a frontend app whose measured coverage for any required dimension is below 80%, **When** I run that app’s documented coverage command, **Then** the command exits with failure and reports which threshold(s) failed.
3. **Given** a unit that meets ≥ 80% on every required dimension, **When** I run its coverage command, **Then** the command exits successfully.

---

### User Story 2 - Per-layer and per-app 80% with real tests (Priority: P1)

As a learner, I see that each backend layer/project and each frontend app independently reaches at least 80% coverage through meaningful unit tests of that unit’s own code—not by gaming exclusions or counting unrelated projects together.

**Why this priority**: Option 3 (per unit) and option A (real tests + native thresholds) are the closed product decisions; a single aggregated number would hide weak layers.

**Independent Test**: Run coverage for each backend project and each of the three frontend apps separately; confirm each report’s denominator includes production code that is in scope (Program/startup, pages, Persistence, DI, routers) and that thresholds are evaluated per unit.

**Acceptance Scenarios**:

1. **Given** the backend solution, **When** coverage is collected, **Then** each in-scope backend project is measured and gated on its own (not only the solution average).
2. **Given** Front-Vue, Front-React, and Front-Angular, **When** coverage is collected for each, **Then** each app is measured and gated on its own.
3. **Given** gaps below 80% in a unit, **When** contributors close the gap, **Then** they do so by adding or extending real unit tests for that unit’s behavior (happy paths and key edge cases), not by expanding the exclusion list beyond the approved minimal set.

---

### User Story 3 - Honest denominator via minimal exclusions (Priority: P2)

As a maintainer, I rely on coverage numbers that exclude only generated or non-executable noise (EF migrations, designer files, declaration files, stylesheets, and shared test-setup helpers). Production entrypoints, UI pages, persistence, dependency wiring, and routers remain in the denominator and must be covered by tests where the tools can measure them.

**Why this priority**: An inflated score from broad exclusions defeats the teaching goal; the exclusion list is explicitly non-negotiable.

**Independent Test**: Inspect the configured exclusion patterns for backend and each frontend; verify only the approved categories appear and that Program/startup, pages, Persistence, DI, and routers are not excluded.

**Acceptance Scenarios**:

1. **Given** coverage configuration for backend, **When** I review exclusions, **Then** only EF Migrations, `*.Designer.cs`, and equivalent generated noise (as applicable) are excluded—not Persistence, DI registration, or API entrypoints.
2. **Given** coverage configuration for a frontend app, **When** I review exclusions, **Then** only `*.d.ts`, CSS, and named test-setup files (`test/setup.ts`, `test-setup.ts`, or the app’s equivalent) are excluded—not pages, routers, or app bootstrap.
3. **Given** a contributor proposes excluding a large production module to “pass” the gate, **When** the change is reviewed against this spec, **Then** it is rejected unless the constitution/spec are formally amended.

---

### User Story 4 - Governance docs no longer forbid %-gates (Priority: P2)

As a planner using Speckit artifacts, I read the active multi-front feature docs and no longer find an absolute ban on hard coverage percentage gates that would contradict this feature. Prior “didactic minimum / no %-gate” wording is amended so this feature is the source of truth for the 80% local gate.

**Why this priority**: Spec/plan/research for `001-multi-front-eventos` currently prohibit %-gates; leaving that conflict would block honest planning and reviews.

**Independent Test**: Search `specs/001-multi-front-eventos/` for residual absolute prohibitions of hard coverage %-gates; confirm they are removed or explicitly superseded by this feature.

**Acceptance Scenarios**:

1. **Given** `specs/001-multi-front-eventos/spec.md`, `plan.md`, and `research.md`, **When** this feature is complete, **Then** they no longer list “hard coverage %-gates” as out of scope or “not coverage %” as the standing policy without pointing to the 80% local gate adopted here.
2. **Given** a reviewer checking Constitution/Didactic Simplicity, **When** they evaluate coverage work, **Then** focused real tests plus an explicit 80% local gate are allowed; coverage theater via empty tests or expansive exclusions remains forbidden.

---

### Edge Cases

- What happens when a backend project has little or no executable application code (e.g., thin Domain types)? The gate still applies to measured dimensions the tool reports; if a project has zero instrumentable lines after approved exclusions, document that edge in planning and treat “no code to cover” as pass only when the tool reports nothing to measure—not by inventing exclusions.
- What happens when a metric is not exposed by a tool (e.g., one tool lacks “methods”)? Only dimensions the tool exposes are required; all exposed among lines, branches, methods/functions, and statements MUST still be ≥ 80%.
- What happens when tests pass but coverage is below 80%? The coverage command MUST fail even if unit assertions all passed.
- What happens when CI is considered later? Out of scope for this feature—local failure only; no pipeline gate is required to declare done.
- What happens when someone runs plain `test` without coverage? Documented “test with coverage” (or equivalent) is the gate; plain test may still pass for fast feedback, but README/quickstart MUST make the coverage command the quality bar for this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each in-scope backend project/layer MUST be measurable independently for coverage and MUST meet a minimum of 80% on every coverage dimension the backend tooling exposes among: lines, branches, methods/functions, and statements.
- **FR-002**: Each frontend app (Vue, React, Angular) MUST be measurable independently for coverage and MUST meet a minimum of 80% on every coverage dimension the frontend tooling exposes among: lines, branches, methods/functions, and statements.
- **FR-003**: Documented local coverage commands MUST fail (non-zero exit) when any required dimension for that unit is below 80%.
- **FR-004**: Enforcement MUST be local only for this feature; continuous-integration coverage gates MUST NOT be required to complete the feature.
- **FR-005**: Coverage MUST be raised primarily by adding or extending real unit tests that exercise production behavior of the unit under test (option A), not by lowering thresholds or broadening exclusions.
- **FR-006**: Coverage exclusions MUST be limited to the approved minimal set: EF Migrations; `*.Designer.cs`; `*.d.ts`; CSS; and test-setup helpers (`test/setup.ts`, `test-setup.ts`, or the project’s equivalent). Contributors MUST NOT exclude Program/startup, pages, Persistence, DI wiring, or routers to pass the gate.
- **FR-007**: Thresholds MUST use the native coverage-threshold facilities of the stack’s chosen coverage tools (backend coverage collector with fail-below-threshold behavior; frontend test runner coverage thresholds), configured to the 80% rule in FR-001/FR-002.
- **FR-008**: Project documentation (root and/or per `Back/` and `Front/*` READMEs as appropriate) MUST describe how to run coverage for each unit and that failure below 80% is expected until tests catch up.
- **FR-009**: Artifacts under `specs/001-multi-front-eventos/` that currently prohibit hard coverage %-gates or declare “didactic, not coverage %” as standing policy MUST be amended so they align with this feature (supersede the ban; retain teaching-oriented tests and the ban on coverage theater).
- **FR-010**: Existing focused unit-test suites MAY be extended or new test projects/suites added as needed so every gated unit can honestly reach 80% without violating FR-006.

### Key Entities

- **Coverage Unit**: One independently gated surface—either one backend project/layer or one frontend app.
- **Coverage Dimension**: A measurable aspect reported by the tooling (lines, branches, methods/functions, statements) when available.
- **Exclusion Rule**: A named pattern removing files from the coverage denominator; only the approved minimal set is allowed.
- **Coverage Gate Result**: Pass or fail for a Coverage Unit after comparing each required dimension to 80%.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every in-scope backend Coverage Unit, running the documented local coverage command reports ≥ 80% on all dimensions the tool exposes among lines, branches, methods/functions, and statements, and exits successfully.
- **SC-002**: For Front-Vue, Front-React, and Front-Angular each, running the documented local coverage command reports ≥ 80% on all dimensions the tool exposes among lines, branches, methods/functions, and statements, and exits successfully.
- **SC-003**: Deliberately dropping any required dimension below 80% on a unit causes that unit’s coverage command to fail within one local run (no CI dependency).
- **SC-004**: Review of exclusion configuration shows only the approved minimal exclusion categories; Program/startup, pages, Persistence, DI, and routers remain included in the denominator.
- **SC-005**: `specs/001-multi-front-eventos` no longer states an absolute out-of-scope ban on hard coverage %-gates; wording points to the 80% local gate as the adopted quality bar.
- **SC-006**: A new contributor can identify the correct coverage command per unit from README/quickstart in under 5 minutes without asking the team.

## Out of Scope *(mandatory for ProEventos)*

- Identity / JWT (login, registro, tokens, authorization gates)
- Página Contatos
- Premium / heavy UI redesign (clean didactic UI only)
- CI/CD pipeline coverage gates or required cloud builds
- Mutation testing
- E2E cross-front suites (Playwright/Cypress spanning all three apps)
- Expanding exclusions beyond the approved minimal set
- Lowering the 80% threshold or aggregating all projects into a single blended score to “pass”
- Shared npm package of types across frontends
- Deploy / Docker

## Cross-Frontend Parity *(when UI work is included)*

| Frontend | In this feature? | Notes |
|----------|------------------|-------|
| Vue (`Front-Vue/`) | yes | Own local coverage gate ≥ 80%; real tests until gate passes |
| React (`Front-React/`) | yes | Same bar as Vue; independent app measurement |
| Angular (`Front-Angular/`) | yes | Same bar as Vue/React; independent app measurement |

## Assumptions

- Closed scope choice is **option 3**: 80% per backend project/layer and per frontend app (not a single monorepo aggregate, not “services only”).
- Closed enforcement choice: **local commands fail below 80%; no CI** in this feature.
- Closed approach is **option A**: native thresholds (Coverlet on backend; Vitest coverage with `@vitest/coverage-v8` or equivalent on frontends) plus real tests per layer/app—not coverage theater.
- Required metrics where exposed: **lines, branches, methods/functions, and statements** each ≥ 80%.
- Approved exclusions are exactly: EF Migrations, `*.Designer.cs`, `*.d.ts`, CSS, and test-setup files (`test/setup.ts`, `test-setup.ts` / equivalents). Program.cs / startup, pages, Persistence, DI, and routers stay in the denominator.
- In-scope backend projects are the existing layered projects under `Back/src/` that contain production code subject to the gate; the current single `ProEventos.Services.Tests` suite is insufficient alone and will need expansion and/or additional suites so each gated project can meet 80% honestly.
- Prior feature `001-multi-front-eventos` remains the product baseline; this feature **amends** its testing policy rather than replacing the whole multi-front delivery.
- Constitution principle IV (Didactic Simplicity) continues to forbid empty/trivial tests written only to inflate percentages; the 80% gate does not authorize coverage theater.
- Unauthenticated study use remains acceptable; Identity/JWT stays out of scope.
- Learners run API and frontends locally; coverage commands are intended for that local workflow.
