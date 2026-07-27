# Client list & form behavior (006)

Shared UX contract for Vue, React, and Angular. Not an HTTP API — parity checklist for implementers.

## Eventos list

| Behavior | Rule |
|----------|------|
| Image column | Immediately left of **Tema**; thumbnail from `evento.imagemURL` |
| Broken image | Row remains usable; empty/placeholder cell OK |
| Hide/Show | One control toggles image column for whole list; default shown; session state only |
| Page size | Default **10**; selector **10 / 20 / 30** |
| Pagination | Only current page rows rendered; show current page + total pages (or equivalent); prev/next and/or page numbers |
| Empty | Friendly empty message; no fake page numbers |
| Dates | `dataEvento` displayed as **dd/MM/yyyy** |
| Auth | Unchanged from 005 (JWT on mutating calls only — never on Unsplash/CDN image GETs) |

## Evento edit — lote cards

| Behavior | Rule |
|----------|------|
| Layout | One **card per lote** |
| Labels | Every field has a visible label: Nome, Preço, Quantidade, Data início, Data fim (+ any existing fields) |
| Dates | Inputs show/edit **dd/MM/yyyy**; validate Data fim ≥ Data início |
| Validation | Field-level messages on the card; block save when invalid |
| Add lote | Appends a new empty card with the same fields/rules |

## Date helper (per app)

Each frontend implements its own `formatDateBr` / parse helpers — no shared cross-framework package.
