# Harness Code — pipelines e triggers

Duas pipelines. Playwright só na **main** (trigger + guard no YAML).

## 1) Cadastrar pipelines

| Name | YAML path | O quê roda |
|------|-----------|------------|
| `ci` | `.harness/ci.yaml` | Coverlet + 3 fronts + baselines |
| `e2e` | `.harness/e2e.yaml` | Playwright Vue + React + Angular |

Espelhos: `.harness/pipelines/ci.yaml` e `.harness/pipelines/e2e.yaml` (mesmo conteúdo).

## 2) Triggers (UI)

Triggers são **por pipeline**. Não misture.

### Pipeline `ci` → trigger `pr`

| Event | |
|-------|--|
| Branch Created / Updated | off |
| **PR Created / Updated / Reopened** | **on** |
| PR Closed | off |
| **PR Merged** | **off** (deixar só no `e2e`) |
| Tags | off |

### Pipeline `e2e` → trigger `main`

| Event | |
|-------|--|
| Branch Created | off |
| **Branch Updated** | **on** (ideal: filtrar branch `main` se a UI permitir) |
| PR Created / Updated / Reopened / Closed | off |
| **PR Merged** | **on** |
| Tags | off |

No seu print, o trigger `pr` ainda tem **Pull Request Merged** ligado — **desmarque**
nessa pipeline `ci`. Merged fica só no trigger `main` da pipeline `e2e`.

## 3) Guard no YAML

`.harness/e2e.yaml` pula a execução se detectar PR (`DRONE_PULL_REQUEST` /
`DRONE_BUILD_EVENT=pull_request`) ou branch ≠ `main`. É rede de segurança se o
trigger estiver errado.

## 4) Fluxo

```text
PR aberto/atualizado  → pipeline ci   (sem Playwright)
merge / push em main  → pipeline e2e  (Playwright 3 fronts)
                      → (opcional) também rode ci em main se quiser
```

## 5) Branch protection

Em `main`: require check **`ci`** nos PRs. Exija **`e2e`** só se quiser bloquear
merge até E2E passar (aí E2E teria que rodar no PR — hoje E2E é pós-main).

Detalhes: [`docs/harness-ci.md`](../docs/harness-ci.md).
