# Data Model: 006-eventos-list-ux

Delta over [005 data-model](../005-eventos-domain-rules/data-model.md). Persistence entities stay the same; this feature tightens seed quality, `ImagemURL` rules, and UI-facing list/lote presentation.

## Entity Relationship Overview

```text
Evento 1──* Lote
Evento.ImagemURL ──► Unsplash CDN URL (seeded) ──► list thumbnail column
```

No new tables. No new auth entities.

## Evento (delta)

| Field | Change |
|-------|--------|
| ImagemURL | Optional; when set, MUST be either a filename with image extension **or** an absolute `https://` URL (Unsplash CDN allowed). Used as list thumbnail left of Tema. |
| Seed volume | Study DB MUST contain **≥ 50** eventos after seed (Bogus). |

Other Evento fields unchanged (Tema 3–50, Local, DataEvento, QtdPessoas 1–120000, Telefone, Email, cascades).

## Lote (unchanged rules; UI emphasis)

| Field | Type | Rules |
|-------|------|--------|
| Id | int | PK |
| Nome | string | required; labeled on card |
| Preco | decimal | > 0; labeled |
| DataIncio | DateTime | required; ≤ DataFim; UI label “Data início”; display/edit `dd/MM/yyyy` |
| DataFim | DateTime | required; ≥ DataIncio; UI label “Data fim”; display/edit `dd/MM/yyyy` |
| Quantidade | int | > 0; labeled |
| EventoId | int | FK |

**Seed**: Each seeded evento has 1–3 lotes with coherent date ranges (`DataFim >= DataIncio`).

## Listagem (UI concept — not persisted)

| Attribute | Rules |
|-----------|--------|
| page | 1-based index |
| pageSize | 10 (default), 20, or 30 |
| showImages | boolean; default true; session-only |
| items | slice of eventos for current page |

Pagination is applied on the client after `GET /eventos` or `GET /eventos/tema/{tema}`.

## Validation Summary

| Rule | Enforcement |
|------|-------------|
| ImagemURL extension **or** https URL | API DTO validation (relaxed) |
| Lote DataIncio ≤ DataFim | API `LoteDto` + client form schemas |
| UI dates `dd/MM/yyyy` | Each frontend helper + form controls |
| pageSize ∈ {10,20,30} | Client list controls only |
| ≥50 eventos after seed | Bogus `EventoSeeds` |

## State / transitions

- **Hide images** → `showImages = false` (column hidden; page/search unchanged)
- **Show images** → `showImages = true`
- **Change pageSize** → reset to a valid page (prefer page 1) and re-slice
- **Navigate page** → clamp to `[1, totalPages]`
