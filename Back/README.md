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

## Testes e coverage gate (local 90%)

Projetos: `ProEventos.Services.Tests`, `ProEventos.Persistence.Tests`, `ProEventos.Api.Tests` (registrados em `src/ProEventos.sln`).

Cada projeto usa Coverlet (`CollectCoverage=true`) com **Threshold=90** (line, branch, method) e Include por camada:

| Test project | Assemblies no gate |
|--------------|--------------------|
| Services.Tests | `ProEventos.Services` |
| Persistence.Tests | `ProEventos.Persistence` + `ProEventos.Domain` |
| Api.Tests | `ProEventos.Api` + `ProEventos.CrossCutting` |

Exclusões permitidas: `Migrations/**`, `*.Designer.cs`. **Não** excluir Program, Persistence, DI, endpoints ou arquivos de serviço de produção.

```bash
# A partir da raiz do repositório — falha se qualquer Include < 90%
dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings

# Equivalente (Coverlet MSBuild já ativo nos csproj de teste):
dotnet test Back/src/ProEventos.sln
```

Documentação: [`specs/016-test-strategy/`](../specs/016-test-strategy/) (supersede `002-coverage-gate`).

Documentação geral: [README raiz](../README.md)
