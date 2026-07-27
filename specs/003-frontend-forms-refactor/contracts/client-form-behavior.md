# Contract: Client Form Behavior (API Unchanged)

**Feature**: `003-frontend-forms-refactor`  
**Type**: UI / client validation contract  
**HTTP API**: No changes — frontends continue to call existing Evento, Lote, RedeSocial, and Palestrante endpoints with the same payloads and status handling as today.

## Purpose

Define the **stable user-facing form contract** each frontend must preserve after migrating to its locked form stack. Implementers and tests assert against this behavior, not against a new backend surface.

## In-scope screens

| App | Screen | Form role |
|-----|--------|-----------|
| React | `EventoDetailPage` | Evento create/edit + nested lotes/redes |
| React | `PalestrantesPage` | Palestrante create/edit/cancel |
| React | `EventosPage` | Search by tema |
| Vue | `FormularioEvento` | Evento create/edit + nested lotes (+ redes if present) |
| Vue | `PalestrantesPage` | Palestrante CRUD |
| Vue | `EventoLista` | Search by tema |
| Angular | `evento-form` | Evento create/edit + nested lotes/redes |
| Angular | `palestrantes` | Palestrante CRUD |
| Angular | `eventos-list` | Search by tema |

**Explicitly out of contract**: Login stubs, Contatos.

## Behavioral clauses

### C-01 Prefill on edit

**Given** a valid existing resource id, **when** the edit form finishes loading, **then** all previously shown fields are populated with server values (including nested rows already shown today).

### C-02 Client validation before persist

**Given** invalid or empty required fields per that app’s baseline rules, **when** the user submits, **then**:
1. Per-field (or equivalent) validation messages are visible
2. No successful create/update HTTP call is made for that submit

### C-03 Successful save

**Given** valid form data, **when** the user submits, **then** the same service sequence as today runs (evento create/update; nested lote/rede saves when collections are non-empty) and navigation/list refresh matches current UX.

### C-04 Saving guard

**While** `saving` is true, the primary submit control remains disabled (or otherwise non-reentrant) as today.

### C-05 API failure

**Given** client validation passed but the API fails, **then** the existing page-level error message pattern still appears; schemas must not silently swallow the error.

### C-06 Palestrante cancel

**Given** edit mode on palestrantes, **when** the user cancels, **then** the form returns to the empty/create state.

### C-07 Search semantics

**Given** the eventos list search form, **when** tema is submitted (including empty), **then** list filtering matches pre-refactor semantics.

### C-08 Visual stability

**Binding attributes may change**; Tailwind/CSS classes, copy, and section structure must remain visually equivalent (no redesign).

## Non-goals

- New endpoints, DTO fields, or status codes
- Shared npm package across Vue/React/Angular
- Stronger validation than each app already enforced (see [data-model.md](../data-model.md))

## Verification

Automated tests on the screens above plus manual checks in [quickstart.md](../quickstart.md). Coverage gates from `002-coverage-gate` remain in force.
