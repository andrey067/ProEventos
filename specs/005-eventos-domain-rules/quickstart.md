# Quickstart: 005-eventos-domain-rules

Validate canonical domain rules + auth end-to-end. Details: [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml).

## Prerequisites

- .NET SDK matching `Back/src/global.json` (10.x)
- Node + **pnpm** for frontends
- API reachable at `http://localhost:5000` (or launchSettings URL)

## 1. Run API

```bash
cd Back/src/ProEventos.Api
dotnet run
```

Open Scalar/OpenAPI in Development and confirm tags: Eventos, Lotes, Palestrantes, RedesSociais, Account.

## 2. Domain smoke (anonymous reads OK)

```bash
# List / theme search
curl -s http://localhost:5000/eventos
curl -s http://localhost:5000/eventos/tema/Angular

# Expect: matching temas containing "Angular"; empty array if none
```

## 3. Auth + protected write

```bash
# Register (unique email)
curl -s -X POST http://localhost:5000/account/register \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Organizer","userName":"org1","email":"org1@example.com","password":"Senha@123"}'

# Login → capture token
curl -s -X POST http://localhost:5000/account/login \
  -H 'Content-Type: application/json' \
  -d '{"userName":"org1","password":"Senha@123"}'

# Create evento with Bearer token (required fields per contract)
curl -s -X POST http://localhost:5000/eventos \
  -H 'Authorization: Bearer '"$TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"tema":"Angular Summit","local":"SP","dataEvento":"2026-10-01","qtdPessoas":100,"telefone":"11999999999","email":"evt@example.com"}'

# Without token → 401 on POST/PUT/DELETE
```

## 4. Lote validation

Authenticated `PUT /lotes/{eventoId}` with:

- `preco: 0` or `quantidade: 0` → **400**
- `dataIncio` after `dataFim` → **400**
- valid lote → **200**; `DELETE /lotes/{eventoId}/{loteId}` removes lote only

## 5. Cascade delete

Create evento + lotes + redes → `DELETE /eventos/{id}` (auth) → subsequent GETs for those children return empty/404; no orphans.

## 6. Palestrante search & link

- `GET /palestrantes/nome/{nome}`
- `GET /palestrantes/tema/{tema}`
- Associate palestrante to two eventos; confirm both sides (evento detail / palestrante tema search)

## 7. Frontend parity (each app)

| App | Start | Check |
|-----|-------|-------|
| Vue | `cd Front/Front-Vue && pnpm start` (:5173) | Login → edit evento → lotes/redes → link palestrante → profile |
| React | `cd Front/Front-React && pnpm start` (:3000) | Same journey |
| Angular | `cd Front/Front-Angular && pnpm start` (:4200) | Same journey; guards block edit/profile when logged out |

Expected: interceptor sends Bearer; unauthenticated visit to edit/profile redirects to login; lists remain readable.

## 8. Automated checks

```bash
cd Back && dotnet test
cd Front/Front-Vue && pnpm test
cd Front/Front-React && pnpm test
cd Front/Front-Angular && pnpm test
```

## Pass criteria

- SC-aligned: theme search, lote rejections, cascade, multi-evento palestrante link, auth gate on edits, unique email on register
- Same happy path on all three frontends against one API
