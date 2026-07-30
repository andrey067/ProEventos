# ProEventos E2E (Playwright)

Thin end-to-end suite for **critical journeys only** (~10% of the test pyramid):

- `auth-login` — sign in against the shared API (when auth UI is present)
- `eventos-list-create` — list and create Eventos
- `palestrantes-list-create` — list and create Palestrantes

See `specs/016-test-strategy/contracts/test-pyramid-policy.md`.

## Prerequisites

- API running (default `http://localhost:5050` or as in `.env`)
- One frontend running (Vue `5173`, React `3000`, Angular `4200`)

## Commands

```bash
cd e2e
pnpm install
pnpm exec playwright install
pnpm test
```
