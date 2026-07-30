# Feature Specification: Global Search (Specification Pattern + Debounce)

**Feature Branch**: `017-global-search-spec`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "a busca deve ser global, vamos adotar o specification pattern para concentrar a busca. planeje para implementar o debounce na busca."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Global text search on Eventos list (Priority: P1)

As an organizer browsing eventos, I type a single search term and see results that match that term across relevant evento fields (not only theme). Pagination and page size continue to work with the filtered set.

**Why this priority**: Today list search is theme-only (`tema`); a single global term is the primary product improvement and the driver for concentrating filter logic on the server.

**Independent Test**: Seed eventos with distinct values in theme, location, email, and phone; search with a fragment that matches only location (or only email); confirm the matching rows appear and non-matching rows do not. Confirm empty search returns the unfiltered paged list.

**Acceptance Scenarios**:

1. **Given** eventos whose themes, locations, emails, or phones contain different text, **When** the organizer searches with a term that appears only in location, **Then** only eventos whose searchable fields contain that term (case-insensitive partial match) are returned.
2. **Given** a non-empty search that matches some eventos, **When** the organizer changes page or page size, **Then** pagination applies to the filtered total and the `Pagination` header reflects the filtered counts.
3. **Given** a search term with no matches, **When** the list loads, **Then** the body is an empty array and pagination shows zero items (not an error).
4. **Given** an empty or whitespace-only search term, **When** the list loads, **Then** results match the unfiltered paged list behavior.

---

### User Story 2 - Global text search on Palestrantes list (Priority: P1)

As an organizer browsing palestrantes, I type a single search term and see results that match across relevant palestrante fields (name and related text fields), with the same pagination behavior as eventos.

**Why this priority**: Parity with eventos list search; palestrantes today filter by separate `nome` / `tema` params.

**Independent Test**: Seed palestrantes with distinct names and mini-currículo text; search with a fragment that matches only mini-currículo; confirm correct rows. Empty term restores full paged list.

**Acceptance Scenarios**:

1. **Given** palestrantes with distinct names and mini-currículos, **When** the organizer searches with a term present only in mini-currículo, **Then** matching palestrantes are returned.
2. **Given** a search term that matches via associated evento theme (existing capability), **When** the organizer uses the same global search input, **Then** those palestrantes remain discoverable through the global term (theme of linked eventos is part of the global match set for palestrantes).
3. **Given** empty search, **When** the list loads, **Then** unfiltered paged results are returned.

---

### User Story 3 - Debounced search while typing (Priority: P1)

As a learner using any of the three frontends, when I type in the list search box the UI waits briefly after I pause typing before calling the API, so each keystroke does not fire a request. Submitting the form (Enter / search button) still searches immediately. Clearing the search reloads the full list promptly.

**Why this priority**: Global search without debounce would spam the API; debounce is required UX for typing-driven search on all three apps.

**Independent Test**: On each frontend list (Eventos and Palestrantes), type several characters quickly and observe a single (or near-single) request after the pause; press Enter and observe an immediate request; clear and observe reload.

**Acceptance Scenarios**:

1. **Given** the Eventos (or Palestrantes) list search input, **When** the user types continuously without pausing longer than the debounce interval, **Then** the API is not called for every keystroke; a request runs after the pause.
2. **Given** pending debounced input, **When** the user submits the search form (Enter or explicit search control), **Then** the search runs immediately (debounce is cancelled/flushed).
3. **Given** a filled search term, **When** the user clears the search, **Then** the list reloads without waiting the full debounce interval for “empty” (clear is immediate).
4. **Given** Vue, React, and Angular list screens, **When** the same typing/submit/clear journeys are performed, **Then** debounce timing and request behavior are equivalent (same interval, same immediate-submit/clear rules).

---

### User Story 4 - Concentrated search rules via Specification pattern (Priority: P2)

As a contributor maintaining the API, global search criteria for Eventos and Palestrantes live in dedicated Specification types applied by repositories, so filter logic is not duplicated across endpoint handlers, services, and ad-hoc `Where` clauses.

**Why this priority**: Didactic architecture goal named by the requester; enables one place to evolve which fields are searchable.

**Independent Test**: Inspect that paged list queries apply named specifications for the search term; unit/integration tests cover match/no-match for each documented field without requiring UI.

**Acceptance Scenarios**:

1. **Given** a non-empty search term on `GET /eventos`, **When** the query is built, **Then** filtering is expressed through an Evento search specification (not inline-only criteria scattered in the endpoint).
2. **Given** a non-empty search term on `GET /palestrantes`, **When** the query is built, **Then** filtering is expressed through a Palestrante search specification.
3. **Given** a change to which fields are searchable, **When** the specification is updated, **Then** list endpoints pick up the new rules without rewriting pagination plumbing.

---

### Edge Cases

- Whitespace-only terms are treated as no filter.
- Very long terms are accepted; if no field contains them, result is empty (no server error).
- Concurrent typing: only the latest term after debounce (or after submit) should drive the visible list; stale responses must not overwrite newer results (clients cancel or ignore outdated responses).
- Special characters in the term are treated as literal text (no regex injection); SQL/EF parameterization remains intact.
- Legacy `tema` path/query for eventos and `nome`/`tema` for palestrantes: see Assumptions — prefer a single global term query param without breaking existing clients during transition.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support a single global search term on Eventos list that matches (case-insensitive contains) across: Tema, Local, Email, Telefone (and ImagemURL only if product later requires it — default **exclude** binary/URL noise; ImagemURL out of match set).
- **FR-002**: System MUST support a single global search term on Palestrantes list that matches across: Nome, MiniCurriculo, Email, Telefone, and associated Evento.Tema.
- **FR-003**: Global search MUST compose with existing server-side pagination (`page`, `pageSize`, `Pagination` response header).
- **FR-004**: Empty / whitespace search MUST behave as unfiltered paged list.
- **FR-005**: Search criteria for Eventos and Palestrantes MUST be encapsulated using the Specification pattern in the Domain (or Persistence) layer and applied by repositories when building list queries.
- **FR-006**: All three frontends (Vue, React, Angular) MUST debounce list search input before calling the API; recommended interval **300–400 ms** (exact value documented in plan/research and shared conceptually across apps).
- **FR-007**: Form submit and clear-search MUST trigger list reload immediately (bypass or flush debounce).
- **FR-008**: Frontends MUST use one search query parameter for the global term on list requests (see contract); UI labels may say “Buscar” without implying theme-only.
- **FR-009**: API contract remains shared — no per-frontend search semantics.
- **FR-010**: Automated tests MUST cover specification matching for Eventos and Palestrantes and debounce/immediate-submit behavior on each frontend list (or a shared-pattern unit test plus one list integration per app).

### Key Entities *(include if feature involves data)*

- **Evento**: existing entity; searchable text fields Tema, Local, Email, Telefone.
- **Palestrante**: existing entity; searchable text fields Nome, MiniCurriculo, Email, Telefone; related Evento.Tema via join.
- **Search term (query)**: optional string; not persisted; drives Specification + pagination.
- **ISpecification&lt;T&gt; / concrete specs**: non-persisted domain helpers that express `Expression`/`Criteria` for EF queries.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Searching a known unique location fragment returns all and only eventos with that location text (sample seed set, zero false negatives for that fragment).
- **SC-002**: Searching a known unique mini-currículo fragment returns the expected palestrante(s).
- **SC-003**: On each frontend, rapid typing of a 6+ character term produces at most one in-flight list request for the final term after pause (plus any immediate submit), verified in manual or automated timing checks.
- **SC-004**: Contributors can point to one Evento and one Palestrante specification type as the sole place that defines global match fields.
- **SC-005**: Vue, React, and Angular Eventos and Palestrantes lists all expose debounced global search with equivalent user-visible behavior.

## Assumptions

- “Global” means multi-field text match for a single term within each list resource — not a cross-resource unified search page (no single “search everything” screen).
- Prefer query param name `q` (or `termo`) for the global term; during implementation, deprecate field-specific `tema`/`nome` filters on list endpoints by treating them as aliases of `q` **or** migrate frontends in the same feature so only `q` remains — plan research chooses one approach without leaving divergent clients.
- Debounce is client-side only; no server-side debounce.
- Existing `GET /eventos/tema/{tema}` may remain as a convenience route that applies the same Evento specification with the path segment as the term, or be marked legacy — research decides; frontends use the list endpoint with query param.
- No Contatos; no premium redesign; auth unchanged.
- Specification pattern is a thin didactic implementation (interface + criteria expression + optional And/Or if needed); no third-party Specification library required unless research finds a zero-cost fit already in the stack.
