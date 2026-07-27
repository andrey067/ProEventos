# Quickstart: NetDevPack Identity & Palestrante Roles

**Feature**: `007-netdevpack-identity-roles`  
**Date**: 2026-07-26

Validate the feature end-to-end against [contracts/openapi.yaml](./contracts/openapi.yaml) and [data-model.md](./data-model.md).

## Prerequisites

- .NET SDK matching `Back/src/global.json` (10.x)
- API runnable from `Back/src/ProEventos.Api`
- Config includes NetDevPack `AppJwtSettings` (see `.env.example` after implement) — **not** the old symmetric `Jwt:Key`-only setup

## Setup

```bash
cd Back/src/ProEventos.Api
dotnet restore
dotnet run
```

Default URLs follow `Properties/launchSettings.json` (typically `http://localhost:5000`).

On first run, seeds should ensure:

| UserName       | Role          | Notes                          |
|----------------|---------------|--------------------------------|
| `admin`        | `User`        | Organizer (existing seed + role) |
| `palestrante`  | `Palestrante` | Linked `Palestrante.UserId`    |

(Exact seed passwords: see `IdentitySeeds` after implement — historically `senha123` for admin.)

## Validation scenarios

### 1. Organizer login includes role User

```bash
curl -s -X POST http://localhost:5000/account/login \
  -H 'Content-Type: application/json' \
  -d '{"userName":"admin","password":"<seed-password>"}'
```

**Expect**: `200` with `token`, `roles` containing `"User"`, `palestranteId` null/absent.

### 2. Organizer can write

```bash
TOKEN=<token-from-step-1>
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/eventos \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"tema":"Teste Roles","local":"SP","dataEvento":"2030-01-01T20:00:00","qtdPessoas":10,"lote":"1","imagemURL":"https://example.com/a.jpg"}'
```

**Expect**: `2xx` (subject to existing domain validation).

### 3. Palestrante login is ReadOnly

```bash
curl -s -X POST http://localhost:5000/account/login \
  -H 'Content-Type: application/json' \
  -d '{"userName":"palestrante","password":"<seed-password>"}'
```

**Expect**: `200` with `roles` containing `"Palestrante"` and a numeric `palestranteId`.

```bash
TOKEN_P=<token-from-palestrante-login>
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/eventos \
  -H "Authorization: Bearer $TOKEN_P" \
  -H 'Content-Type: application/json' \
  -d '{"tema":"Should Fail","local":"SP","dataEvento":"2030-01-01T20:00:00","qtdPessoas":10,"lote":"1","imagemURL":"https://example.com/a.jpg"}'
```

**Expect**: `401` or `403` (not created).

### 4. Anonymous GET still works

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/eventos
```

**Expect**: `200`.

### 5. Register speaker provisions User + Palestrante

```bash
curl -s -X POST http://localhost:5000/account/register-palestrante \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Ana Speaker","userName":"ana.speaker","email":"ana@example.com","password":"senha123","miniCurriculo":"Dev"}'
```

**Expect**: `200`, `roles: ["Palestrante"]`, `palestranteId` set.  
Follow-up GET `/palestrantes/{id}` (or list) shows matching `userId`.

### 6. Automated tests

```bash
cd Back
dotnet test tests/ProEventos.Api.Tests --filter "FullyQualifiedName~Account|FullyQualifiedName~Evento"
```

**Expect**: Role-aware cases pass (User write OK; Palestrante write denied; UserId required on Palestrante).

## Out of scope for this quickstart

- Frontend login UI / role-based button hiding (deferred parity)
- SSO / refresh-token flows beyond what NetDevPack wiring enables by default
