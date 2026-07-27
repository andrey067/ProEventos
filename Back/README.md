# Back — ProEventos API

API compartilhada (.NET, Minimal APIs, EF Core + SQLite, Mapster). TFM atual: `net10.0` (SDK do ambiente).

## Rodar

```bash
cd src/ProEventos.Api
cp .env.example .env   # se ainda não existir
dotnet restore
dotnet run
```

Configuração tipada via `.env` (`dotenv.net` em `Program.cs`): connection string, JWT, CORS e `ASPNETCORE_URLS`. Veja `.env.example`.

Scalar: `http://localhost:5050/scalar` (JSON OpenAPI em `/openapi/v1.json`)

## Testes e coverage gate (local 80%)

Projetos: `ProEventos.Services.Tests`, `ProEventos.Persistence.Tests`, `ProEventos.Api.Tests` (registrados em `src/ProEventos.sln`).

Cada projeto usa Coverlet (`CollectCoverage=true`) com **Threshold=80** (line, branch, method) e Include por camada:

| Test project | Assemblies no gate |
|--------------|--------------------|
| Services.Tests | `ProEventos.Services` |
| Persistence.Tests | `ProEventos.Persistence` + `ProEventos.Domain` |
| Api.Tests | `ProEventos.Api` + `ProEventos.CrossCutting` |

Exclusões permitidas: `Migrations/**`, `*.Designer.cs`. **Não** excluir Program, Persistence, DI ou endpoints.

```bash
# A partir da raiz do repositório — falha se qualquer Include < 80%
dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings

# Equivalente (Coverlet MSBuild já ativo nos csproj de teste):
dotnet test Back/src/ProEventos.sln
```

Documentação do contrato: `specs/002-coverage-gate/contracts/local-coverage-gate.md`.

Documentação geral: [README raiz](../README.md)
