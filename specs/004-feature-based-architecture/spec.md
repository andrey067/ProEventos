# Feature Specification: Feature-Based Frontend Architecture

**Feature Branch**: `004-feature-based-architecture`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Organização por funcionalidades (Feature Based Architecture): telas agrupadas por domínio (eventos, palestrantes, user); models que representam entidades da API; shared para componentes reutilizados (nav, footer, spinner, modal, pagination)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find Evento screens under one feature area (Priority: P1)

As a learner exploring any active frontend, I open the source tree and immediately find all Evento-related screens (list, detail, create/edit) grouped under a single Eventos feature area—not scattered among unrelated folders. Opening those screens in the running app still lists, views, and edits eventos exactly as before.

**Why this priority**: Eventos is the core study domain; if Evento screens are not co-located, the Feature Based Architecture lesson fails.

**Independent Test**: Inspect each frontend’s source: Evento list, detail, and edit/create screens live under one Eventos feature folder (or equivalent naming). Run the app and complete list → detail → edit → save without behavioral regression.

**Acceptance Scenarios**:

1. **Given** any active frontend codebase, **When** I look for Evento UI screens, **Then** list, detail, and create/edit live under one Eventos feature area rather than mixed with unrelated domains.
2. **Given** the reorganized Evento screens, **When** I use list, detail, and create/edit in the running app, **Then** navigation, data display, and persistence outcomes match pre-reorganization behavior.

---

### User Story 2 - Find Palestrante screens under one feature area (Priority: P1)

As a learner, I locate all Palestrante-related screens (list, detail/create-edit as currently offered) under one Palestrantes feature area on each frontend, while the running app continues to support the same palestrante journeys.

**Why this priority**: Palestrantes is the second major domain; co-location must match Eventos for a consistent teaching pattern.

**Independent Test**: Confirm Palestrante screens sit under one Palestrantes feature folder per frontend; exercise existing list/create/edit flows without regression.

**Acceptance Scenarios**:

1. **Given** any active frontend codebase, **When** I look for Palestrante UI screens, **Then** they live under one Palestrantes feature area.
2. **Given** those screens after reorganization, **When** I use the existing palestrante journeys, **Then** behavior and API outcomes match today.

---

### User Story 3 - Discover domain models in one place (Priority: P1)

As a learner, I open a dedicated models area and find one application model per API entity used by the UI (Evento, Lote, RedeSocial, Palestrante, and User if the app already references it). Each model’s fields match what the screens and shared API already expose for that entity. Screens and services consume these models instead of ad-hoc inline shapes duplicated across folders.

**Why this priority**: Shared domain shapes are half of Feature Based Architecture; without a clear models area, feature folders alone do not teach the pattern.

**Independent Test**: Open the models area on each frontend; verify the expected entity models exist with fields aligned to current UI/API usage; confirm screens import from models rather than redefining the same entity shapes locally.

**Acceptance Scenarios**:

1. **Given** any active frontend, **When** I open the models area, **Then** I find distinct models for Evento, Lote, RedeSocial, and Palestrante (and User only if already referenced by that app).
2. **Given** those models, **When** I compare fields to what list/detail/forms already show and send, **Then** attributes align with existing entities (for example Evento: identity, tema, local, data do evento, and other fields already used).
3. **Given** feature screens, **When** they declare typed data for those entities, **Then** they reuse the models area rather than duplicating incompatible local type definitions for the same entity.

---

### User Story 4 - Reuse shared chrome across features (Priority: P2)

As a learner, I find cross-cutting UI pieces (navigation, footer, loading indicator, modal, pagination—whichever the app already uses) under a shared area, not copied inside each feature. Feature screens compose these shared pieces. After reorganization, navigation chrome and shared feedback (loading, dialogs, paging) still work the same.

**Why this priority**: Shared vs feature separation is the third pillar of the requested pattern; lower than domain co-location only because apps may already partially centralize chrome.

**Independent Test**: Confirm shared pieces live under a shared area; confirm Eventos/Palestrantes screens import them; smoke-test nav, loading, modal, and pagination where present.

**Acceptance Scenarios**:

1. **Given** any active frontend, **When** I look for nav, footer, spinner/loading, modal, and pagination (as applicable), **Then** each reusable piece lives under a shared area rather than being duplicated per feature.
2. **Given** Eventos or Palestrantes screens, **When** they need chrome or common feedback UI, **Then** they compose the shared pieces.
3. **Given** the running app after reorganization, **When** I navigate and trigger loading/dialog/paging behaviors already present, **Then** those behaviors remain unchanged.

---

### User Story 5 - Learners recognize the Feature Based Architecture pattern (Priority: P2)

As a learner comparing Vue, React, and Angular, I can open each app’s source and recognize the same conceptual layout: feature folders by domain, a models area for API entities, and a shared area for reusable UI—without needing identical folder spellings across frameworks, but with the same teaching structure.

**Why this priority**: The study goal is cross-frontend pattern clarity; structure must be comparable even when framework conventions differ slightly.

**Independent Test**: Side-by-side review of the three frontends’ top-level source organization maps to features / models / shared; no new user-facing capability is required beyond structural clarity.

**Acceptance Scenarios**:

1. **Given** all three active frontends after the change, **When** I compare their source trees at a glance, **Then** each exposes feature domains, models, and shared reusable UI as distinct areas.
2. **Given** that comparison, **When** I look for Contatos or new Identity/JWT product features, **Then** none were added as part of this reorganization.

---

### Edge Cases

- What if a screen serves more than one domain (for example evento detail embedding lotes)? It stays under the owning feature (Eventos); nested concepts do not force a separate top-level feature unless they already have standalone screens.
- What if login/perfil stubs exist today? They may sit under a User feature folder only as inert stubs; this feature MUST NOT implement authentication, registration, tokens, or profile persistence.
- What if a frontend already uses a different folder naming convention (`pages/` vs `components/`)? Rename/move toward feature domains while preserving routes and public URLs; framework entry points may keep thin wrappers if required by the toolchain.
- What if a model field is used only by one screen? Still live in the models area for that entity; do not invent fields the API/UI do not already use.
- What if shared and feature both need a small presentational piece? Prefer shared only when reused (or clearly intended for reuse) across features; keep one-off markup inside its feature.
- What happens to existing imports and tests? Paths update so the app builds and existing automated tests for affected screens still pass.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each active frontend MUST organize user-facing screens by business feature/domain so that Eventos screens are co-located and Palestrantes screens are co-located.
- **FR-002**: Within the Eventos feature area, the application MUST include the Evento list, Evento detail, and Evento create/edit surfaces that already exist for that frontend (equivalent names allowed).
- **FR-003**: Within the Palestrantes feature area, the application MUST include the Palestrante list and detail/create-edit surfaces that already exist for that frontend.
- **FR-004**: Each active frontend MUST provide a models area containing application models for Evento, Lote, RedeSocial, and Palestrante that represent the corresponding API entities used by the UI.
- **FR-005**: Evento model attributes MUST include at least identity, tema, local, and data do evento, plus any other Evento fields already consumed by that frontend’s screens or services.
- **FR-006**: Feature screens and client services MUST consume the models area for entity shapes instead of maintaining divergent duplicate definitions of the same entity inside feature folders.
- **FR-007**: Each active frontend MUST provide a shared area for reusable cross-feature UI (navigation, footer, loading indicator, modal, pagination—whichever apply to that app).
- **FR-008**: Feature areas MUST compose shared UI pieces rather than copying nav/footer/spinner/modal/pagination implementations into each feature.
- **FR-009**: Reorganization MUST preserve existing user-visible behavior, routes/URLs, layout/visual appearance, and shared API usage; this feature delivers structure for learning, not new CRUD capabilities.
- **FR-010**: A User feature folder (login/perfil) MAY exist only to hold already-present inert stubs; the product MUST NOT gain Identity/JWT, login, registro, or authorized profile flows from this work.
- **FR-011**: The same Feature Based Architecture concept (features + models + shared) MUST be applied across Vue, React, and Angular frontends for teaching parity, allowing framework-idiomatic naming differences.
- **FR-012**: After moves/renames, each frontend MUST build successfully and existing automated tests covering moved screens MUST continue to pass (with path updates only as needed).

### Key Entities

- **Evento**: Core event domain object (identity, tema, local, data do evento, and related fields already used by screens).
- **Lote**: Ticket/batch belonging to an Evento; modeled for nested use in Evento flows.
- **RedeSocial**: Social link associated with Evento or Palestrante as already used by the UI.
- **Palestrante**: Speaker domain object for list/detail/create-edit journeys.
- **User**: Optional stub-only entity if already referenced; not an authentication delivery scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On each active frontend, a new contributor can locate all Evento screens and all Palestrante screens within one feature area each in under 2 minutes without asking for directions.
- **SC-002**: 100% of in-scope entity types used by the UI (Evento, Lote, RedeSocial, Palestrante) have a single discoverable model definition in the models area per frontend.
- **SC-003**: Zero intentional duplication of nav/footer/spinner/modal/pagination implementations across feature folders (one shared source per piece that the app uses).
- **SC-004**: After reorganization, learners complete the same primary Evento and Palestrante journeys with no new defects attributable to the move (smoke parity with pre-change behavior).
- **SC-005**: Side-by-side review of the three frontends shows the same conceptual structure (features / models / shared) on all three, supporting the study comparison goal.

## Out of Scope *(mandatory for ProEventos)*

- Identity / JWT (login, registro, tokens, authorization gates)—User folders stay stub-only if present
- Página Contatos
- Premium / heavy UI redesign (clean didactic UI only; no visual overhaul during moves)
- New domain features or API endpoints
- Changing business rules, validation semantics, or HTTP contracts
- Sharing source packages or UI libraries across Vue/React/Angular (conceptual parity only)
- Introducing Feature Based Architecture into the backend `.NET` solution (frontends only)

## Cross-Frontend Parity *(when UI work is included)*

| Frontend      | In this feature? | Notes                                                                 |
|---------------|------------------|-----------------------------------------------------------------------|
| Vue           | yes              | Reorganize toward features / models / shared; preserve behavior       |
| React/Next.js | yes              | Same conceptual layout; framework-idiomatic folder names allowed      |
| Angular       | yes              | Same conceptual layout; framework-idiomatic folder names allowed      |

## Assumptions

- All clients consume the same ProEventos HTTP API (no per-frontend backends)
- Unauthenticated use is acceptable; Identity/JWT remains out of scope
- Learners run the API plus one frontend locally to verify journeys after moves
- “User” in the example tree is illustrative of the pattern; login/perfil are not product goals
- Lotes and redes sociais remain nested under Eventos (and palestrante associations as today) unless a frontend already has standalone screens for them
- Existing route paths and menu labels stay the same so learners are not blocked by URL changes
- Framework-specific entry files (routing modules, lazy load points, barrel files) may remain thin adapters outside feature folders when the toolchain requires it
- This feature may land after or alongside forms work; structural moves should not undo form-behavior requirements from other active specs
