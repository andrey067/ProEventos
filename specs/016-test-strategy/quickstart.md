# Quickstart: Validate Test Strategy (90% + CI)

**Feature**: `016-test-strategy`  
**Purpose**: Prove per-unit ≥90% coverage gates, baseline ratchet, CI wiring, and thin E2E. See [contracts/coverage-gate-ci.md](./contracts/coverage-gate-ci.md), [contracts/test-pyramid-policy.md](./contracts/test-pyramid-policy.md), and [data-model.md](./data-model.md).

## Prerequisites

- .NET SDK matching `Back` TFM (`net10.0`)
- Node.js LTS + pnpm
- Dependencies installed once per frontend (`pnpm install` in each `Front/Front-*`)
- Feature implementation complete (thresholds at 90, CI workflows, baselines, Playwright, constitution Testing amendment)

## 1. Backend gate — expect pass

```bash
dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings
```

**Expected**: Exit `0`. Services, Persistence+Domain, and Api+CrossCutting each ≥ 90% on line/branch/method. `AccountService.cs` is **not** in ExcludeByFile. Migrations not counted against Persistence. Each test project is gated independently (a failure in Services does not “average away” via Persistence/Api).

## 2. Backend gate — fail signal (spot check)

Temporarily remove or skip a large Services test class **or** add an uncovered public method without tests; re-run §1.

**Expected**: Non-zero exit (threshold failure). Revert afterward.

## 3. Frontend gates — expect pass

```bash
cd Front/Front-Vue && pnpm test:coverage
cd Front/Front-React && pnpm test:coverage
cd Front/Front-Angular && pnpm test:coverage
```

**Expected**: Each exits `0` with lines/functions/branches/statements ≥ 90.

## 4. Frontend gate — fail signal (spot check)

In one app, temporarily break coverage (remove a major test or lower thresholds in a throwaway edit); run `pnpm test:coverage`.

**Expected**: Non-zero exit. Restore.

## 5. Baseline ratchet

```bash
node quality/compare-coverage.mjs --baselines quality/coverage-baselines.json --reports <paths-from-local-runs>
```

**Expected**: Exit `0` when current ≥ baselines and ≥ 90. Manually lower one baseline entry’s counterpart (or sabotage coverage) and confirm non-zero; restore.

## 6. CI contract

```bash
test -f .github/workflows/ci.yml
rg -n "pull_request|main|test:coverage|coverlet|90" .github/workflows/
```

**Expected**: Workflow(s) exist for PR + main; jobs invoke the same coverage commands; compare step present. Open a draft PR or use `act`/workflow run if available to confirm red/green behavior.

## 7. E2E critical journeys

```bash
# Start API + one frontend per documented ports, then:
cd e2e && pnpm exec playwright test
```

**Expected**: Auth (if present), Eventos list/create, and Palestrantes list/create pass for the configured frontend project(s). Suite remains small (critical only).

## 8. Governance checks

```bash
rg -n "tests are optional|Threshold>80|> 80|local 80%" .specify/memory/constitution.md Back/README.md README.md Front/Front-*/README.md specs/016-test-strategy/ || true
rg -n "90" .specify/memory/constitution.md Back/coverlet.runsettings Front/Front-Vue/vite.config.ts Front/Front-React/vite.config.ts Front/Front-Angular/vitest.config.ts
```

**Expected**: Constitution Testing clause no longer says tests are globally optional; READMEs and configs cite **90%**; `016` is pointed as superseding `002` for threshold/CI.

## Done

§§1, 3, 5, 6, 7, 8 pass; §§2 and 4 demonstrated once during implementation then reverted.
