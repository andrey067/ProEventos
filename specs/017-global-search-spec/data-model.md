# Data Model: 017-global-search-spec

No new persisted tables or columns. This feature adds **query-time** concepts and Domain specification types.

## Existing entities (search surfaces)

### Evento

| Field | In global search? | Notes |
|-------|-------------------|-------|
| Id | No | Ordering / identity |
| Tema | Yes | Contains, case-insensitive |
| Local | Yes | |
| Email | Yes | |
| Telefone | Yes | |
| ImagemURL | No | URL noise |
| DataEvento, QtdPessoas | No | Non-text / not requested |
| Lotes, RedeSociais, joins | No | Not flattened into text search |

### Palestrante

| Field | In global search? | Notes |
|-------|-------------------|-------|
| Nome | Yes | |
| MiniCurriculo | Yes | |
| Email | Yes | |
| Telefone | Yes | |
| ImagemURL | No | |
| UserId | No | |
| Evento.Tema (via Palestrante_Evento) | Yes | Any linked evento theme |

## Query / API models (not persisted)

### ListSearchQuery

| Field | Type | Validation |
|-------|------|------------|
| q | string? | Optional; trim; whitespace → treat as absent |
| page | int? | Existing pagination defaults |
| pageSize | int? | Existing allowed sizes / clamps |

**Derived term resolution (server)**:

1. If `q` has non-whitespace text → use trimmed `q`.
2. Else Eventos: use legacy `tema` if present.
3. Else Palestrantes: use legacy `nome` if present, else `tema`.
4. Else → no search specification.

## Specification types (Domain)

### ISpecification\<T\>

| Member | Purpose |
|--------|---------|
| Criteria | `Expression<Func<T, bool>>` applied with `Where` |

### EventoGlobalSearchSpecification

- **Input**: non-empty `term` (already trimmed).
- **Criteria**: OR of Contains on Tema, Local, Email, Telefone (normalized lower).
- **State**: immutable; no transitions.

### PalestranteGlobalSearchSpecification

- **Input**: non-empty `term`.
- **Criteria**: OR of Contains on Nome, MiniCurriculo, Email, Telefone, OR `PalestrantesEventos.Any(pe => pe.Evento.Tema.Contains(...))`.
- **State**: immutable.

## Client UI state (per list screen)

| Field | Notes |
|-------|-------|
| searchInput | Bound to text box; updates on every keystroke |
| debouncedTerm / pending timer | 350 ms; drives API `q` |
| page, pageSize, totalPages | Existing pagination |
| loading / error | Existing |

**Transitions**:

- `typing` → after 350 ms idle → `load(q)`
- `submit` → cancel timer → `load(q)` immediately
- `clear` → reset input → cancel timer → `load()` without `q`
- `response older than latest request id` → ignore

## Validation rules

- Term matching is partial (`Contains`), case-insensitive.
- No minimum length required (single character allowed); empty after trim disables filter.
- No maximum enforced beyond normal query-string limits.
