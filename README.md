# ProEventos

Projeto de estudo fullstack: **uma API .NET** e **três frontends** (Vue, React/Vite, Angular) no domínio de eventos, para comparar frameworks consumindo o mesmo contrato HTTP.

Cada frontend é **independente**: tem o próprio `package.json` e se instala/executa na própria pasta.

## Estrutura

```text
ProEventos/
├── Back/                      # API .NET (Minimal APIs)
└── Front/
    ├── Front-Vue/             # Vue 3 + Vite + Element Plus  → package.json
    ├── Front-React/           # React + Vite + React Router  → package.json
    └── Front-Angular/         # Angular standalone           → package.json
```

## Pré-requisitos

- .NET SDK (TFM `net10.0`)
- Node.js LTS + **pnpm** (`corepack enable` ou instalador oficial)

## Auth

**Identity/JWT não está implementado.** Telas de login/registro (se existirem) são apenas shell visual.

## Como subir a API

```bash
cd Back/src/ProEventos.Api
dotnet restore
dotnet run
```

- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Scalar (OpenAPI UI): `/scalar`
- Documento OpenAPI: `/openapi/v1.json`

Testes unitários + **coverage gate local 90%** do backend (Coverlet por camada):

```bash
dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings
# ou: dotnet test Back/src/ProEventos.sln
```

Detalhes: `Back/README.md` e `specs/016-test-strategy/` (supersede `002-coverage-gate`).
Also: CI workflows (`.github/workflows/ci.yml`, `e2e.yml`), baselines in
`quality/coverage-baselines.json`, and contributor rules in `CONTRIBUTING.md`.

## Frontends (dev)

Em cada app, entre na pasta e use o `package.json` local:

| App | Porta | Comandos |
|-----|-------|----------|
| Front-Vue | 5173 | `cd Front/Front-Vue && pnpm install && pnpm dev` |
| Front-React | 3000 | `cd Front/Front-React && pnpm install && pnpm dev` |
| Front-Angular | 4200 | `cd Front/Front-Angular && pnpm install && pnpm dev` |

Configure a base URL da API (`http://localhost:5000`) via env (`VITE_API_URL` no Vue/React; `environment.ts` no Angular). Copie `.env.example` onde existir.

Unit tests + **coverage gate 90%** (em cada pasta):

```bash
cd Front/Front-Vue && pnpm test:coverage
cd Front/Front-React && pnpm test:coverage
cd Front/Front-Angular && pnpm test:coverage
```

`pnpm test` continua disponível para feedback rápido sem thresholds.

## Endpoints principais

| Contexto | Rotas |
|----------|--------|
| Evento | `GET/POST /eventos`, `GET/PUT/DELETE /eventos/{id}`, `GET /eventos/tema/{tema}` |
| Lote | `GET/PUT /lotes/{eventoId}`, `DELETE /lotes/{eventoId}/{loteId}` |
| Palestrante | CRUD `/palestrantes` |
| RedeSocial | `/redes-sociais/evento/...`, `/redes-sociais/palestrante/...` |

Detalhes: `specs/001-multi-front-eventos/contracts/openapi.yaml`

## READMEs por pasta

Veja `Back/README.md`, `Front/Front-Vue/README.md`, `Front/Front-React/README.md`, `Front/Front-Angular/README.md`.
