# Contributing to ProEventos

## Definition of Done

Before marking work complete:

1. Automated tests cover new or changed behavior (prefer unit, then integration).
2. Bug fixes include a **regression test** that fails without the fix.
3. Each affected project stays at **≥ 90%** coverage and does not drop below `quality/coverage-baselines.json`.
4. No Contatos page or premium redesign work (see constitution).

Details: [`docs/testing.md`](docs/testing.md) and [`specs/016-test-strategy/`](specs/016-test-strategy/).

## Local coverage gates

```bash
dotnet test Back/src/ProEventos.sln
cd Front/Front-Vue && pnpm test:coverage
cd Front/Front-React && pnpm test:coverage
cd Front/Front-Angular && pnpm test:coverage
```

CI runs the same gates on every PR and on `main`.
