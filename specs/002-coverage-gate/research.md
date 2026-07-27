# Research: 80% Coverage Gate

**Feature**: `002-coverage-gate` | **Date**: 2026-07-26

All Technical Context items were resolved from closed plan input; no open NEEDS CLARIFICATION remain.

---

## 1. Backend coverage tooling and fail-below-80

**Decision**: Add `coverlet.collector` to every backend test project. Configure **Threshold=80**, **ThresholdType=line,branch,method**, **ThresholdStat=total** via shared `Back/coverlet.runsettings` and/or per-test-project MSBuild properties (`Coverlet*` / `Threshold*`). Documented command from solution directory:

```bash
dotnet test Back/src/ProEventos.sln --collect:"XPlat Code Coverage" --settings Back/coverlet.runsettings
```

(or equivalent with Coverlet MSBuild props that fail the test host when thresholds are missed). Prefer the approach that **reliably returns non-zero** when any included assembly scope is below 80% (verify during implementation; if collector-only threshold is soft, add `coverlet.msbuild` properties on each test `.csproj`).

**Rationale**: Matches option A (native thresholds). Coverlet exposes line/branch/method natively; **statements** are treated as equivalent to **lines** for Coverlet (tool does not expose a separate statements threshold)—satisfying the spec’s “where the tool exposes” rule.

**Alternatives considered**:
- Report-only Cobertura without threshold fail — rejected (FR-003 requires local fail)
- ReportGenerator + custom script gate — extra moving parts for a study repo
- CI-only gate — out of scope by closed decision

---

## 2. Per-layer Include scopes (not solution blend)

**Decision**: Each test project owns Coverlet **Include** filters so thresholds apply to that coverage unit only:

| Test project | Include assemblies | Exclude |
|--------------|--------------------|---------|
| `ProEventos.Services.Tests` | `[ProEventos.Services]*` | test assemblies only |
| `ProEventos.Persistence.Tests` | `[ProEventos.Persistence]*`, `[ProEventos.Domain]*` | `**/Migrations/**`, `*.Designer.cs` |
| `ProEventos.Api.Tests` | `[ProEventos.Api]*`, `[ProEventos.CrossCutting]*` | none beyond approved minimal set |

When `dotnet test` runs the solution, each test project’s Coverlet run evaluates **its** Include against 80%; a weak Persistence layer cannot hide behind strong Services coverage.

**Rationale**: Implements option 3 (per layer/project) from the spec and the supplied flowchart.

**Alternatives considered**:
- Single blended solution threshold — rejected (hides weak layers)
- One mega test project referencing all assemblies — harder to teach layering; Include filters still needed

---

## 3. Persistence + Domain strategy

**Decision**: New `Back/tests/ProEventos.Persistence.Tests` using **EF Core InMemory** against `DataContext`. Cover `BaseRepository`, `EventoRepository`, `PalestrantesRepository`, `LotesRepository` (correct spelling), and entity behavior exercised through repository CRUD. Exclude Migrations from Include/ExcludeByFile.

**Rationale**: Domain entities are mostly data; covering them via Persistence CRUD keeps Persistence+Domain as one honest unit without a hollow Domain-only test project.

**Alternatives considered**:
- SQLite file DB in tests — slower/flakeier for unit gate
- Separate Domain.Tests with reflection — low teaching value

---

## 4. Api + CrossCutting strategy

**Decision**: New `Back/tests/ProEventos.Api.Tests` with `WebApplicationFactory` + `HttpClient` smoke CRUD for Evento, Lote, Palestrante, RedeSocial endpoint groups. Exercising the host pulls `ConfigureService` / `ConfigureRepository` into the denominator without excluding DI.

**Rationale**: Spec forbids excluding Program/DI/routers; factory tests are the pragmatic way to hit Minimal API maps and CrossCutting registration.

**Alternatives considered**:
- Endpoint unit tests without host — miss DI/Program paths
- Only Mock service tests at Api layer — insufficient for Include=[ProEventos.Api]*

---

## 5. ProEventos.Application stub

**Decision**: **Remove** `Back/src/ProEventos.Application/` (stub `Class1.cs` only). It is **not** referenced by `ProEventos.sln` or other projects today. Do not add it to the coverage gate.

**Rationale**: Avoids false coverage / empty project noise (YAGNI / didactic simplicity).

**Alternatives considered**:
- Minimal test + Include — theater for a dead project
- Leave orphan on disk — confusing for learners; removal preferred

---

## 6. Frontend Vitest coverage gate

**Decision**: For each of `Front-Vue`, `Front-React`, `Front-Angular`:

1. Add `@vitest/coverage-v8`.
2. Script `"test:coverage": "vitest run --coverage"`.
3. Coverage block:

```ts
coverage: {
  provider: 'v8',
  include: ['src/**/*.{ts,tsx,vue}'],
  exclude: [
    'src/**/*.d.ts',
    'src/**/test-setup.ts',
    'src/**/test/setup.ts',
    'src/**/*.css',
  ],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
}
```

4. Expand tests: all HTTP clients (Evento, Lote, Palestrante, RedeSocial, shared http) with mocks; lista/form/detail/palestrantes; login/registro **shell**; nav/menu; App/router wiring; models/utils via use or light asserts.
5. Config files: `Front-Vue/vite.config.ts`, `Front-React/vite.config.ts`, `Front-Angular/vitest.config.ts` + package.json + READMEs.
6. Coverage output: root `.gitignore` already has `**/coverage/`; Angular keeps `/coverage`. No need for duplicate ignores unless a front lacks inheritance—verify Vue/React still ignore locally if they use nested ignore files without root.

**Rationale**: Native Vitest thresholds fail the process below 80% on all four dimensions.

**Alternatives considered**:
- istanbul provider — older; v8 is current Vitest default path
- Soft warnings without thresholds — rejected by FR-003

---

## 7. SpecKit / README governance amendments

**Decision**: Amend `specs/001-multi-front-eventos/spec.md`, `plan.md`, and `research.md` §13 to **adopt** the local 80% gate and remove absolute “Hard coverage %-gates” / “not coverage %” bans, pointing to `002-coverage-gate`. Update root, `Back/README.md`, and each Front README with coverage commands. **Do not** add `.github/workflows`.

**Rationale**: FR-009; prevents conflicting Speckit guidance during reviews.

**Alternatives considered**:
- Leave 001 untouched and only document in 002 — reviewers still hit the ban in 001 out-of-scope
- Constitution MAJOR bump — unnecessary; constitution already allows tests when a feature requests them; 80% is feature-level NFR, not a principle rewrite

---

## 8. Enforcement surface (local only)

**Decision**: Done when:

1. `dotnet test` with coverage settings fails if any included assembly scope &lt; 80%, passes after suites land.
2. `pnpm test:coverage` in each of the three fronts fails &lt; 80% and passes after tests.
3. No CI workflow added.
4. Spec/plan/research (001 + 002) aligned.

**Rationale**: Closed enforcement choice — local commands only.
