# Contract: Local Coverage Gate Commands

**Feature**: `002-coverage-gate`  
**Kind**: Local developer CLI contract (not an HTTP API)  
**Enforcement**: Process exit code — `0` pass, non-zero fail when any required coverage dimension &lt; 80%

This feature does not change the ProEventos OpenAPI surface. The contract below is what READMEs and quickstart must document.

---

## 1. Backend — solution coverage gate

### Command

```bash
dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings
```

Working directory: repository root (or adjust relative paths). Equivalent documented form from `Back/README.md` MAY use `cd` into `Back/src` as long as the solution file and settings path resolve.

### Required behavior

| Condition | Exit |
|-----------|------|
| All Coverage Units’ included assemblies meet ≥80% line, branch, and method (Coverlet) | `0` |
| Any included scope below 80% on a required dimension | non-zero |
| Unit tests fail assertions | non-zero (even if coverage would pass) |

### Included scopes (logical)

| Test project | Assemblies under gate |
|--------------|----------------------|
| `ProEventos.Services.Tests` | `ProEventos.Services` |
| `ProEventos.Persistence.Tests` | `ProEventos.Persistence`, `ProEventos.Domain` |
| `ProEventos.Api.Tests` | `ProEventos.Api`, `ProEventos.CrossCutting` |

### Exclusions (allowed only)

- Persistence Migrations / `*.Designer.cs`
- Test assemblies themselves

### Non-goals

- No GitHub Actions / Azure Pipelines / other CI workflow is part of this contract.

---

## 2. Frontend — per-app coverage gate

### Commands

```bash
cd Front/Front-Vue && pnpm test:coverage
cd Front/Front-React && pnpm test:coverage
cd Front/Front-Angular && pnpm test:coverage
```

Script definition (each `package.json`):

```json
"test:coverage": "vitest run --coverage"
```

### Required thresholds

```text
lines >= 80
functions >= 80
branches >= 80
statements >= 80
```

### Include / exclude

- **Include**: `src/**/*.{ts,tsx,vue}` (as applicable per app)
- **Exclude**: `*.d.ts`, `**/test-setup.ts`, `**/test/setup.ts`, `*.css` (and approved equivalents only)

### Required behavior

| Condition | Exit |
|-----------|------|
| All four dimensions ≥ 80 | `0` |
| Any dimension &lt; 80 | non-zero |
| Spec failures | non-zero |

---

## 3. Documentation contract

Consumers of this contract (humans / agents) MUST find:

1. Backend command in `Back/README.md` (and root README pointer).
2. `pnpm test:coverage` in each Front README.
3. `specs/001-multi-front-eventos` no longer listing hard %-gates as forbidden; pointer to this feature’s 80% local gate.

---

## 4. Compatibility with existing plain test scripts

| Script | Role |
|--------|------|
| `dotnet test` / `pnpm test` | Fast feedback; MAY omit coverage |
| Commands in §§1–2 | Quality bar for this feature (fail on threshold) |
