# Quickstart: Validate Feature-Based Frontend Architecture

**Feature**: `004-feature-based-architecture`  
**Goal**: Prove each frontend matches [contracts/source-layout.md](./contracts/source-layout.md) and that Evento/Palestrante journeys still work after moves.

## Prerequisites

- Shared API running locally (same process you already use for ProEventos)
- Node + **pnpm** available
- One terminal per frontend you validate

## 1. Source-layout checklist (all apps)

Validate against [contracts/source-layout.md](./contracts/source-layout.md) clauses **L-01–L-08**, then for each of `Front/Front-Vue`, `Front/Front-React`, `Front/Front-Angular`:

1. Confirm `components/eventos/` contains list + detail/form screens (L-01).
2. Confirm `components/palestrantes/` contains palestrante screens (L-02).
3. Confirm models area has Evento, Lote, RedeSocial, Palestrante ([data-model.md](./data-model.md)) (L-03).
4. Confirm nav/menu and confirm/modal live under `shared/` (skip pieces the app never had) (L-04).
5. Confirm `forms/` still owns schemas/validators (003) (L-05).
6. Confirm public route paths in the router match pre-change URLs (L-06).
7. Confirm `components/user/` login stubs stay inert (L-07); no Contatos / no `Back/` changes (L-08).

Expected: checklist passes without empty stub folders for missing chrome.

## 2. Build and tests

From each app directory:

```bash
cd Front/Front-Vue && pnpm test && pnpm build
cd Front/Front-React && pnpm test && pnpm build
cd Front/Front-Angular && pnpm test && pnpm build
```

Expected: existing tests pass after import-path updates; production build succeeds.

## 3. Smoke journeys (per frontend)

Start the app (`pnpm start` / `pnpm dev` / `ng serve` as documented in that app), then:

| Journey | Steps | Expected |
|---------|-------|----------|
| Eventos list | Open Eventos | List loads; search/filter still works if present |
| Evento detail/edit | Open an item → change a field → save | Same success/error behavior as before |
| Evento create | Novo evento → valid submit | Creates via API; lands on prior post-save destination |
| Palestrantes | Create / edit / cancel as today | Same list refresh and form reset behavior |
| Shared chrome | Use nav links; trigger delete confirm if available | Nav + dialog still work |
| Login stub | Open login if linked | Still inert (no real auth) |

## 4. Parity glance

Open the three `src/` trees side by side. Expected: same conceptual trio — **components/{domain}**, **models**, **shared** — with framework casing differences only.

## References

- Spec: [spec.md](./spec.md)
- Plan: [plan.md](./plan.md)
- Research: [research.md](./research.md)
- Layout contract: [contracts/source-layout.md](./contracts/source-layout.md)
- Entity fields: [data-model.md](./data-model.md)
