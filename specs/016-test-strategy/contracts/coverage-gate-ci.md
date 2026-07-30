# Contract: Coverage Gate Commands & CI

**Feature**: `016-test-strategy`  
**Kind**: Local developer CLI + CI workflow contract (not an HTTP API)  
**Enforcement**: Process / job exit code — `0` pass, non-zero fail when any required coverage dimension &lt; 90%, when a unit drops below its baseline, or when tests fail  
**Supersedes**: `specs/002-coverage-gate/contracts/local-coverage-gate.md` (80%, local-only, no CI)

This feature does not change the ProEventos OpenAPI surface.

---

## 1. Backend — solution coverage gate

### Command

```bash
dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings
```

Working directory: repository root (or adjust relative paths). Equivalent: `dotnet test Back/src/ProEventos.sln` when Coverlet MSBuild props are active on each test project.

### Required behavior

| Condition | Exit |
|-----------|------|
| All Coverage Units’ included assemblies meet ≥90% line, branch, and method (Coverlet) | `0` |
| Any included scope below 90% on a required dimension | non-zero |
| Unit/integration test assertions fail | non-zero (even if coverage would pass) |

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

- Solution-wide blended average as the pass criterion
- Excluding individual production service files to clear the gate

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
lines >= 90
functions >= 90
branches >= 90
statements >= 90
```

### Include / exclude

- **Include**: `src/**/*.{ts,tsx,vue}` (as applicable per app)
- **Exclude**: `*.d.ts`, `**/test-setup.ts`, `**/test/setup.ts`, `*.css` (and approved equivalents only)

### Required behavior

| Condition | Exit |
|-----------|------|
| All four dimensions ≥ 90 | `0` |
| Any dimension &lt; 90 | non-zero |
| Spec failures | non-zero |

---

## 3. CI workflow contract

### Triggers

- Every **pull request** targeting the default branch (and other protected branches if configured)
- Every **push** to `main` (default branch)

### Required jobs (logical)

| Job | Must run | Fail when |
|-----|----------|-----------|
| Backend coverage | always | `dotnet test` / Coverlet non-zero |
| Front-Vue coverage | always | `pnpm test:coverage` non-zero |
| Front-React coverage | always | same |
| Front-Angular coverage | always | same |
| Baseline compare | after coverage artifacts available | any unit &lt; baseline or &lt; 90 |
| E2E critical journeys | always (may be separate workflow) | Playwright non-zero |

### Artifacts

Each coverage job SHOULD upload machine-readable reports (Cobertura and/or Vitest JSON summary) for the compare step and for humans.

### Merge readiness

A PR is **not** merge-ready under this contract if any required job fails—even when all assertions would pass without the coverage collector.

---

## 4. Coverage baseline ratchet

### File

`quality/coverage-baselines.json` — one entry per Coverage Unit id with per-dimension floors.

### Compare command (illustrative)

```bash
node quality/compare-coverage.mjs --baselines quality/coverage-baselines.json --reports <paths...>
```

| Condition | Exit |
|-----------|------|
| Every unit ≥ baseline and ≥ 90 on all required dimensions | `0` |
| Any unit below baseline or below 90 | non-zero |

Baselines only increase on `main` (or via explicit maintainer PR) after a successful full suite.

---

## 5. Documentation contract

Consumers MUST find:

1. Backend 90% command in `Back/README.md` and root README pointer.
2. `pnpm test:coverage` (90%) in each Front README.
3. CI described in root README or `docs/testing.md`.
4. Pointer that `016-test-strategy` supersedes `002-coverage-gate` for threshold and CI.
5. Pyramid + “feature/bug requires tests” rules in `docs/testing.md` or `CONTRIBUTING.md`.

---

## 6. Compatibility with plain test scripts

| Script | Role |
|--------|------|
| `dotnet test` (no collect) | Fast feedback; MAY omit coverage fail depending on MSBuild props—documented coverage command remains authoritative for the gate |
| `pnpm test` / `vitest` without `--coverage` | Dev loop; does **not** replace `test:coverage` for the gate |
| Playwright `e2e` | Critical journeys only; does not replace unit coverage % |
