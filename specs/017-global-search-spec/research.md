# Research: 017-global-search-spec

## Decision: Global term query param `q`

**Rationale**: One short, conventional name for “search everywhere in this resource.” Frontends already send `tema` / `nome`; migrating all three to `q` in the same feature keeps the shared contract clear.

**Alternatives considered**:
- Keep `tema` / `nome` and expand match fields under those names — misleading API (theme param matching email).
- Use Portuguese `termo` — fine locally, but `q` is ubiquitous and shorter in OpenAPI examples.
- Dual required params — rejected; single term is the product goal.

**Cutover**: Endpoints accept `q` as primary. If `q` is empty, fall back to legacy `tema` (Eventos) or coalesce `nome`/`tema` (Palestrantes) into the same Specification for one release so older clients do not break mid-migration. Frontends in this feature stop sending field-specific params.

## Decision: Multi-field match sets

**Evento**: `Tema`, `Local`, `Email`, `Telefone` — OR of case-insensitive `Contains` after trim/ToLower.

**Palestrante**: `Nome`, `MiniCurriculo`, `Email`, `Telefone`, OR any linked `Evento.Tema` via `PalestrantesEventos`.

**Rationale**: Matches “busca global” without URL/noise fields (`ImagemURL` excluded). Preserves prior “search palestrante by event theme” capability inside the global term.

**Alternatives considered**:
- Full-text / SQLite FTS5 — overkill for study data and didactic scope.
- Ranked scoring — out of scope; stable `OrderBy Id` remains.

## Decision: Thin Specification pattern in Domain

**Rationale**: User asked to concentrate search in the Specification pattern. Implement:

- `ISpecification<T>` with `Expression<Func<T, bool>> Criteria` (and optional `Includes` only if needed later — not required for this feature).
- `EventoGlobalSearchSpecification(string term)` / `PalestranteGlobalSearchSpecification(string term)`.
- Extension `IQueryable<T>.Where(ISpecification<T> spec)` in Persistence (or Domain if expression-only).
- Repositories call the spec when term is non-empty; empty term skips specification.

Keep And/Or combinators **out** unless a second filter appears — YAGNI.

**Alternatives considered**:
- Ardalis.Specification package — useful but adds dependency for a two-spec feature; didactic hand-roll preferred.
- Service-layer filter after `ToList` — breaks pagination totals and violates server-side paging.
- Specification only in Persistence without Domain types — weaker teaching of the pattern and harder reuse.

## Decision: Debounce 350 ms, client-only

**Rationale**: Common UX sweet spot between 300–400 ms; single shared **conceptual** interval documented here for parity.

| App | Mechanism |
|-----|-----------|
| Angular | `rxjs` `debounceTime(350)` + `distinctUntilChanged` on search control `valueChanges`; `submit` / clear call `load` immediately and cancel pending |
| React | Local `useDebouncedValue` (or equivalent `useEffect` + `setTimeout` cleanup) at 350 ms; form submit/clear bypass |
| Vue | `watch` on search ref with `setTimeout`/`clearTimeout` (no @vueuse in tree); submit/clear bypass |

**Stale responses**: Prefer AbortController / unsubscribe / request-id ignore so an older slow response cannot overwrite a newer term’s results.

**Alternatives considered**:
- Server-side debounce — wrong layer; cannot coordinate three SPAs.
- `useDeferredValue` only (React) — defers render, not network; still need timed API debounce.
- Lodash `debounce` — unnecessary dependency.

## Decision: Legacy path routes

**Rationale**: `GET /eventos/tema/{tema}` and `GET /palestrantes/nome|tema/{…}` remain and apply the **same** global Specification with the path segment as the term (so semantics become “global match using this string,” not theme-only). Document as convenience/legacy. Primary UI uses `GET /eventos?q=` and `GET /palestrantes?q=`.

**Alternatives considered**: Delete path routes immediately — unnecessary churn for study clients/tests; can deprecate later.

## Decision: Testing focus

**Rationale**: Spec FR-010 — Persistence or Domain unit tests assert Expression/criteria against in-memory entities or EF InMemory; Api.Tests assert `q` + Pagination header; frontend tests fake timers for debounce and assert service called once after pause / immediately on submit.

## Resolved clarifications

| Item | Resolution |
|------|------------|
| Param name | `q` (+ legacy fallback) |
| Debounce ms | 350 |
| Spec library | None (hand-rolled) |
| Cross-resource search page | Out of scope |
| ImagemURL in match | Excluded |

## Contributor pointer (SC-004)

Global searchable fields are defined only in:

- `Back/src/ProEventos.Domain/Specifications/EventoGlobalSearchSpecification.cs`
- `Back/src/ProEventos.Domain/Specifications/PalestranteGlobalSearchSpecification.cs`

Repositories apply these via `SpecificationExtensions.Where`; list endpoints resolve `q` / legacy aliases with `SearchTermResolver`.
