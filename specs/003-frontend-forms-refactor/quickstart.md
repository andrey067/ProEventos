# Quickstart: Validate Frontend Forms Refactor

**Feature**: `003-frontend-forms-refactor`  
**Purpose**: Prove each frontend’s forms use the locked stack, preserve behavior, and keep tests green. See [contracts/client-form-behavior.md](./contracts/client-form-behavior.md) and [data-model.md](./data-model.md).

## Prerequisites

- Shared API running locally (existing ProEventos API)
- `pnpm` available
- Feature implementation complete (deps installed; forms migrated)
- From each app directory: dependencies installed (`pnpm install`)

## 1. Dependency presence

```bash
cd Front/Front-React && pnpm list react-hook-form zod @hookform/resolvers
cd Front/Front-Vue && pnpm list vee-validate zod @vee-validate/zod
cd Front/Front-Angular && pnpm list @angular/forms
```

**Expected**: Packages present (Angular already had `@angular/forms`).

## 2. Automated tests

```bash
cd Front/Front-React && pnpm test
cd Front/Front-Vue && pnpm test
cd Front/Front-Angular && pnpm test
```

**Expected**: Exit `0`. Form journey tests still assert create/edit/search/validation behavior (C-01–C-07).

Optional coverage (gate from `002-coverage-gate`):

```bash
cd Front/Front-React && pnpm test:coverage
cd Front/Front-Vue && pnpm test:coverage
cd Front/Front-Angular && pnpm test:coverage
```

**Expected**: Still meet ≥80% thresholds.

## 3. Manual — Evento create/edit (each app)

1. Open create evento (`/eventos/new` or Vue equivalent).
2. Submit empty → field errors; no new evento created.
3. Fill valid data (and optional lote row) → save → lands on list; evento exists.
4. Open edit → fields prefilled → change tema → save → list shows update.
5. Confirm layout/classes look unchanged vs pre-refactor screenshots/memory.

Ports (typical): React `3000`, Vue `5173`, Angular `4200`.

## 4. Manual — Palestrantes (each app)

1. Submit empty/invalid → validation feedback; no create.
2. Create valid → appears in list; form resets.
3. Edit → cancel → form empty/create again.

## 5. Manual — Search

1. On eventos list, search by tema fragment → filtered results match prior behavior.
2. Clear/empty search → default list behavior restored.

## 6. Structure / out-of-scope checks

```bash
# Centralized forms area exists per app
test -d Front/Front-React/src/forms && echo OK-react-forms
test -d Front/Front-Vue/src/forms && echo OK-vue-forms
test -d Front/Front-Angular/src/app/forms && echo OK-angular-forms

# Login not turned into real auth (spot-check: still disabled / stub messaging)
rg -n "disabled|estudo|Identity|JWT" Front/Front-React/src/pages/LoginPage.tsx Front/Front-Angular/src/app/pages/login/ || true
```

**Expected**: `forms/` (or `app/forms/`) discoverable; login remains stub; no Contatos feature work.

## Done when

- §§1–5 pass on all three frontends
- Contract clauses C-01–C-08 satisfied
- No backend diff required for this feature
