# Testing Strategy (ProEventos)

Authoritative feature: [`specs/016-test-strategy/`](../specs/016-test-strategy/).

## Coverage gate (90% per project)

Each backend coverage unit and each frontend app must independently reach **≥ 90%** coverage. Aggregated averages do not count. CI runs on every PR and on `main`.

Local commands are documented in `Back/README.md` and each `Front/Front-*/README.md`.

## Pyramid

| Band | Share (guidance) | Where |
|------|------------------|--------|
| Unit | ~70% | Services.Tests (mocked); Vitest specs |
| Integration | ~20% | Persistence.Tests; Api.Tests |
| E2E | ~10% | `e2e/` Playwright critical journeys |

Exact ratio is **not** a CI fail condition.

CI: `.github/workflows/ci.yml` (coverage + baselines) and `.github/workflows/e2e.yml` (Playwright, Vue project on CI).

## Definition of Done

- New/changed behavior has automated tests
- Bug fixes include a regression test
- Coverage for each project stays ≥ 90% and does not drop below `quality/coverage-baselines.json`
