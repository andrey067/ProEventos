# Data Model: Test Strategy

This feature does not introduce domain persistence entities. The model is the **quality measurement and policy model** for coverage gates, baselines, and test levels.

## Entities

### Coverage Unit

| Field | Description |
|-------|-------------|
| `id` | Stable key: `services`, `persistence-domain`, `api-crosscutting`, `front-vue`, `front-react`, `front-angular` |
| `kind` | `backend` \| `frontend` |
| `instrumentedTargets` | Assemblies or path globs under measurement |
| `testHarness` | Project or app that produces the coverage run |
| `thresholdPercent` | **90** for every required dimension |
| `requiredDimensions` | Backend: `line`, `branch`, `method` (statements ≡ line). Frontend: `lines`, `branches`, `functions`, `statements` |

**Relationships**: Each Coverage Unit has exactly one Test Harness, zero-or-more Exclusion Rules, and one Baseline Snapshot.

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
- Test assemblies (`[*.Tests]*`)

**Forbidden to exclude**: Program/startup, product UI pages/components, Persistence repositories/`DataContext`, DI registration, routers, and individual production service files (e.g. `AccountService.cs`).

### Coverage Gate Result

| Field | Description |
|-------|-------------|
| `unitId` | Coverage Unit id |
| `dimensions` | Map of dimension → observed percent |
| `passedAbsolute` | `true` iff every required dimension ≥ 90 |
| `passedRatchet` | `true` iff every required dimension ≥ baseline for that unit |
| `passed` | `passedAbsolute` ∧ `passedRatchet` |
| `exitCode` | Non-zero when `passed` is false or tests failed |

**State transitions**:

```text
[Below90] --add real tests--> [AtOrAbove90]
[AtOrAbove90] --regress / untested code--> [Below90]
[AtOrAbove90] --coverage rises on main--> [BaselineRaised]
[BaselineRaised] --PR drops below baseline--> [RatchetFail] (even if still ≥ 90)
[RatchetFail] --restore tests or raise coverage--> [AtOrAbove90]
```

### Baseline Snapshot

| Field | Description |
|-------|-------------|
| `unitId` | Coverage Unit id |
| `dimensions` | Map of dimension → floor percent recorded on main |
| `updatedAt` | ISO date when baseline was last raised |
| `source` | `quality/coverage-baselines.json` |

**Validation**: A PR MUST NOT lower any dimension below the stored baseline. Baselines only move **up** on main (or via explicit maintainer PR).

### Test Level

| Value | Meaning | Typical harness |
|-------|---------|-----------------|
| `unit` | Isolated, fast, deterministic | Services.Tests (mocks); Vitest specs |
| `integration` | Real collaboration among components/deps | Persistence.Tests; Api.Tests |
| `e2e` | Critical user journey across UI + API | Playwright |

Pyramid guidance: ~70% unit / ~20% integration / ~10% e2e by count or effort—**not** a CI fail condition.

### Critical Journey

| Field | Description |
|-------|-------------|
| `id` | Stable key (e.g. `auth-login`, `eventos-list-create`, `palestrantes-list-create`) |
| `steps` | Ordered user-visible steps |
| `frontends` | Vue, React, Angular (all in scope) |
| `apiRequired` | Shared ProEventos API must be running |

### Regression Test

| Field | Description |
|-------|-------------|
| `bugReference` | Issue/PR id or description |
| `testLevel` | Usually `unit` or `integration` |
| `failsWithoutFix` | Must be true when fix is reverted |
| `passesWithFix` | Must be true on the fixed branch |

### Test Harness (catalog)

| Harness | Path | Instruments |
|---------|------|-------------|
| Services.Tests | `Back/tests/ProEventos.Services.Tests` | `ProEventos.Services` |
| Persistence.Tests | `Back/tests/ProEventos.Persistence.Tests` | `ProEventos.Persistence` + `ProEventos.Domain` |
| Api.Tests | `Back/tests/ProEventos.Api.Tests` | `ProEventos.Api` + `ProEventos.CrossCutting` |
| Front-Vue | `Front/Front-Vue` | `src/**/*.{ts,vue}` (minus excludes) |
| Front-React | `Front/Front-React` | `src/**/*.{ts,tsx}` (minus excludes) |
| Front-Angular | `Front/Front-Angular` | `src/**/*.{ts}` (minus excludes) |
| Playwright E2E | `e2e/` | Critical journeys (not counted toward unit coverage %) |

## Validation rules

- Threshold is fixed at **90**; lowering requires a spec amendment.
- New Exclusion Rules outside the approved set are invalid.
- Aggregated multi-unit averages never satisfy a gate.
- `002-coverage-gate` 80% local-only model is **historical**; this model supersedes it.
- Feature work without tests, and bug fixes without a Regression Test, fail process validation even if coverage % still clears 90%.
