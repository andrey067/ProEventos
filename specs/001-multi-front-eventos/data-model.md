# Data Model: 001-multi-front-eventos

Domain entities already live under `Back/src/ProEventos.Domain/Entities`. This feature upgrades the stack and completes API coverage; core fields remain unless noted.

## Entity Relationship Overview

```text
Evento 1──* Lote
Evento 1──* RedeSocial (EventoId set)
Palestrante 1──* RedeSocial (PalestranteId set)
Evento *──* Palestrante  (via Palestrante_Evento)
```

## Evento

| Field | Type | Rules |
|-------|------|--------|
| Id | int | PK, identity |
| Local | string | optional |
| DataEvento | DateTime? | optional; DTO may serialize as string for forms |
| Tema | string | required; length 3–50 |
| QtdPessoas | int | range 1–120000 |
| ImagemURL | string | optional; if set, must match image extension pattern (gif/jpg/jpeg/bmp/png) |
| Telefone | string | required; phone format |
| Email | string | required; email format |
| CreateAt / UpdateAt | DateTime? | from BaseEntity |
| Lotes | collection | optional include |
| RedeSociais | collection | optional include |
| PalestrantesEventos | collection | join rows |

**Notes**:
- Drop or ignore `UserId` on DTOs for this feature (auth deferred); do not require user ownership filters.
- Theme search matches `Tema` (contains/equals — document chosen behavior in services; prefer case-insensitive contains for study UX).

## Lote

| Field | Type | Rules |
|-------|------|--------|
| Id | int | PK |
| Nome | string | required for save |
| Preco | decimal | >= 0 |
| DataIncio | DateTime | keep existing spelling in persistence for migration stability; consider DTO alias `DataInicio` only if fronts already expect it — prefer consistent API field `dataIncio` matching current DTO unless a breaking rename is explicitly done in all clients |
| DataFim | DateTime | >= DataIncio recommended |
| Quantidade | int | >= 0 |
| EventoId | int | required FK |

**State / operations**: PUT `/lotes/{eventoId}` upserts the provided list for that evento (existing service pattern).

## Palestrante

| Field | Type | Rules |
|-------|------|--------|
| Id | int | PK |
| Nome | string | required |
| MiniCurriculo | string | optional |
| ImagemURL | string | optional; same image pattern as Evento when set |
| Telefone | string | optional/required per DTO validation chosen at implementation — align with Evento strictness where practical |
| Email | string | email format when set |
| RedeSociais | collection | optional include |
| PalestrantesEventos | collection | join |

**Notes**: Current `PalestranteDto` is incomplete (missing Nome, etc.). Complete DTO to match entity fields needed by UI forms.

## RedeSocial

| Field | Type | Rules |
|-------|------|--------|
| Id | int | PK |
| Nome | string | required (e.g. Instagram, YouTube) |
| URL | string | required; absolute URL preferred |
| EventoId | int? | set when owner is Evento |
| PalestranteId | int? | set when owner is Palestrante (ensure FK exists on entity/config if missing) |

**Invariant**: Exactly one owner must be set (Evento **or** Palestrante), not both and not neither, for owner-scoped endpoints.

## Palestrante_Evento

| Field | Type | Rules |
|-------|------|--------|
| Id | int | PK |
| PalestranteId | int | FK |
| EventoId | int | FK |

**Scope**: Keep relationship in persistence. Explicit UI for linking palestrantes↔eventos is optional for this study slice; not required for parity screens listed in the spec.

## Validation Summary

- Prefer DataAnnotations on DTOs (already started on `EventoDto`) + Minimal API automatic validation / manual `Results.ValidationProblem`.
- API returns 400 for validation failures; 204/404 for missing resources (pick one convention in contracts and apply consistently — **recommended: 404 for missing id on mutating ops, 204 or empty for empty lists**).

## Migration Impact

- Target `net8.0` + EF Core 8 packages.
- Add `PalestranteId` on `RedeSocial` if not mapped today.
- Complete Palestrante/RedeSocial services + repositories as needed.
- Seed data may remain; refresh if schema changes require it.
