<!--
Sync Impact Report
- Version change: 2.0.0 → 2.1.0
- Modified principles: none (I–V unchanged)
- Architecture Constraints:
  - Testing: optional → mandatory 90% per-unit + pyramid + CI (016-test-strategy)
- Scope Boundaries: unchanged (Contatos / premium redesign out; Identity when spec requires)
- Templates requiring updates:
  - .specify/templates/plan-template.md / tasks-template.md — Testing notes
  - docs/testing.md ✅
- Follow-up TODOs: none
- Trigger: specs/016-test-strategy
-->

# ProEventos Constitution

## Core Principles

### I. Shared API Contract

There is exactly one backend API. All frontends MUST consume the same HTTP
contract (routes, payloads, status codes) without framework-specific forks of
the API. Contract changes MUST be documented and applied so every client can
stay compatible. Frontends MUST NOT embed business rules that belong on the
server.

**Rationale**: The study goal is fair comparison of Vue, React, and
Angular against one domain API—not divergent backends.

### II. Frontend Independence

Each frontend (Vue, React, Angular) MUST remain an independent
application with its own toolchain, routing, and state approach. Shared code
across frontends is limited to conceptual parity (same screens and behaviors),
not shared UI libraries or cross-framework packages. Implementing a feature in
one client MUST NOT require changing another client's framework internals.

**Rationale**: Independence makes framework trade-offs visible and keepable as
separate study artifacts.

### III. Domain Focus (Eventos)

In-scope work centers on the eventos domain and related resources already
served by the API (for example lotes tied to an evento). Features MUST map to
clear CRUD/list/detail flows useful for learning. Specs and tasks MUST name
concrete entities and user journeys in this domain.

**Rationale**: A narrow domain keeps the comparison readable and completable.

### IV. Didactic Simplicity (NON-NEGOTIABLE)

Prefer the simplest design that teaches the pattern. UI MUST be clean and
legible; premium redesign, heavy visual systems, and speculative abstractions
are forbidden unless a spec explicitly justifies them against this principle.
YAGNI applies: no feature, dependency, or layer “for later” without an active
requirement.

**Rationale**: Study value comes from clarity of code and flows, not polish.

### V. Cross-Frontend Feature Parity

When a user-facing capability is in scope for the comparison, each active
frontend MUST expose equivalent behavior against the same API (same happy path
and the same primary error feedback). Temporary gaps MUST be listed in the
feature spec with an explicit catch-up plan. Do not invent client-only features
that other frontends cannot mirror via the shared API.

**Rationale**: Parity is what makes the framework comparison meaningful.

## Scope Boundaries

The following are **out of scope** unless the constitution is amended:

- **Página Contatos**: contacts UI and related navigation are excluded.
- **Premium / heavy redesign**: no design-system overhaul; clean didactic UI
  is sufficient.

**Identity / authentication**: In scope when an active feature specification
explicitly requires registration, login, profile, password change, access
credentials, or route protection for maintenance flows. Auth MUST use the
shared API contract and remain didactic (no speculative SSO/IdP sprawl unless
a spec requires it). Features that do not mention auth MUST NOT invent it.

Existing stubs or menu items for excluded areas (Contatos, premium redesign)
MUST NOT be expanded; they MAY be removed or left inert without becoming
sprint goals.

## Architecture Constraints

- **Backend**: .NET API under `Back/` (layered projects such as Api, Domain,
  Persistence, Application/Services). Prefer extending existing layers over
  inventing parallel stacks.
- **Frontends**: independent apps under `Front/` (`Front-Vue`, `Front-React`,
  `Front-Angular`); each MUST follow independence rules and own its
  `package.json` (**pnpm** install/run in that folder). Each app talks only to
  the shared API over HTTP.
- **Data**: persistence stays behind the API; frontends MUST NOT access the
  database directly.
- **Testing**: Mandatory quality bar for the repo (see
  `specs/016-test-strategy/`): each backend coverage unit and each frontend
  app MUST independently reach ≥ **90%** coverage (lines/branches/methods or
  statements as exposed by tooling), enforced locally and in CI on every PR
  and on `main`. Prefer the test pyramid (~70% unit / ~20% integration /
  ~10% critical E2E). No feature is complete without tests; every bug fix
  MUST include a regression test. Do not expand coverage exclusions to game
  the gate. Exhaustive UI snapshot farms remain out of scope.

## Governance

This constitution supersedes informal practice and conflicting guidance in
specs, plans, and tasks. Amendments MUST:

1. Update `.specify/memory/constitution.md` with a semantic version bump:
   - **MAJOR**: remove/redefine a principle or change scope boundaries in a
     breaking way
   - **MINOR**: add a principle/section or materially expand guidance
   - **PATCH**: clarify wording without changing intent
2. Set **Last Amended** to the amendment date (ISO `YYYY-MM-DD`).
3. Propagate material changes to Speckit templates (`plan`, `spec`, `tasks`)
   and note impact in the Sync Impact Report comment at the top of this file.

Compliance: every `/speckit-plan` Constitution Check MUST pass (or record
justified violations in Complexity Tracking). Reviews and implementations MUST
reject work that reintroduces Contatos or premium redesign without an approved
amendment, and MUST reject Identity/auth work that is not required by an
active feature spec.

**Version**: 2.1.0 | **Ratified**: 2026-07-24 | **Last Amended**: 2026-07-29
