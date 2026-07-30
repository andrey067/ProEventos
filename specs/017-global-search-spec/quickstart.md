# Quickstart: 017-global-search-spec

Validate global search (`q` + Specification) and client debounce end-to-end. Implementation details belong in `tasks.md` after `/speckit-tasks`.

## Prerequisites

- API runnable (`Back/src/ProEventos.Api`) with seeded Eventos/Palestrantes.
- One or more frontends: `Front/Front-Vue`, `Front/Front-React`, `Front/Front-Angular`.
- Contracts: [contracts/openapi.yaml](./contracts/openapi.yaml), [contracts/client-search-behavior.md](./contracts/client-search-behavior.md).
- Field sets: [data-model.md](./data-model.md).

## 1. API — Eventos global `q`

```bash
# From Back solution / Api project as usual for this repo
curl -sD - "http://localhost:5050/eventos?q=UNIQUE_LOCAL_FRAGMENT&page=1&pageSize=10" -o /tmp/eventos.json
```

**Expected**: `200`; `Pagination` header present; body items all match the term in Tema, Local, Email, or Telefone; non-matching themes alone do not exclude a row that matches on Local.

Empty `q`:

```bash
curl -sD - "http://localhost:5050/eventos?page=1&pageSize=10" -o /tmp/eventos-all.json
```

**Expected**: Unfiltered paged list (same as today’s default list).

## 2. API — Palestrantes global `q`

```bash
curl -sD - "http://localhost:5050/palestrantes?q=UNIQUE_CURRICULO_FRAGMENT&page=1&pageSize=10" -o /tmp/pales.json
```

**Expected**: Matches on Nome / MiniCurriculo / Email / Telefone / linked Evento.Tema.

## 3. Backend tests

Run Persistence/Api tests covering Specification criteria and `q` query (exact commands per solution layout after tasks are written).

**Expected**: Exit `0`; cases for match/no-match per documented fields and pagination totals under filter.

## 4. Frontend — debounce (manual)

On each app’s Eventos and Palestrantes list:

1. Open DevTools Network; filter list GETs.
2. Type 6+ characters quickly without pausing → **no** request per keystroke.
3. Pause ≥ 350 ms → **one** request with `q=...`.
4. Change term and press Enter → immediate request; pending debounce cancelled.
5. Clear search → immediate unfiltered request.

**Expected**: Behavior matches [client-search-behavior.md](./contracts/client-search-behavior.md) C-02–C-04.

## 5. Frontend — automated

Run each app’s unit/component tests for list search (fake timers).

**Expected**: Debounce helper/tests pass; services called with `q`.

## 6. Parity spot-check

Same `q` against the same API from Vue, React, and Angular lists → same visible IDs/order for the page.

## Out of scope for this quickstart

- Building Specification class bodies here (see plan/research).
- Cross-resource unified search page.
- Contatos / auth changes.
