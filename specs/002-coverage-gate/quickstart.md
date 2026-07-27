# Quickstart: Validate 80% Coverage Gate

**Feature**: `002-coverage-gate`  
**Purpose**: Prove local coverage commands fail below 80% and pass when suites meet the gate. See [contracts/local-coverage-gate.md](./contracts/local-coverage-gate.md) and [data-model.md](./data-model.md).

## Prerequisites

- .NET SDK matching `Back` TFM (`net10.0`)
- pnpm available
- Dependencies installed once per frontend (`pnpm install` in each `Front/Front-*`)
- Feature implementation complete (Coverlet settings, three backend test projects, Vitest coverage on three fronts)

## 1. Backend gate — expect pass

From repo root (paths as finalized in `Back/README.md`):

```bash
dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings
```

**Expected**: Exit `0`. Coverage for Services, Persistence+Domain, and Api+CrossCutting each ≥ 80% on line/branch/method. Migrations not counted against Persistence.

## 2. Backend gate — fail signal (spot check)

Temporarily comment out a large Services test class **or** add a trivial uncovered public method in `ProEventos.Services` without tests, then re-run the command in §1.

**Expected**: Non-zero exit mentioning threshold failure. Revert the sabotage afterward.

## 3. Frontend gates — expect pass

```bash
cd Front/Front-Vue && pnpm test:coverage
cd Front/Front-React && pnpm test:coverage
cd Front/Front-Angular && pnpm test:coverage
```

**Expected**: Each exits `0` with lines/functions/branches/statements ≥ 80.

## 4. Frontend gate — fail signal (spot check)

In one app, temporarily remove `thresholds` or delete a major page test so coverage drops below 80%; run `pnpm test:coverage`.

**Expected**: Non-zero exit. Restore tests/config.

## 5. Governance checks

```bash
rg -n "Hard coverage %-gates|not coverage %" specs/001-multi-front-eventos/
test ! -e .github/workflows/*coverage* 2>/dev/null || true
ls .github/workflows 2>/dev/null || echo "no workflows dir (OK)"
```

**Expected**: No absolute ban on hard %-gates left without pointing to the 80% local gate; no new CI coverage workflow added by this feature.

## 6. Application stub

```bash
test ! -d Back/src/ProEventos.Application && echo "Application removed (preferred)" || echo "WARN: Application still present — must not be an ungated false unit"
```

**Expected**: Preferred path is directory removed; if still present, it must not be required for solution build and must not weaken the gate story.

## Done

All §§1, 3, 5 pass; §§2 and 4 demonstrated at least once during implementation then reverted.
