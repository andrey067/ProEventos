# Tasks: Rede Social & Palestrante Parity Gaps

> Derived from [`depara.md`](./depara.md) and [`spec.md`](./spec.md).

## Phase 0 — Foundation (GAP-01)

- [x] T001 Add `UserId` (+ nav `User`) to Evento + EF mapping/migration
- [x] T002 Backfill via `EventoSeeds.AssignOwnerToOrphans`
- [x] T003 JWT UserId on create; owner checks on update/delete
- [x] T004 Owner checks on RedeSocial evento mutations; GET public
- [x] T005 API ownership tests

## Phase 1 — Self-scoped redes (GAP-02) + FE validation (GAP-06)

- [x] T006 Self-scoped `GET|PUT /redes-sociais/palestrante` + `DELETE .../{redeSocialId}`
- [x] T007 Gate on legacy `/palestrante/{id}` mutations
- [x] T008 API self-scoped tests
- [x] T009–T011 nome/url required (Angular/Vue/React)
- [x] T012 Front `getMine`/`saveMine`/`deleteMine`

## Phase 2 — Me + write policy (GAP-03, GAP-04)

- [x] T013 `GET /palestrantes/me`
- [x] T014 Palestrante self-only write; User (organizer) full CRUD
- [x] T015 Service/API tests
- [x] T016 Front helpers

## Phase 3 — Perfil redes (GAP-07)

- [x] T017–T020 Profile redes editor on 3 fronts + tests

## Phase 5 — Evento derived ownership + meus (2026-07-30)

- [x] T022 Lote PUT/DELETE require event owner
- [x] T023 Associate/Disassociate require event owner
- [x] T024 `GET /eventos/meus` paginated + auth
- [x] T025 API/service/persistence tests
