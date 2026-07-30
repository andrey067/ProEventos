# Harness Code — pipeline e triggers (checklist)

Uma única pipeline no repositório. E2E (Vue + React + Angular) é o **último step**
de `.harness/ci.yaml`. Não cadastre pipeline `e2e` separada.

## 1) Cadastrar a pipeline

No repo **Homelab/ProEventos** → **Pipelines** (ou Settings → Pipelines):

| Campo | Valor |
|-------|--------|
| Name / Identifier | `ci` |
| YAML path | `.harness/ci.yaml` |
| Mirror (opcional) | `.harness/pipelines/ci.yaml` (mesmo conteúdo) |

Remova qualquer pipeline apontando para `.harness/e2e.yaml` (arquivo removido).

## 2) Triggers (UI Code — tela Event Categories)

Crie **dois** triggers na pipeline `ci` (ou no repo checks). Renomeie o `default`
se quiser.

### Trigger A — `pr` (obrigatório)

| Setting | Value |
|---------|--------|
| Name | `pr` |
| Disable trigger | **off** |
| Branch Created | off |
| Branch Updated | off |
| **Pull Request Created** | **on** |
| **Pull Request Updated** | **on** |
| **Pull Request Reopened** | **on** |
| Pull Request Closed | off |
| Pull Request Merged | off |
| Tag Created / Updated | off |

Se a UI tiver filtro de branch: **target branch = `main`**.

### Trigger B — `main` (pós-merge / push em main)

| Setting | Value |
|---------|--------|
| Name | `main` |
| Disable trigger | **off** |
| Branch Created | off |
| **Branch Updated** | **on** |
| Pull Request Created / Updated / Reopened | off |
| Pull Request Closed | off |
| Pull Request Merged | **on** (opcional; redundante se Branch Updated em `main` já dispara) |
| Tag Created / Updated | off |

Se a UI tiver filtro de branch: **branch = `main` apenas**.  
Sem filtro: **não** ligue Branch Updated em todas as branches (vira CI em todo push
de feature). Nesse caso use só **Pull Request Merged** no trigger B, ou aceite
Branch Updated só depois de existir filtro.

## 3) Proteção de merge

Em branch rules / required checks para `main`:

- Require check **`ci`** (inclui coverage + E2E dos 3 fronts)

## 4) Fluxo resultante

```text
feature → PR (target main)  → trigger pr  → pipeline ci (quality + e2e)
         merge / push main  → trigger main → pipeline ci de novo
```

Detalhes de schema, DNS (`GITNESS_URL_CONTAINER`) e steps: [`docs/harness-ci.md`](../docs/harness-ci.md).

Stubs Enterprise (não usados pelo Code nativo): `triggers/ci-pr.yaml`,
`triggers/ci-push-main.yaml`.
