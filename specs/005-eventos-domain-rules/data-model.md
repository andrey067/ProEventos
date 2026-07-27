# Data Model: 005-eventos-domain-rules

Canonical entities for this feature. Persistence lives under `Back/src/ProEventos.Domain/Entities` (+ Identity tables). Field rules come from [spec.md](./spec.md); API shapes are in [contracts/](./contracts/).

## Entity Relationship Overview

```text
User (Identity) ── authenticates ──► protected mutating operations

Evento 1──* Lote
Evento 1──* RedeSocial          (EventoId set)
Palestrante 1──* RedeSocial     (PalestranteId set)
Evento *──* Palestrante         (via Palestrante_Evento / EventoPalestrante)
```

## Evento

| Field | Type | Rules |
|-------|------|--------|
| Id | int | PK |
| Tema | string | required; length 3–50 |
| Local | string | required |
| DataEvento | DateTime? / string in DTO | required for create/update per FR-001 |
| QtdPessoas | int | required; range 1–120000 |
| ImagemURL | string | optional; if set, image extension pattern (gif/jpg/jpeg/bmp/png) |
| Telefone | string | required; phone format |
| Email | string | required; email format |
| Lotes | collection | owned; cascade delete with Evento |
| RedeSociais | collection | owned; cascade delete with Evento |
| PalestrantesEventos | collection | join rows |

**Operations**: create, update (theme, local, date, qty, image, phone, email), delete (cascades lotes + redes), list all, get by id, search by tema (case-insensitive contains).

## Lote

| Field | Type | Rules |
|-------|------|--------|
| Id | int | PK |
| Nome | string | required |
| Preco | decimal | **> 0** |
| DataIncio | DateTime | required; persistence spelling kept; must be ≤ DataFim |
| DataFim | DateTime | required; ≥ DataIncio (same day allowed) |
| Quantidade | int | **> 0** |
| EventoId | int | required FK; each lote belongs to exactly one Evento |

**Operations**: upsert list for evento (`PUT /lotes/{eventoId}`); delete one lote without deleting Evento.

## Palestrante

| Field | Type | Rules |
|-------|------|--------|
| Id | int | PK |
| Nome | string | required |
| MiniCurriculo | string | optional |
| ImagemURL | string | optional; same image pattern when set |
| Telefone | string | optional/required aligned with forms — prefer consistent phone format when present |
| Email | string | email format when set |
| RedeSociais | collection | owned |
| PalestrantesEventos | collection | join |

**Operations**: CRUD; search by nome (contains); search by evento tema (via join); delete clears joins, does not delete eventos.

## RedeSocial

| Field | Type | Rules |
|-------|------|--------|
| Id | int | PK |
| Nome | string | required |
| URL | string | required |
| EventoId | int? | set when owner is Evento |
| PalestranteId | int? | set when owner is Palestrante |

**Invariant**: Exactly one owner (Evento **xor** Palestrante).

## Palestrante_Evento (EventoPalestrante)

| Field | Type | Rules |
|-------|------|--------|
| Id | int | PK |
| PalestranteId | int | FK |
| EventoId | int | FK |

**Invariant**: Unique pair (PalestranteId, EventoId) — no duplicate association.

## User (Identity)

| Field | Type | Rules |
|-------|------|--------|
| Id | string | Identity PK |
| Nome / FullName | string | required display name (map from register payload) |
| UserName | string | required |
| Email | string | required; **unique** |
| Password | (hash) | required on register; never returned in API responses |
| PhoneNumber | string | optional if exposed on profile |

**Operations**: register; login → access token; get/update profile; change password (current + new).

## Validation Summary

| Rule | Enforcement |
|------|-------------|
| Evento required fields | DTO annotations + API 400 |
| Lote Preco > 0, Quantidade > 0, dates ordered | DTO annotations / service validation + API 400 |
| Cascade Evento → Lotes/Redes | EF Cascade (verify with tests) |
| Unique email | Identity |
| Duplicate Evento–Palestrante link | Unique index or service guard |
| Mutating domain + profile | JWT `[Authorize]` |

## State / Auth Transitions

```text
Anonymous ──register──► Account exists
Anonymous ──login─────► Authenticated (holds access credential)
Authenticated ──logout / token expiry──► Anonymous (client clears credential)
Authenticated ──change password──► still Authenticated (optional re-login left to implementer)
```

## Migration Impact

- Add Identity schema to same SQLite database.
- Ensure `Local` and lote validations do not break seeds (fix seed generators).
- Keep `DataIncio` column name; no rename required for this feature.
- Optional: unique index on `(PalestranteId, EventoId)`.
