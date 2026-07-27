# Data Model: Feature-Based Frontend Architecture

**Feature**: `004-feature-based-architecture`  
**Note**: These are **client entity models** (TypeScript shapes mirroring the shared API). Server entities/DTOs are unchanged. Field lists mirror what frontends already use today — do not invent attributes.

## Placement

| App | Models area |
|-----|-------------|
| Vue | `Front/Front-Vue/src/Models/` |
| React | `Front/Front-React/src/models/` |
| Angular | `Front/Front-Angular/src/app/models/` |

Each app MUST expose discoverable definitions for **Evento**, **Lote**, **RedeSocial**, and **Palestrante**. Prefer one file per entity (plus optional barrel). Screens and services MUST import from this area.

## Entities

### Evento

| Field | Type (client) | Notes |
|-------|---------------|-------|
| id | number | |
| local | string | |
| dataEvento | string | UI/API string as today |
| tema | string | Required for FR-005 baseline |
| qtdPessoas | number | |
| imagemURL | string | |
| telefone | string | |
| email | string | |
| lotes | Lote[] \| optional | Nested on detail/form |
| redesSociais | RedeSocial[] \| optional | Nested on detail/form |
| palestrantes / palestrantesEventos | Palestrante[] \| optional | Preserve existing property name per app |

**Relationships**: Evento 1—N Lote; Evento 1—N RedeSocial; Evento N—N Palestrante (as already represented).

**State transitions**: N/A for this feature (no new lifecycle). Models are relocated/normalized only.

### Lote

| Field | Type | Notes |
|-------|------|-------|
| id | number | |
| nome | string | |
| preco | number | |
| dataIncio | string | Keep existing spelling if API/client already use it |
| dataFim | string | |
| quantidade | number | |
| eventoId | number | |

**Relationships**: belongs to Evento.

### RedeSocial

| Field | Type | Notes |
|-------|------|-------|
| id | number | |
| nome | string | |
| url | string | |
| eventoId | number \| null \| optional | |
| palestranteId | number \| null \| optional | |

**Relationships**: optional parent Evento or Palestrante.

### Palestrante

| Field | Type | Notes |
|-------|------|-------|
| id | number | |
| nome | string | |
| miniCurriculo | string | |
| imagemURL | string | |
| telefone | string | |
| email | string | |
| redesSociais | RedeSocial[] \| optional | |

**Relationships**: may include RedeSocial; may appear nested under Evento.

### User (stub-only, optional)

Present only if the app already has identity stubs (e.g. Vue `Models/identity/User.ts`, `UserLogin.ts`).

| Field | Notes |
|-------|-------|
| existing fields only | Do not expand for authentication product work |

**Relationships**: none for delivery; not part of Eventos CRUD journeys.

## Validation rules

None introduced by this feature. Form validation remains owned by `forms/` (see `003-frontend-forms-refactor`). Models here are structural types, not Zod/Reactive Forms schemas.

## Consistency rules

1. Do not duplicate incompatible Evento/Lote/RedeSocial/Palestrante interfaces inside feature folders.
2. Do not change HTTP payload field names solely to “clean” models.
3. Form-only helper types (e.g. Vue `CadastroEventoForm`) may remain next to models or under `Models/Eventos/` if already present; they are not a substitute for the entity model.
