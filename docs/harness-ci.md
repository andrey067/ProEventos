# Harness CI for ProEventos

GitHub already runs checks via `.github/workflows/ci.yaml` and `e2e.yaml`
(extension **`.yaml`**, not `.yml`). Harness Code does **not** execute those
GitHub Actions files. Put pipelines under `.harness/` using the **Harness Open
Source / Harness Code native** schema so PR checks auto-discover and run.

## Schema (critical)

Harness Code expects:

```yaml
version: 1
kind: pipeline
spec:
  stages:
    - name: …
      type: ci
      spec:
        steps:
          - name: …
            type: run
            spec:
              container: alpine
              script: …
```

Do **not** use Enterprise Harness CI YAML (`pipeline:`, `orgIdentifier`,
`PLACEHOLDER_*`, `account.harnessImage`, nested `stage.spec.execution`). That
format fails to parse on Harness Code and the check shows **Errored in 0s**
without starting.

Reference: [Harness Open Source pipelines](https://developer.harness.io/docs/open-source/pipelines/steps/run/).

## Canonical paths (`.yaml`)

| Path | Purpose |
|------|---------|
| `.harness/ci.yaml` | Backend Coverlet + Vue/React/Angular coverage + baseline compare |
| `.harness/e2e.yaml` | Playwright Vue smoke (API + Vue) |
| `.harness/pipelines/ci.yaml` | Same CI pipeline (duplicate for layouts that expect `pipelines/`) |
| `.harness/pipelines/e2e.yaml` | Same E2E pipeline |
| `.harness/triggers/*.yaml` | Legacy Enterprise trigger stubs (optional; not used by native Code runner) |

Harness Code auto-discovers **`.harness/ci.yaml`** and **`.harness/e2e.yaml`**.

## Runtime notes

- Workspace is shared across steps in a stage (coverage files from backend/front
  steps remain available for `compare-coverage.mjs`).
- Images are public (`dotnet/sdk:10.0`, `node:22-bookworm`, Playwright jammy).
- E2E installs .NET 10 via `dotnet-install.sh` inside the Playwright image, starts
  API `:5050` and Vue `:5173`, then runs `playwright test --project=vue`.

## Parity with GitHub

Commands match the GitHub workflows as closely as possible:

- `dotnet test Back/src/ProEventos.sln --configuration Release`
- `pnpm test:coverage` in each Front
- `node quality/compare-coverage.mjs ...`
- Playwright `--project=vue` with API on `:5050` and Vue on `:5173`
