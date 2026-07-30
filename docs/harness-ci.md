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
        clone:
          depth: 50
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

One Harness Code pipeline is configured in the UI against the **root** file
below. Keep it native (`version: 1` / `kind: pipeline`) with real steps — never
reintroduce Enterprise YAML or a hello-world stub.

| Path | Purpose |
|------|---------|
| `.harness/ci.yaml` | **Configured pipeline `ci`** — Coverlet + front coverage + baselines, then Playwright E2E for **Vue + React + Angular** |
| `.harness/pipelines/ci.yaml` | Identical mirror of `.harness/ci.yaml` |
| `.harness/triggers/*.yaml` | Legacy Enterprise trigger stubs (optional; not used by native Code runner) |

There is **no** separate `.harness/e2e.yaml`: E2E runs as the last step
(`e2e_all_fronts`) after the quality gate in the same pipeline.

Edit the root file and copy into `pipelines/` so both layouts stay in sync.
Harness Code binds the UI pipeline to **`.harness/ci.yaml`**.

## Clone DNS failure (`Could not resolve host: harness.homelab.local`)

### Root cause

Pipeline clone runs **inside a Docker container** spawned by Harness. The clone
URL is built from **`GITNESS_URL_CONTAINER`** (not from pipeline YAML):

`{GITNESS_URL_CONTAINER}/git/{space}/{repo}.git`

If that hostname is the public UI host (`harness.homelab.local`) and the runner
container has no DNS for `*.homelab.local`, clone fails immediately:

```text
fatal: unable to access 'http://harness.homelab.local/git/Homelab/ProEventos.git/':
Could not resolve host: harness.homelab.local
```

Open Source pipeline YAML **cannot** override the clone hostname. The `clone`
block only supports `depth`, `disabled`, `insecure`, and `trace`
([reference](https://developer.harness.io/docs/open-source/reference/pipelines/yaml/clone/)).
There is no `extra_hosts` / `hostAliases` / clone-URL field in-repo.

### Fix (required on the Harness host)

Keep the public UI base as `harness.homelab.local`, but point **container clone
traffic** at a hostname the runner can resolve.

#### Option A — same Docker network (recommended behind Traefik / compose)

1. Find the Harness container name and its network:

```bash
docker ps --format '{{.Names}}\t{{.Networks}}' | grep -i harness
# example: harness → traefik / homelab
```

2. Add (or update) env on the Harness / Gitness container, then recreate it:

```bash
# Use the real container name and compose network name from step 1.
# Do NOT quote the network list value in compose (quotes become part of the name).

GITNESS_URL_BASE=http://harness.homelab.local   # or https://… for browser/UI
GITNESS_URL_CONTAINER=http://harness:3000         # container DNS name:port
GITNESS_CI_CONTAINER_NETWORKS=homelab             # network shared with Harness
```

Example `docker-compose` snippet:

```yaml
services:
  harness:
    image: harness/harness   # or harness/gitness
    container_name: harness
    networks: [homelab]
    environment:
      GITNESS_URL_BASE: http://harness.homelab.local
      GITNESS_URL_CONTAINER: http://harness:3000
      GITNESS_CI_CONTAINER_NETWORKS: homelab
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - harness-data:/data
```

Docs: [Configurations](https://developer.harness.io/docs/open-source/installation/settings/)
(`GITNESS_URL_CONTAINER`, `GITNESS_CI_CONTAINER_NETWORKS`).

#### Option B — publish port + `host.docker.internal` (default path)

If HTTP is published on the Docker host (e.g. `-p 3000:3000`):

```bash
GITNESS_URL_CONTAINER=http://host.docker.internal:3000
# GITNESS_CI_CONTAINER_NETWORKS not required for this path
```

Harness already injects `host.docker.internal:host-gateway` into CI containers on
Linux. Confirm the port matches `GITNESS_HTTP_PORT` (default `3000`).

#### Option C — make `harness.homelab.local` resolve inside Docker

Only if you insist on cloning via the public hostname:

- Point Docker/`extra_hosts` / CoreDNS / dnsmasq so `harness.homelab.local`
  resolves to an IP reachable from CI containers (often the gateway or proxy),
  **or**
- Add a host entry on the Docker host and ensure nested containers inherit it
  (compose `extra_hosts`, Docker daemon DNS, etc.).

YAML alone cannot inject `--add-host` into the clone container.

### Verify

After recreating Harness:

```bash
docker inspect harness --format '{{range .Config.Env}}{{println .}}{{end}}' \
  | grep GITNESS_URL
# Expect GITNESS_URL_CONTAINER=http://harness:3000 (or host.docker.internal)
# and GITNESS_URL_BASE still pointing at harness.homelab.local for the UI
```

Re-run a PR check. Clone log should fetch from the container URL, not fail on
`harness.homelab.local` DNS.

### Clone ref note (`+refs/heads/main:`)

Harness chooses the fetch ref from the **execution context** (PR head vs branch),
not from `.harness/*.yaml`. Seeing `git fetch origin +refs/heads/main:` means
that run was a **branch/main** build (or the check was not bound to the PR head).
There is no in-repo YAML knob to force `refs/pull/N/head`. After DNS works, if a
PR check still clones `main` only, inspect the check association in the Harness
UI / PR checks — not the pipeline clone block.

## Runtime notes

- Scripts use POSIX `set -eu` (no `pipefail`). Harness Code still runs steps
  with `/bin/sh` (dash) even when `shell: bash` is set, so avoid bashisms.
- Workspace is shared across steps in a stage (coverage files from backend/front
  steps remain available for `compare-coverage.mjs`).
- Images are public (`dotnet/sdk:10.0`, `node:22-bookworm`, Playwright jammy).
- E2E installs .NET 10 via `dotnet-install.sh` inside the Playwright image, starts
  API `:5050` and Vue `:5173`, fails fast if either never becomes ready, then runs
  `playwright test --project=vue`.
- Stages use `clone.depth: 50` for a shallow fetch once DNS/container URL works.
  Retries are not configurable in the Open Source `clone` schema (platform logs
  “Cloning with 0 retries”).

## Parity with GitHub

Commands match the GitHub workflows as closely as possible:

- `dotnet test Back/src/ProEventos.sln --configuration Release`
- `pnpm test:coverage` in each Front
- `node quality/compare-coverage.mjs ...`
- Playwright `--project=vue` with API on `:5050` and Vue on `:5173`
