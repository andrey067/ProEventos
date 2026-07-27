# Data Model: 80% Coverage Gate

This feature does not introduce domain persistence entities. The “model” is the **coverage measurement model** used by local gates.

## Entities

### Coverage Unit

| Field | Description |
|-------|-------------|
| `id` | Stable key: `services`, `persistence-domain`, `api-crosscutting`, `front-vue`, `front-react`, `front-angular` |
| `kind` | `backend` \| `frontend` |
| `instrumentedTargets` | Assemblies or path globs under measurement |
| `testHarness` | Project or app that produces the coverage run |
| `thresholdPercent` | `80` for every required dimension |
| `requiredDimensions` | Backend: `line`, `branch`, `method` (statements ≡ line). Frontend: `lines`, `branches`, `functions`, `statements` |

**Relationships**: Each Coverage Unit has exactly one Test Harness and zero-or-more Exclusion Rules.

### Exclusion Rule

| Field | Description |
|-------|-------------|
| `pattern` | Glob or Coverlet filter |
| `reason` | Why removed from denominator |
| `allowed` | Must be in the approved set only |

**Approved patterns**:

- EF `Migrations/**`
- `*.Designer.cs`
- `*.d.ts`
- `*.css` / stylesheets
- `test/setup.ts`, `test-setup.ts` (and path equivalents under `src/**`)

**Forbidden to exclude**: Program/startup, pages/views/components that are product UI, Persistence repositories/`DataContext`, DI (`ConfigureService` / `ConfigureRepository`), routers.

### Coverage Gate Result

| Field | Description |
|-------|-------------|
| `unitId` | Coverage Unit id |
| `dimensions` | Map of dimension → observed percent |
| `passed` | `true` iff every required dimension ≥ 80 |
| `exitCode` | Non-zero when `passed` is false |

**State transitions**:

```text
[NotConfigured] --add tooling--> [ConfiguredBelowThreshold]
[ConfiguredBelowThreshold] --add real tests--> [Passing]
[Passing] --regress tests or add untested code--> [ConfiguredBelowThreshold]
```

### Test Harness (catalog)

| Harness | Path | Instruments |
|---------|------|-------------|
| Services.Tests | `Back/tests/ProEventos.Services.Tests` | `ProEventos.Services` |
| Persistence.Tests | `Back/tests/ProEventos.Persistence.Tests` | `ProEventos.Persistence` + `ProEventos.Domain` |
| Api.Tests | `Back/tests/ProEventos.Api.Tests` | `ProEventos.Api` + `ProEventos.CrossCutting` |
| Front-Vue | `Front/Front-Vue` | `src/**/*.{ts,vue}` (minus excludes) |
| Front-React | `Front/Front-React` | `src/**/*.{ts,tsx}` (minus excludes) |
| Front-Angular | `Front/Front-Angular` | `src/**/*.{ts}` (minus excludes) |

## Validation rules

- Threshold is fixed at **80**; lowering requires a spec amendment.
- New Exclusion Rules outside the approved set are invalid.
- `ProEventos.Application` is **not** a Coverage Unit; remove the stub instead of modeling it.
- Login/registro shell files may appear in frontend denominators; covering them does not imply Identity delivery.
