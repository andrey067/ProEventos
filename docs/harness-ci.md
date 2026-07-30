# Harness CI for ProEventos

GitHub already runs checks via `.github/workflows/ci.yaml` and `e2e.yaml`
(extension **`.yaml`**, not `.yml`). Harness Code does **not** execute those
GitHub Actions files. Use the Harness pipeline YAML under `.harness/` with
Harness CI + triggers so PRs on `harness.homelab.local` get the same gates.

## Canonical paths (`.yaml`)

| Path | Purpose |
|------|---------|
| `.harness/ci.yaml` | Backend Coverlet + Vue/React/Angular coverage + baseline compare |
| `.harness/e2e.yaml` | Playwright Vue smoke (API + Vue) |
| `.harness/pipelines/ci.yaml` | Same CI pipeline (duplicate for Git Experience layouts) |
| `.harness/pipelines/e2e.yaml` | Same E2E pipeline |
| `.harness/triggers/ci-pr.yaml` | Run CI on PR → `main` |
| `.harness/triggers/ci-push-main.yaml` | Run CI on push to `main` |
| `.harness/triggers/e2e-pr.yaml` | Run E2E on PR → `main` |

Prefer importing **`.harness/ci.yaml`** and **`.harness/e2e.yaml`**.

## One-time setup (UI)

1. **Connector**  
   Create a Harness Code connector that can clone `Homelab/ProEventos`.

2. **Import pipelines**  
   - Pipelines → Create Pipeline → YAML  
   - Paste `.harness/ci.yaml` (then `.harness/e2e.yaml`)  
   - Replace:
     - `PLACEHOLDER_ORG`
     - `PLACEHOLDER_PROJECT`
     - `PLACEHOLDER_CODE_CONNECTOR`  
   - If you do not use Harness Cloud runners, change `runtime` to your
     Kubernetes/Docker delegate runtime.

3. **Import triggers**  
   - Open each pipeline → Triggers → New Trigger → YAML  
   - Paste the matching file under `.harness/triggers/`  
   - Align `orgIdentifier`, `projectIdentifier`, `pipelineIdentifier`, `repoName`.

4. **Required checks (optional but recommended)**  
   In the Code repo (or project) branch protection / merge checks, require
   `proeventos_ci` (and optionally `proeventos_e2e`) before merge.

5. **Verify**  
   Open or push to a PR against `main` on Harness Code and confirm the pipeline
   starts and reports status on the PR.

## Runtime notes

- CI steps share the workspace in one stage so Cobertura + Vitest summaries
  remain on disk for `compare-coverage.mjs`.
- Image refs use `account.harnessImage` + public images (`dotnet/sdk:10.0`,
  `node:22-bookworm`, Playwright). Point `connectorRef` at your Docker Hub /
  mirror connector if the default is unavailable.
- Homelab without Harness Cloud: switch `runtime.type` to `Kubernetes` (or
  Docker) and set your delegate infra.

## Parity with GitHub

Commands match the GitHub workflows as closely as possible:

- `dotnet test Back/src/ProEventos.sln --configuration Release`
- `pnpm test:coverage` in each Front
- `node quality/compare-coverage.mjs ...`
- Playwright `--project=vue` with API on `:5050` and Vue on `:5173`
