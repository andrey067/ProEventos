# Contract: Frontend Source Layout (Feature Based Architecture)

**Feature**: `004-feature-based-architecture`  
**Type**: Client source-organization / discoverability contract  
**HTTP API**: No changes.

## Purpose

Define the **stable folder and ownership contract** each frontend must satisfy after reorganization so learners recognize the same Feature Based Architecture pattern on Vue, React, and Angular.

## Conceptual layout (all apps)

```text
src/   (Angular: src/app/)
├── components/
│   ├── eventos/          # Evento list + detail/create-edit (+ nested UI)
│   ├── palestrantes/     # Palestrante list/detail/create-edit as offered
│   └── user/             # Inert login/perfil stubs only (if present)
├── models/               # Vue: Models/ — Evento, Lote, RedeSocial, Palestrante
├── shared/               # nav/menu, confirm/modal, other reused chrome
├── forms/                # unchanged ownership from 003 (schemas/validators)
├── services/             # HTTP clients (location unchanged)
└── …                     # router, app entry — thin adapters OK
```

Framework-idiomatic casing (`Models` vs `models`) is allowed. Empty folders for missing chrome (footer/spinner/pagination) MUST NOT be added.

## Ownership clauses

### L-01 Eventos co-location

**Given** an active frontend, **when** a contributor searches for Evento UI screens, **then** list and detail/create-edit live under `components/eventos/` (or equivalent path under that domain folder), not mixed under a flat global `pages/` dump with unrelated domains.

### L-02 Palestrantes co-location

**Given** an active frontend, **when** a contributor searches for Palestrante UI screens, **then** they live under `components/palestrantes/`.

### L-03 Models discoverability

**Given** an active frontend, **when** a contributor opens the models area, **then** Evento, Lote, RedeSocial, and Palestrante types are present and imported by screens/services instead of divergent local duplicates.

### L-04 Shared chrome

**Given** nav/menu and confirm/modal (and any other already-shared chrome), **when** inspecting source, **then** each piece has a single home under `shared/` and feature folders compose it rather than copying it.

### L-05 Forms remain cross-cutting

**Given** validation schemas/factories from the forms refactor, **when** inspecting source, **then** they remain under `forms/` and are imported by feature screens — not relocated into domain folders as part of 004.

### L-06 Routes stable

**Given** existing public URLs and menu labels, **when** reorganization completes, **then** path strings and labels are unchanged; only module import paths may change.

### L-07 User stubs inert

**Given** a `components/user/` (or equivalent) area, **when** the app runs, **then** login/registro remain non-authenticating stubs; no JWT/session product behavior is introduced.

### L-08 No Contatos / no backend

**Given** this feature’s change set, **when** reviewing scope, **then** Contatos UI is not expanded and `Back/` is unmodified.

## In-scope screen inventory (path targets)

| App | Domain | Screens (logical) | Target folder |
|-----|--------|-------------------|---------------|
| Vue | eventos | EventoLista, DetalhesEvento, FormularioEvento, LotesEvento, … | `components/eventos/` |
| Vue | palestrantes | PalestrantesPage / PalestrantesComponent | `components/palestrantes/` |
| Vue | user | login, registrar stubs | `components/user/` |
| React | eventos | EventosPage, EventoDetailPage | `components/eventos/` |
| React | palestrantes | PalestrantesPage | `components/palestrantes/` |
| React | user | LoginPage stub | `components/user/` |
| Angular | eventos | eventos-list, evento-form | `components/eventos/` |
| Angular | palestrantes | palestrantes | `components/palestrantes/` |
| Angular | user | login stub | `components/user/` |

## Explicitly out of contract

- New footer/spinner/pagination implementations
- Moving `services/` into feature folders
- Cross-framework shared UI packages
- API contract or DTO changes
- Visual redesign
