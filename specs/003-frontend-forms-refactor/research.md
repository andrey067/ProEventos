# Research: Frontend Forms Best Practices

**Feature**: `003-frontend-forms-refactor`  
**Date**: 2026-07-26

All locked stacks come from the feature request / spec Assumptions. This document records how to apply them inside ProEventos without changing behavior or UI.

---

## 1. React — React Hook Form + Zod

**Decision**: Use `useForm` with `zodResolver`, `defaultValues`, `register` for native inputs, `useFieldArray` for lotes/redes, and `Controller` only if a future controlled widget appears (none required for current native inputs). Infer types via `z.infer<typeof schema>`. Keep `loading` / `saving` / `error` / list data in `useState` (not input mirrors).

**Rationale**: Matches community default for React 19 + TypeScript; minimizes re-renders vs per-field `useState`; centralizes validation; aligns with FR-002.

**Alternatives considered**:
- Formik — heavier, less current community preference for new work
- Native controlled state only — status quo; rejected by locked decision
- Yup instead of Zod — locked decision requires Zod

**Patterns for this codebase**:
- `EventoDetailPage`: one schema with nested `lotes` / `redesSociais` arrays (or sibling arrays reset into the form); `reset(loaded)` after fetch
- `PalestrantesPage`: small schema; `reset(empty)` on cancel; `reset(row)` on edit
- `EventosPage` search: tiny optional `tema` schema (empty string allowed)

---

## 2. Vue — VeeValidate + Zod + v-model

**Decision**: Use VeeValidate Composition API (`useForm`, `useField`) with Zod via `@vee-validate/zod` (`toTypedSchema`) when wiring schemas. Keep Element-less plain inputs with `v-model` bound to field values from VeeValidate. Remove hand-rolled `fieldErrors` + `validate()` in `FormularioEvento.vue`.

**Rationale**: Locked stack; Composition API already used; Zod reuses the same rule shapes as React for didactic comparison (duplicated per app, not shared package).

**Alternatives considered**:
- Element Plus `el-form` rules only — couples validation to UI kit; Vue app currently uses plain inputs + Tailwind
- vuelidate — older pattern; locked decision is VeeValidate
- Manual `ref` + watchers — status quo partially; rejected

**Patterns**:
- `useForm({ validationSchema: toTypedSchema(eventoSchema) })` + `defineField` / `useField` per input
- Dynamic lotes: `useFieldArray` (VeeValidate) or manage array through form values API consistently
- Strip unnecessary `watch` that only copies fields

---

## 3. Angular — Reactive Forms

**Decision**: Replace `FormsModule` / `[(ngModel)]` on in-scope screens with `ReactiveFormsModule`, `FormBuilder`, `FormGroup`, `FormArray`, and shared validators under `src/app/forms/validators`. Use `formControlName` / `formArrayName` / `formGroupName`. Keep templates’ Tailwind classes identical.

**Rationale**: Locked decision; Angular already depends on `@angular/forms`; Reactive Forms are the maintained teaching path for complex/nested forms.

**Alternatives considered**:
- Keep template-driven — rejected by FR-004
- Signal forms (experimental) — too new / unstable for didactic baseline; defer
- Third-party Angular form libs — unnecessary; YAGNI

**Patterns**:
- `eventoForm = this.fb.group({ …, lotes: this.fb.array([]), redes: this.fb.array([]) })`
- Reusable validators: e.g. `minTrimmedLength(3)` mirroring Vue’s tema minlength
- On load: `patchValue` / rebuild `FormArray` from API entities
- Search: single `FormControl` or small `FormGroup` on list page

---

## 4. Validation baseline (parity without new business rules)

**Decision**: Encode only constraints already present in UI or client code today:

| Surface | Existing constraints (baseline) |
|---------|----------------------------------|
| Evento.tema | required; min length 3 (Vue HTML + `fieldErrors`; Angular/React HTML `required` where present) |
| Evento.local | required; min length 3 where already in Vue |
| Evento.dataEvento | required where already marked |
| Evento.qtdPessoas | required; min 1 where present |
| Evento.telefone / email | required; email input type where present |
| Evento.imagemURL | optional |
| Lote / Rede rows | no hard required in current UIs — keep optional; do not invent requiredness |
| Palestrante.nome | required (HTML) |
| Palestrante other fields | optional unless already required |
| Search tema | optional string |

**Rationale**: FR-006 forbids new domain rules. Prefer schema messages that match existing copy when one exists (e.g. Vue “Tema deve ter ao menos 3 caracteres”).

**Alternatives considered**: Unifying all three apps onto the strictest rule set — rejected (would change Angular/React behavior relative to today). Instead, each app schemas mirror **that app’s** current constraints; cross-app teaching parity is “same fields / journeys,” not identical minlength everywhere unless already aligned.

---

## 5. Dependencies & packaging

**Decision**:
- React: `pnpm add react-hook-form zod @hookform/resolvers`
- Vue: `pnpm add vee-validate zod @vee-validate/zod`
- Angular: no new package; import `ReactiveFormsModule` (or `formControl*` standalone imports per Angular 21 style already used)

**Rationale**: Spec FR-008; keep versions current stable compatible with each app’s TS/Vite/Angular major.

---

## 6. Nested collections strategy

**Decision**: Keep nested lotes/redes editors on Evento screens. Use field-array primitives (RHF `useFieldArray`, VeeValidate field array, Angular `FormArray`). Persist via existing `loteService` / `redeSocialService` save flows unchanged.

**Rationale**: Behavior preservation; SC-001.

**Alternatives considered**: Extract separate route per lote — out of scope UX change.

---

## 7. Testing strategy

**Decision**: Prefer testing user-visible behavior (fill, submit, error text, service calls). Update selectors if they relied on `ngModel`/`value` wiring. Do not drop coverage below `002-coverage-gate` thresholds; add focused schema unit tests only when they cheaply cover validation branches.

**Rationale**: FR-011 + coverage gate.

---

## 8. Out of scope confirmation

**Decision**: Do not migrate Login stubs into real forms; do not touch Contatos; do not change backend.

**Rationale**: Constitution + FR-012.

---

## Resolved clarifications

No open `NEEDS CLARIFICATION` items remain from Technical Context. Locked stacks and validation baseline above close planning unknowns.
