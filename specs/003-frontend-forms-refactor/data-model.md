# Data Model: Frontend Forms Best Practices

**Feature**: `003-frontend-forms-refactor`  
**Note**: These are **client form models** (UI + validation). Server entities/DTOs are unchanged. Per-frontend schemas MUST mirror that app’s existing constraints (see [research.md](./research.md) §4); the tables below list the shared field vocabulary.

## Entities

### EventoForm

Represents create/edit of an evento on all three frontends.

| Field | Type (UI) | Required (baseline) | Notes |
|-------|-----------|---------------------|-------|
| id | number | n/a | 0 on create; set on edit |
| tema | string | yes (+ minLength 3 where already enforced) | |
| local | string | yes where already marked | |
| dataEvento | string | yes where already marked | Display format `DD-MM-YYYY` placeholder today |
| qtdPessoas | number | yes where already marked; min 1 | |
| telefone | string | yes where already marked | |
| email | string | yes where already marked | `type=email` where present |
| imagemURL | string | no | |
| lotes | LoteForm[] | no (collection optional) | Dynamic rows |
| redesSociais | RedeSocialForm[] | no | Dynamic rows (naming may be `redes` in Angular UI state) |

**Relationships**: EventoForm 1—N LoteForm; EventoForm 1—N RedeSocialForm.

**State transitions**:
1. Empty defaults (create) → user edits → client validate → API create → navigate list
2. Load by id (edit) → `reset`/`patchValue` → user edits → validate → API update (+ nested saves) → navigate list
3. Load failure → page error; form not treated as successfully loaded

### LoteForm

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | number | n/a | 0 for new rows |
| nome | string | no (current UI) | |
| preco | number | no | |
| quantidade | number | no | |
| dataIncio / dataInicio | string or Date | no | Preserve existing field naming per app/API mapping already in services |
| dataFim | string or Date | no | |
| eventoId | number | set on save | |

### RedeSocialForm

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | number | n/a | |
| nome | string | no | |
| url | string | no | |
| eventoId | number | set on save | |

### PalestranteForm

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | number \| null | edit only | `editingId` pattern on React/Vue |
| nome | string | yes | |
| miniCurriculo | string | no | |
| telefone | string | no | |
| email | string | no / as marked per app | |
| imagemURL | string | no | if present in model |

**State transitions**: empty → create; load row → edit; cancel → empty; success → empty + reload list.

### EventoSearchForm

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tema | string | no | Empty means unfiltered / default list behavior |

## Validation rules (client)

Centralize per app under `forms/schemas` (React/Vue Zod) or `forms/validators` (Angular). Do **not** invent rules beyond current UI.

Suggested Zod shape (illustrative; adapt messages to existing copy):

- `tema`: `z.string().trim().min(3)` when minlength already exists; else `.min(1)` if only `required`
- `email`: `z.string().email()` only where `type="email"` / existing check exists; else non-empty string if required
- `qtdPessoas`: `z.coerce.number().min(1)` where min=1 exists
- arrays: `z.array(loteSchema)` with soft loteSchema (all optional fields)

Angular: `Validators.required`, `Validators.minLength(3)`, `Validators.min(1)`, `Validators.email`, plus reusable custom validators for trim/min length.

## Persistence mapping

Unchanged: map form values → existing service methods (`eventoService.create/update`, `loteService.save`, `redeSocialService.save*`, `palestranteService.create/update`). No new entities on the server.
