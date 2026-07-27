# Feature Specification: Eventos Domain Business Rules

**Feature Branch**: `005-eventos-domain-rules`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: Canonical ProEventos domain covering Eventos, Lotes, Palestrantes, Redes Sociais, Usuário, and Autenticação — CRUD rules, relationships, cascade delete on evento removal, theme search, lote validations, many-to-many evento–palestrante, social links owned by evento or palestrante; explicitly excludes tickets, payments, capacity enforcement, and approval workflows

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage eventos (Priority: P1)

As an organizer, I can create, list, search by theme, view, edit, and delete eventos so the organization can keep its event catalog up to date.

**Why this priority**: Evento is the central entity; every other domain hangs off it.

**Independent Test**: Create an evento with required fields, list all, open by id, search by theme fragment, edit allowed fields, delete and confirm it is gone.

**Acceptance Scenarios**:

1. **Given** valid theme, location, date, participant count, phone, and email, **When** the organizer registers an evento, **Then** the evento is stored and can be retrieved by id.
2. **Given** several eventos whose themes contain a shared text fragment (e.g. “Angular”), **When** the organizer searches by that fragment, **Then** all matching eventos are returned (e.g. Angular Summit, Angular Experience, Curso Angular) and non-matching ones are not.
3. **Given** an existing evento, **When** the organizer updates theme, location, date, participant count, image, phone, or email, **Then** the updated values are persisted and returned on subsequent consultation.
4. **Given** an existing evento with associated lotes and redes sociais, **When** the organizer deletes the evento, **Then** the evento and its associated lotes and redes sociais are removed.
5. **Given** eventos exist, **When** the organizer lists all eventos, **Then** every registered evento appears in the result.

---

### User Story 2 - Manage lotes of an evento (Priority: P1)

As an organizer, I can add, update, and remove sales batches (lotes) for a single evento so ticket tiers (1º Lote, 2º Lote, VIP, Promocional, etc.) stay accurate without deleting the evento.

**Why this priority**: Lotes are required to complete a usable evento; they are part of the primary maintenance flow.

**Independent Test**: Against one existing evento, create lotes with valid data, reject invalid date/price/quantity, remove one lote and confirm the evento remains.

**Acceptance Scenarios**:

1. **Given** an evento, **When** the organizer creates a lote with name, price, start date, end date, and quantity, **Then** the lote is stored and belongs only to that evento.
2. **Given** a lote create/update attempt where start date is after end date, **When** the organizer submits, **Then** the system rejects the change and the lote is not saved.
3. **Given** a lote create/update attempt with quantity ≤ 0 or price ≤ 0, **When** the organizer submits, **Then** the system rejects the change and the lote is not saved.
4. **Given** an evento with one or more lotes, **When** the organizer deletes a single lote, **Then** that lote is removed and the evento (and other lotes) remain.

---

### User Story 3 - Manage palestrantes and link them to eventos (Priority: P2)

As an organizer, I can register, edit, delete, and search palestrantes, and associate them with eventos, so speaker participation across events is visible and maintainable.

**Why this priority**: Core related domain after eventos/lotes; many-to-many association is required for a complete catalog.

**Independent Test**: CRUD a palestrante, search by name and by event theme, link the same palestrante to two eventos and verify both directions.

**Acceptance Scenarios**:

1. **Given** valid name and related profile fields, **When** the organizer registers a palestrante, **Then** the palestrante can be listed and opened by id.
2. **Given** existing palestrantes, **When** the organizer searches by name, **Then** matching palestrantes are returned.
3. **Given** palestrantes linked to eventos with known themes, **When** the organizer searches palestrantes by event theme, **Then** palestrantes associated with matching eventos are returned.
4. **Given** an evento and a palestrante, **When** the organizer associates them, **Then** the evento lists the palestrante and the palestrante lists the evento.
5. **Given** a palestrante linked to multiple eventos, **When** the organizer deletes the palestrante, **Then** the palestrante is removed and the eventos remain (association rows are cleared).

---

### User Story 4 - Manage redes sociais for evento or palestrante (Priority: P2)

As an organizer, I can attach multiple social network links (name + URL) to an evento or to a palestrante so contact/presence information stays with the owning entity.

**Why this priority**: Supporting data for both evento and palestrante maintenance screens.

**Independent Test**: Add, edit, and remove redes sociais under one evento and under one palestrante independently.

**Acceptance Scenarios**:

1. **Given** an evento, **When** the organizer adds one or more redes sociais with name and URL, **Then** they appear only for that evento.
2. **Given** a palestrante, **When** the organizer adds one or more redes sociais with name and URL, **Then** they appear only for that palestrante.
3. **Given** redes sociais on an evento, **When** the evento is deleted, **Then** those redes sociais are removed with it.
4. **Given** a rede social on a palestrante, **When** that link is removed individually, **Then** only that link is deleted and the palestrante remains.

---

### User Story 5 - Account access and protected maintenance (Priority: P3)

As an organizer, I can register, sign in, edit my profile, and change my password so only authenticated users maintain eventos, palestrantes, and profile data.

**Why this priority**: Gates maintenance flows after core CRUD; required by this feature (constitution v2.0.0 allows Identity/auth when a spec requires it).

**Independent Test**: Register with unique email, sign in, receive a session credential usable on subsequent requests, edit profile and password; unauthenticated access to maintenance areas is blocked.

**Acceptance Scenarios**:

1. **Given** a new user with unique email and a password, **When** they register, **Then** an account is created and duplicate email registration is rejected.
2. **Given** valid credentials, **When** the user signs in, **Then** the system issues an access credential and the client can call protected operations with it.
3. **Given** an authenticated user, **When** they edit profile or change password, **Then** the changes persist for later sessions.
4. **Given** an unauthenticated visitor, **When** they try to open evento edit, palestrante edit, or profile maintenance, **Then** access is denied until they sign in.

---

### Edge Cases

- Creating an evento without any of the required fields (theme, location, date, participant count, phone, email) is rejected.
- Theme search with no matches returns an empty result, not an error.
- Theme search is textual/partial match on theme (case behavior may follow existing API convention).
- Deleting an evento that has no lotes or redes sociais still succeeds.
- Deleting a lote never deletes its parent evento.
- Associating the same palestrante to the same evento more than once does not create a duplicate participation.
- Rede social must belong to either an evento or a palestrante (not both, not neither).
- Lote with start date equal to end date: treated as valid only if both dates represent the same day window the product already accepts; otherwise rejected when start is after end (assumption: same-day allowed).
- Registration with an email already in use is rejected.
- Expired or missing access credential results in denied access to protected maintenance.

## Requirements *(mandatory)*

### Functional Requirements

#### Eventos

- **FR-001**: System MUST allow creating an evento only when theme, location, date, participant count, phone, and email are provided.
- **FR-002**: System MUST allow updating an evento’s theme, location, date, participant count, image, phone, and email.
- **FR-003**: System MUST allow deleting an evento.
- **FR-004**: When an evento is deleted, the system MUST also remove its associated lotes and redes sociais.
- **FR-005**: System MUST allow listing all eventos.
- **FR-006**: System MUST allow retrieving a single evento by id.
- **FR-007**: System MUST allow searching eventos by textual match on theme.

#### Lotes

- **FR-008**: Each lote MUST belong to exactly one evento; an evento MAY have many lotes.
- **FR-009**: System MUST require name, price, start date, end date, and quantity when creating a lote.
- **FR-010**: System MUST reject a lote when start date is after end date.
- **FR-011**: System MUST reject a lote when quantity is not greater than zero.
- **FR-012**: System MUST reject a lote when price is not greater than zero.
- **FR-013**: System MUST allow deleting a lote without deleting its parent evento.

#### Palestrantes

- **FR-014**: System MUST allow creating, updating, deleting, and listing palestrantes (name, mini curriculum, image, phone, email).
- **FR-015**: System MUST allow searching palestrantes by name.
- **FR-016**: System MUST allow searching palestrantes by the theme of associated eventos.
- **FR-017**: System MUST support many-to-many participation between eventos and palestrantes (an evento has many palestrantes; a palestrante participates in many eventos).

#### Redes Sociais

- **FR-018**: System MUST allow multiple redes sociais (name + URL) per evento.
- **FR-019**: System MUST allow multiple redes sociais (name + URL) per palestrante.
- **FR-020**: Each rede social MUST be owned by either an evento or a palestrante.

#### Usuário & Autenticação

- **FR-021**: System MUST support user registration with name, username, email, and password, enforcing unique email and required password.
- **FR-022**: System MUST support sign-in that issues an access credential the client uses for subsequent authorized requests.
- **FR-023**: System MUST allow authenticated users to edit profile and change password.
- **FR-024**: System MUST deny unauthenticated access to evento edit, palestrante edit, and profile maintenance areas.
- **FR-025**: Authenticated clients MUST attach the user’s access credential to authorized requests automatically for the duration of the session.

### Key Entities

- **Evento**: Organization event (theme, location, date, participant count, batch label/reference, image, phone, email). Owns many Lotes and many Redes Sociais; linked to many Palestrantes.
- **Lote**: Sales batch for one Evento (name, price, start date, end date, quantity).
- **Palestrante**: Speaker profile (name, mini curriculum, image, phone, email). Linked to many Eventos; owns many Redes Sociais.
- **EventoPalestrante**: Association between one Evento and one Palestrante (many-to-many).
- **Rede Social**: Named URL link owned by either an Evento or a Palestrante.
- **User**: Account identity (name, username, email, password) used for authentication and profile maintenance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An organizer can complete create → list → theme search → edit → delete for an evento in under 5 minutes without assistance.
- **SC-002**: Theme search returns every evento whose theme contains the search text and zero false negatives for the documented sample set (e.g. searching “Angular” returns all three Angular-named sample events).
- **SC-003**: 100% of lote submissions that violate date order, non-positive quantity, or non-positive price are rejected with a clear validation message.
- **SC-004**: After deleting an evento, zero orphan lotes or redes sociais for that evento remain.
- **SC-005**: An organizer can associate the same palestrante with at least two eventos and see the relationship from both sides.
- **SC-006**: 90% of first-time organizers successfully complete lote creation for an existing evento on the first valid attempt.
- **SC-007**: Unauthenticated users cannot complete protected edit/profile actions; authenticated users can complete login → maintain evento → manage lotes → manage redes → relate palestrantes → consult evento as one continuous flow.
- **SC-008**: Duplicate-email registration fails in 100% of attempts; successful login yields a reusable access credential for protected operations.

## Out of Scope *(mandatory for ProEventos)*

- Inscrições / registration of attendees
- Pagamento / payment processing
- Emissão de ingressos / ticket issuance
- Validação de capacidade do evento against lote quantities or participant count (no sell-out / overbooking engine)
- Workflow de aprovação de eventos ou palestrantes
- Página Contatos
- Premium / heavy UI redesign (clean didactic UI only)
- External identity providers / SSO beyond the didactic shared-API credential flow required by this feature

## Cross-Frontend Parity *(when UI work is included)*

| Frontend              | In this feature? | Notes                                                                 |
|-----------------------|------------------|-----------------------------------------------------------------------|
| Vue (`Front-Vue`)     | yes              | Same Evento / Lote / Palestrante / Rede Social / auth behaviors via shared API |
| React/Next.js         | yes              | Same behaviors; no client-only business rules                         |
| Angular               | yes              | Same behaviors including register, login, profile, and protected edit routes |

## Assumptions

- This specification consolidates the canonical business rules for the ProEventos study platform; it does not introduce tickets, payments, capacity enforcement, or approval workflows.
- All clients consume the same ProEventos HTTP API (no per-frontend backends).
- Business validations (required fields, lote date/price/quantity rules, cascade on evento delete, unique email) are enforced by the shared API, not duplicated as divergent frontend-only rules.
- Image on Evento and Palestrante is optional on create unless already required by existing API contracts.
- “Lote” on the Evento attribute list is understood as related sales batches (collection), not a single scalar field on Evento.
- Theme search is partial textual match on theme; exact ranking/order is unspecified and may follow current API order.
- Same-day lote start and end dates are allowed; only start-after-end is invalid.
- Deleting a palestrante clears participation links but does not delete eventos.
- Constitution v2.0.0 allows Identity/auth for this feature; register, login, profile, password change, and protection of edit/profile routes are delivery requirements with cross-frontend parity.
- Read-only consultation of public lists may remain available without authentication unless planning later tightens that rule; write/edit/profile flows require authentication.
- Temporary gaps in frontend parity, if any appear during implementation planning, must be listed with an explicit catch-up plan.
