# Feature Specification: Multi-Frontend Eventos Study Platform

**Feature Branch**: `001-multi-front-eventos`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: shared .NET 8 API + three independent frontends (Vue, React (Vite), Angular) for eventos domain comparison; no Identity/JWT, Contatos, or premium redesign

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage eventos via API (Priority: P1)

As a learner, I can create, list, search by theme, view, update, and delete eventos through the shared API so every frontend has a correct backend to call.

**Why this priority**: Without a working Evento CRUD (and fixed create/update bugs), no frontend comparison is possible.

**Independent Test**: Call Evento endpoints with an HTTP client (Swagger/curl); verify POST creates, PUT updates, DELETE removes, and GET list/by-id/by-tema return expected data.

**Acceptance Scenarios**:

1. **Given** an empty or seeded database, **When** `GET /eventos`, **Then** the API returns 200 with a JSON array of eventos (possibly empty).
2. **Given** a valid Evento payload, **When** `POST /eventos`, **Then** the API creates the evento and returns 200/201 with the created resource (must not call update/delete).
3. **Given** an existing evento id, **When** `PUT /eventos/{id}` with a valid payload, **Then** the API updates and returns the resource (must not delete).
4. **Given** an existing evento id, **When** `DELETE /eventos/{id}`, **Then** the API removes it and subsequent GET by id returns 204/404 as designed.
5. **Given** eventos with themes, **When** `GET /eventos/tema/{tema}`, **Then** matching eventos are returned.

---

### User Story 2 - Manage lotes and redes sociais for an evento (Priority: P1)

As a learner, I can manage lotes and social links belonging to an evento so the detail/edit form has complete nested data.

**Why this priority**: Evento forms in all three frontends include lotes and redes sociais; incomplete APIs block parity.

**Independent Test**: Against a known `eventoId`, exercise lote and rede-social-by-evento routes without any frontend.

**Acceptance Scenarios**:

1. **Given** an evento id, **When** `GET /lotes/{eventoId}`, **Then** lotes for that evento are returned.
2. **Given** an evento id and a list of lotes, **When** `PUT /lotes/{eventoId}`, **Then** lotes are saved and returned.
3. **Given** evento and lote ids, **When** `DELETE /lotes/{eventoId}/{loteId}`, **Then** that lote is removed.
4. **Given** an evento id, **When** redes-sociais endpoints under `/redes-sociais/evento/...` are used, **Then** CRUD for that owner works.

---

### User Story 3 - Manage palestrantes (+ redes sociais) (Priority: P2)

As a learner, I can list and CRUD palestrantes and their social links so the second study screen exists on all fronts.

**Why this priority**: Required for parity, but secondary to Evento flows for the first demo slice.

**Independent Test**: Exercise `/palestrantes` and `/redes-sociais/palestrante/...` via HTTP client.

**Acceptance Scenarios**:

1. **Given** the API is running, **When** `GET /palestrantes`, **Then** a list is returned.
2. **Given** a valid palestrante payload, **When** POST/PUT/DELETE on `/palestrantes`, **Then** create/update/delete succeed.
3. **Given** a palestrante id, **When** redes-sociais-by-palestrante routes are used, **Then** owner-scoped social links work.

---

### User Story 4 - Same CRUD UX on three frontends (Priority: P2)

As a learner, I can perform the same eventos and palestrantes flows in Vue, React (Vite), and Angular apps, each calling the same API base URL, so I can compare frameworks.

**Why this priority**: Core study goal; depends on API stories being done.

**Independent Test**: With API up, run each frontend on its own port and complete list → detail/edit → save → delete for eventos; list/form for palestrantes. Login/registro screens may render but must not call auth APIs.

**Acceptance Scenarios**:

1. **Given** API + Front-Vue, **When** I list/create/edit/delete an evento (including lotes/redes), **Then** changes persist via the API.
2. **Given** API + Front-React, **When** I perform the same flows, **Then** behavior matches functionally (not pixel-perfect).
3. **Given** API + Front-Angular, **When** I perform the same flows, **Then** behavior matches functionally.
4. **Given** any frontend, **When** I open login/registro shell screens, **Then** no Identity/JWT API calls occur.

---

### User Story 5 - Runnable docs and folder layout (Priority: P3)

As a learner, I can follow the root README (and short per-folder READMEs) to start the API and each frontend under `Front/` (`Front-Vue/`, `Front-React/`, `Front-Angular/`) with **pnpm**.

**Why this priority**: Enables study setup; does not deliver domain features alone.

**Independent Test**: From a clean clone mindset, follow README steps and reach Swagger + each app home page.

**Acceptance Scenarios**:

1. **Given** the reorganized tree, **When** I open root `README.md`, **Then** I see structure, prerequisites, ports, main endpoints, and “auth not implemented”.
2. **Given** each app folder README, **When** I follow “how to run”, **Then** that app starts and points at the shared API URL.

---

### User Story 6 - Unit tests on API and each frontend (Priority: P2)

As a learner, I can run unit tests for the backend and for Vue, Next, and Angular so I see how each stack isolates services/UI from the real API.

**Why this priority**: Complements CRUD parity with per-stack testing practice; still secondary to working API and screens.

**Independent Test**: From repo root (or each folder), run the documented unit-test commands; suites exit 0 without starting browsers against a live multi-front E2E flow.

**Acceptance Scenarios**:

1. **Given** the backend test project, **When** I run `dotnet test` under `Back/`, **Then** Evento service tests prove create vs update vs delete behavior (regression of inverted bugs) and other context services have basic unit coverage with mocked dependencies.
2. **Given** Front-Vue, **When** I run its unit test script (Vitest), **Then** Evento (and Palestrante) service tests pass with HTTP mocked.
3. **Given** Front-React, **When** I run its unit test script (Vitest), **Then** equivalent service/UI unit tests pass with HTTP mocked.
4. **Given** Front-Angular, **When** I run `ng test` (headless/CI-friendly flags as documented), **Then** equivalent service/component specs pass with `HttpClient` mocked.
5. **Given** the READMEs, **When** I look for testing instructions, **Then** each stack documents how to run its unit tests; no requirement for cross-front E2E.

### Edge Cases

- Invalid Evento payload (missing tema/email/telefone, bad image URL pattern) → 400 with validation errors
- Unknown id on GET/PUT/DELETE → 204 No Content or 404 as documented in contracts (consistent across resources)
- Empty lote list on PUT → replaces/saves according to service rules without crashing
- CORS: browser calls from Vue/Next/Angular localhost ports succeed; other origins may be blocked
- Concurrent delete of already-deleted resource → safe failure (404/204), not 500

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose a single .NET 8 API consumed by all frontends
- **FR-002**: System MUST provide Evento CRUD at `/eventos` and theme search at `/eventos/tema/{tema}`
- **FR-003**: System MUST provide Lote operations at `/lotes/{eventoId}` (GET/PUT) and DELETE `/lotes/{eventoId}/{loteId}`
- **FR-004**: System MUST provide Palestrante CRUD at `/palestrantes`
- **FR-005**: System MUST provide RedeSocial operations scoped by owner under `/redes-sociais/evento/...` and `/redes-sociais/palestrante/...`
- **FR-006**: API MUST use Minimal APIs per context (not MVC Controllers) under `Endpoints/`
- **FR-007**: API MUST use Mapster for DTO mapping (not AutoMapper)
- **FR-008**: API MUST use EF Core 8 + SQLite and Swashbuckle for OpenAPI
- **FR-009**: API MUST enable CORS for the three frontend dev origins
- **FR-010**: POST Evento MUST create; PUT Evento MUST update (fix current inverted bugs)
- **FR-011**: Each frontend MUST offer: eventos list (search, delete, navigate to detail), evento create/edit form with lotes + redes, palestrantes list/form with redes
- **FR-012**: Login/registro UI MAY exist as visual shell only; MUST NOT call auth APIs
- **FR-013**: Frontends MUST use independent models/services (no shared npm types package)
- **FR-014**: Repo MUST use folders `Back/`, `Front/Front-Vue/`, `Front/Front-React/`, `Front/Front-Angular/` plus root README; each frontend MUST have its own `package.json` (pnpm)
- **FR-015**: UI MUST be clean didactic admin (one accent, one UI system per app; no Bootstrap mixed with another kit)
- **FR-016**: Backend MUST include an xUnit (or equivalent) unit-test project covering service-layer Evento/Lote/Palestrante/RedeSocial behavior with mocked repositories; Evento create vs update MUST be asserted explicitly
- **FR-017**: Each frontend (Vue, Next, Angular) MUST include runnable unit tests for its API services (HTTP mocked) and at least one meaningful UI unit test for list or form behavior
- **FR-018**: READMEs MUST document how to run backend and frontend unit tests; E2E cross-front suites MUST NOT be required
- **FR-019**: Local coverage gates MUST enforce ≥80% (lines/branches/methods or functions/statements as exposed by tooling) per backend coverage unit and per frontend app as defined in `specs/002-coverage-gate/`; commands MUST fail below threshold locally (no CI required). Real tests only — no coverage theater via empty tests or expanded exclusions beyond the approved minimal set.

### Key Entities

- **Evento**: local, data, tema, capacidade, imagem, telefone, email; has lotes, redes sociais, palestrantes (via join)
- **Lote**: nome, preço, datas, quantidade; belongs to Evento
- **Palestrante**: nome, mini currículo, imagem, telefone, email; has redes sociais
- **RedeSocial**: nome, URL; owned by Evento or Palestrante
- **Palestrante_Evento**: many-to-many link (backend relationship; UI association optional for this study slice)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All documented Evento/Lote/Palestrante/RedeSocial routes succeed via Swagger without 500s on happy path
- **SC-002**: Creating and updating an evento via API persists correctly (regression of former POST→Update / PUT→Delete bugs is gone)
- **SC-003**: Each of the three frontends can complete eventos list → edit → save → list refresh against the same API within one local session
- **SC-004**: A new developer can start API + one frontend in under 15 minutes using only README instructions
- **SC-005**: No Identity/JWT, Contatos page, Docker/deploy, or cross-front E2E suite is required to declare the feature done
- **SC-006**: `dotnet test` for the backend unit project passes on a clean machine with .NET 8 SDK
- **SC-007**: Unit test scripts for Front-Vue, Front-React, and Front-Angular each pass with HTTP mocked (no live API required)

## Out of Scope *(mandatory for ProEventos)*

- Identity / JWT (login, registro, tokens, authorization gates)
- Página Contatos
- Premium / heavy UI redesign (clean didactic UI only)
- Deploy / Docker
- Testes E2E cross-front (Playwright/Cypress spanning all three apps)
- Shared npm package of types across frontends
- Mutation testing
- CI/CD coverage workflow gates (local 80% coverage gates are in scope via `specs/002-coverage-gate/`)

## Cross-Frontend Parity *(when UI work is included)*

| Frontend | In this feature? | Notes |
|----------|------------------|-------|
| Vue (`Front-Vue/`) | yes | Evolve existing app; reference behavior |
| React (`Front-React/`) | yes | Vite + React Router CRUD parity |
| Angular (`Front-Angular/`) | yes | Scaffold standalone CRUD parity |

## Assumptions

- All clients consume the same ProEventos HTTP API (no per-frontend backends)
- Unauthenticated use is acceptable; Identity/JWT remains out of scope
- Learners run API + one or more frontends locally with .NET 8 SDK and Node
- Existing Evento/Lote domain and SQLite approach are reused and upgraded, not rewritten from zero
- Functional parity matters more than pixel-perfect UI across frameworks
- Default Kestrel URLs `http://localhost:5000` / `https://localhost:5001` (or IIS Express `https://localhost:44374`) are the API base; frontends configure that base URL via env
- Unit tests are required for learning; local **80% coverage gates** apply per `specs/002-coverage-gate/` (real tests; no coverage theater)
- E2E and live multi-browser matrices remain out of scope even though unit tests are in scope
