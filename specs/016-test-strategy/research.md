# Research: Test Strategy

**Feature**: `016-test-strategy` | **Date**: 2026-07-29

All Technical Context items resolved; no open NEEDS CLARIFICATION remain.

---

## 1. Raise Coverlet / Vitest thresholds from 80 → 90

**Decision**: Update `Back/coverlet.runsettings` and each backend test `.csproj` (`Threshold=90`, `ThresholdType=line,branch,method`, `ThresholdStat=total`). Update each frontend Vitest `coverage.thresholds` to `90` for lines, functions, branches, and statements. Expand real tests until every coverage unit passes.

**Rationale**: Spec FR-001/FR-002/FR-003; reuses the proven `002-coverage-gate` tooling (option A: native thresholds). Coverlet still does not expose a separate “statements” dimension—treat statements ≡ lines for backend (same rule as `002`).

**Alternatives considered**:
- Keep 80% local and only enforce 90% in CI — rejected (local and CI must agree; FR-001 is absolute 90%)
- ReportGenerator + custom percent parse without Coverlet Threshold — extra moving parts
- Aggregate solution-level 90% — rejected by FR-001 (non-aggregated)

---

## 2. Unify backend ThresholdType across test projects

**Decision**: All three test projects use `line,branch,method`. Today `Services.Tests` omits method and `Api.Tests` omits branch—align them.

**Rationale**: FR-002 requires every supported metric; Coverlet supports all three. Inconsistent types hide weak dimensions.

**Alternatives considered**:
- Leave Api without branch because Minimal API maps are hard to branch-cover — rejected; expand Api.Tests instead of weakening the gate

---

## 3. Remove non-approved Coverlet exclusions

**Decision**: Remove `**/AccountService.cs` from `ExcludeByFile` in `coverlet.runsettings`. Keep only Migrations / `*.Designer.cs` (and test assembly excludes). Cover AccountService with Services.Tests (or Api.Tests) as needed to clear 90%.

**Rationale**: FR-014 and `002` approved exclusion set forbid product-code carve-outs. AccountService is production services code.

**Alternatives considered**:
- Keep exclusion “temporarily” — contradicts FR-014 and didactic honesty
- Exclude entire Identity surface — too broad; auth is already in product

---

## 4. CI on pull requests and main

**Decision**: Add `.github/workflows/ci.yml` triggered on `pull_request` and `push` to `main` with jobs:

1. Backend: `dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings`
2. Front-Vue / Front-React / Front-Angular: `pnpm install` + `pnpm test:coverage` (matrix or parallel jobs)
3. Baseline compare job (after coverage artifacts uploaded)

Fail the workflow if any job fails (native threshold or compare script).

**Rationale**: FR-004/FR-005. GitHub Actions matches the repo’s likely host (`origin`); no Azure DevOps assumed.

**Alternatives considered**:
- Pre-commit only — does not gate remote merges
- Codecov/Coveralls as sole gate — external dependency; still need local native thresholds for learners
- Soft “report coverage” without fail — rejected by FR-004

---

## 5. Maintain-or-increase via committed baselines (ratchet)

**Decision**: Store `quality/coverage-baselines.json` with per-unit observed percentages (and dimensions). On `main` success, a job MAY update the file when all units ≥ baselines and ≥ 90% (or maintainers bump via PR when coverage rises). On PRs, `quality/compare-coverage.mjs` (or equivalent shell) fails if any unit’s current % is **below** its baseline **or** below 90%.

**Rationale**: FR-006 without SaaS. Absolute 90% alone allows silent drops from 97%→91%. A ratchet preserves gains.

**Alternatives considered**:
- Diff coverage vs merge-base by re-running base checkout — slow/expensive for three fronts + backend
- Codecov “patch” coverage — vendor lock-in for a study repo
- Review checklist only — not automatic (FR-004 wants automation)

---

## 6. Test pyramid policy (guidance, not CI ratio)

**Decision**: Document in `docs/testing.md` (or `CONTRIBUTING.md`) the 70% unit / 20% integration / 10% E2E guidance. Map existing harnesses:

| Band | Existing / new location |
|------|-------------------------|
| Unit (~70%) | Services.Tests (mocked deps); frontend Vitest component/service specs |
| Integration (~20%) | Persistence.Tests (EF InMemory); Api.Tests (`WebApplicationFactory`) |
| E2E (~10%) | New Playwright suite — critical journeys only |

Do **not** fail CI on exact ratio arithmetic.

**Rationale**: FR-009–FR-012; matches current Back layout; avoids a second brittle percentage gate.

**Alternatives considered**:
- Hard CI check that counts tests by folder — noisy, gameable
- Only unit tests to hit 90% — leaves integration/E2E bands empty vs pyramid

---

## 7. Thin Playwright E2E for critical journeys

**Decision**: Add a root (or `e2e/`) Playwright project. Critical journeys (initial set):

1. Login (or register→login) when auth UI is present against running API
2. Eventos: list + create (happy path)
3. Palestrantes: list + create (happy path)

Run against each frontend base URL via Playwright projects matrix (Vue :5173, React :3000, Angular :4200) with API on the documented port. CI starts API + one frontend per matrix cell (or sequential). Keep &lt; ~10 scenarios total.

**Rationale**: Spec assumptions + FR-012; parity across three fronts for the same journeys.

**Alternatives considered**:
- Cypress — also fine; Playwright chosen for first-class multi-project and CI docs
- E2E only on Vue — fails Cross-Frontend quality parity for journeys
- Exhaustive UI E2E — out of scope / costly

---

## 8. Process rules: features and bug fixes require tests

**Decision**: Amend constitution Architecture Constraints **Testing** from “optional unless requested” to mandatory strategy referencing ≥90% per unit + pyramid (MINOR bump 2.0.0 → 2.1.0). Add contributor checklist: no feature complete without tests; every bug fix includes a regression test. PR template checkbox optional but recommended.

**Rationale**: FR-007/FR-008 and spec Assumptions; constitution is the governance source of truth.

**Alternatives considered**:
- Spec-only policy without constitution change — leaves contradictory “tests optional” text
- MAJOR constitution bump — unnecessary; principles I–V unchanged

---

## 9. Supersede `002-coverage-gate`

**Decision**: Mark `002` artifacts historical in README pointers; document that `016-test-strategy` is authoritative for threshold and CI. Do not delete `002` history; update root/`Back`/Front READMEs to say **90%** and link here.

**Rationale**: FR-013.

**Alternatives considered**:
- Rewrite `002` in place — confuses feature numbering and git history of decisions
- Keep dual 80% local / 90% CI — confusing for learners

---

## 10. Closing the gap to 90%

**Decision**: Implementation tasks MUST include expanding real tests (not exclusions) until each unit passes locally at 90%, then enable CI. Order: remove bad excludes → raise thresholds → fill failures → wire CI → baselines → E2E → constitution/docs.

**Rationale**: Didactic simplicity / no coverage theater; gate without tests would brick the repo.

**Alternatives considered**:
- Lower denominator via broad excludes — forbidden
- Disable gate until green in a long-lived branch without local fail — drifts from FR-001
