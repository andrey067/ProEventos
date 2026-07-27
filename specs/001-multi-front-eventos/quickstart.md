# Quickstart: 001-multi-front-eventos

Validate the multi-frontend study stack end-to-end. Implementation details live in `tasks.md`; this guide proves the feature works.

## Prerequisites

- .NET SDK (TFM `net10.0`)
- Node.js (LTS) + **pnpm**
- Browser

Contract reference: [contracts/openapi.yaml](./contracts/openapi.yaml)  
Domain reference: [data-model.md](./data-model.md)

## Suggested ports

| Process | Port |
|---------|------|
| API HTTP | `5000` |
| API HTTPS | `5001` |
| Front-Vue | `5173` |
| Front-React | `3000` |
| Front-Angular | `4200` |

Set each frontend API base URL to `http://localhost:5000` (or `https://localhost:5001` if trusting the dev certificate).

## 1. Start the API

```bash
cd Back/src/ProEventos.Api
dotnet restore
dotnet run
```

**Expect**: Scalar UI opens (or browse `/scalar`). OpenAPI JSON em `/openapi/v1.json`. No Identity screens required.

### Smoke: Evento CRUD (Scalar ou curl)

1. `GET /eventos` → `200` array  
2. `POST /eventos` with valid tema/telefone/email/qtdPessoas → created body with `id`  
3. `PUT /eventos/{id}` changing `tema` → updated tema persisted  
4. `GET /eventos/tema/{tema}` → includes the evento  
5. `DELETE /eventos/{id}` → success; follow-up GET by id → `404`

**Regression check**: POST must create (not update); PUT must update (not delete).

### Smoke: Lotes + Redes + Palestrantes

1. Create an evento; `PUT /lotes/{eventoId}` with one lote; `GET /lotes/{eventoId}` returns it  
2. `PUT /redes-sociais/evento/{eventoId}` with one rede; GET returns it  
3. `POST /palestrantes`; `PUT /redes-sociais/palestrante/{id}`; list/get/delete work  

## 2. Front-Vue

```bash
cd Front/Front-Vue
cp .env.example .env
pnpm install
pnpm dev
```

**Expect**: Lista de eventos loads from API; create/edit (lotes + redes), search, delete work; palestrantes list/form work; login/registro (if present) do not call auth APIs. Porta **5173**.

## 3. Front-React

```bash
cd Front/Front-React
cp .env.example .env
pnpm install
pnpm dev
```

**Expect**: Same functional flows as Vue on `/eventos`, `/eventos/:id`, `/palestrantes`. Porta **3000**. Env: `VITE_API_URL`.

## 4. Front-Angular

```bash
cd Front/Front-Angular
pnpm install
pnpm dev
```

**Expect**: Same functional flows as Vue/React. Porta **4200**. API URL em `src/environments/environment.ts`.

## 5. CORS check

From each frontend origin, open DevTools Network while listing eventos:

- Request succeeds (not blocked by CORS)
- `Access-Control-Allow-Origin` reflects that frontend origin

## 6. Unit tests (required)

No live API needed for these suites (dependencies mocked).

### Backend

```bash
cd Back
dotnet test
```

**Expect**: All tests green; Evento service suite covers create vs update vs delete (regression of inverted Controller bugs).

### Frontends (cada um no próprio `package.json`)

```bash
cd Front/Front-Vue && pnpm test
cd Front/Front-React && pnpm test
cd Front/Front-Angular && pnpm test
```

**Expect**: Service tests (HTTP mocked) + at least one UI unit test per app pass.

## 7. Docs check

- Root `README.md` lists structure, prereqs (pnpm), how to run API + each front **from its folder**, unit tests, short endpoint table, auth-not-implemented note  
- `Back/README.md` and each `Front/Front-*/README.md` explain how to run **and test** that piece  

## Done criteria (manual)

- [ ] API happy paths for Evento/Lote/Palestrante/RedeSocial pass in Scalar  
- [ ] Evento POST/PUT regression fixed  
- [ ] All three frontends complete eventos + palestrantes CRUD against the same API  
- [ ] Backend `dotnet test` passes  
- [ ] Front-Vue, Front-React, and Front-Angular unit test scripts pass  
- [ ] No JWT/Identity requirement to use the apps  
- [ ] Contatos not delivered; UI remains didactic (one kit per app)  
- [ ] No cross-front E2E suite required
