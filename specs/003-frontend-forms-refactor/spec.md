# Feature Specification: Frontend Forms Best Practices

**Feature Branch**: `003-frontend-forms-refactor`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Atualizar a implementação dos formulários nos três frontends (React, Vue, Angular) para seguir as melhores práticas atuais de cada framework: React Hook Form + Zod + @hookform/resolvers; Vue com v-model + VeeValidate + Zod; Angular Reactive Forms (FormGroup, FormBuilder, Validators). Remover controle manual de inputs quando possível; manter comportamento, regras de negócio e layout/estilos; organizar schemas/validators/hooks; tipagem forte; adicionar dependências ausentes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and edit Evento with the same outcomes (Priority: P1)

As a learner using any of the three frontends, I create a new evento or edit an existing one (including nested lotes and redes sociais where the screen already supports them). After the forms refactor, I can still fill the same fields, see the same kinds of validation feedback, save successfully against the shared API, and navigate back to the list—without noticing layout or style changes.

**Why this priority**: Evento create/edit is the richest form surface and the primary didactic CRUD journey; if it regresses, the feature fails.

**Independent Test**: On each frontend, open “novo evento”, submit empty/invalid data and confirm field-level errors appear without persisting; submit valid data and confirm create succeeds; open an existing evento, change a field, save, and confirm update succeeds. Visually compare the form chrome to the pre-refactor UI (structure, spacing, classes/styles unchanged).

**Acceptance Scenarios**:

1. **Given** the create-evento screen on React, Vue, or Angular, **When** I submit with missing or invalid required fields, **Then** I see per-field validation messages (or equivalent existing feedback) and no create request succeeds.
2. **Given** valid evento data (and nested lotes/redes when the screen already collects them), **When** I save, **Then** the evento is persisted via the shared API and I land on the same post-save destination as today.
3. **Given** an existing evento detail/edit screen, **When** the page loads, **Then** fields are prefilled with current values (default/initial values) and editing + save updates the same resource as before.
4. **Given** any evento form screen after the refactor, **When** I compare it to the pre-refactor UI, **Then** layout, styling, and visible structure are unchanged (no redesign).

---

### User Story 2 - Manage Palestrantes with the same form behavior (Priority: P1)

As a learner on each frontend that already offers palestrante create/edit, I continue to create, update, cancel edit, and clear the form exactly as today, with validation and errors surfaced through the new form stack—not through ad-hoc input state where a library should own it.

**Why this priority**: Palestrantes is the second major CRUD form and must stay in parity across active frontends.

**Independent Test**: On each frontend with palestrante forms, create a palestrante with valid data; attempt invalid submit; start edit, cancel, and confirm the form resets as today; confirm list refresh behavior is unchanged.

**Acceptance Scenarios**:

1. **Given** the palestrantes screen, **When** I submit invalid or incomplete required fields, **Then** validation errors are shown and no create/update succeeds.
2. **Given** a valid palestrante payload, **When** I submit, **Then** create or update succeeds against the shared API with the same success/reset behavior as today.
3. **Given** I am editing a palestrante, **When** I cancel, **Then** the form returns to the empty/create state as it does today.

---

### User Story 3 - Search/filter forms keep working without manual input plumbing (Priority: P2)

As a learner using list screens that already use a small search form (for example filtering eventos by tema), I can still submit the search and see the same filtered results. The search form uses the same modern form approach as the rest of the app where it is a real `<form>`, without changing filter semantics.

**Why this priority**: Search is thinner than CRUD but still a form surface called out for migration; behavior must not drift.

**Independent Test**: On each frontend list that has a search form, submit an empty search and a tematerm search; confirm result sets match pre-refactor behavior.

**Acceptance Scenarios**:

1. **Given** a list screen with a search form, **When** I submit a tema (or equivalent) filter, **Then** the list shows the same filtered results as before.
2. **Given** that search form, **When** I clear/reset according to current UX, **Then** the list returns to the unfiltered (or previously documented) state.

---

### User Story 4 - Learners see modern, maintainable form patterns per framework (Priority: P2)

As a learner comparing Vue, React, and Angular, I can open each app’s form-related source and find a clear, conventional organization (schemas/validators/hooks or framework-equivalent folders), strong typing, no dead form state, and no duplicated one-off validation logic for the same entity fields within that app.

**Why this priority**: Teaching value is the project’s reason for three frontends; messy or partial migrations defeat the study goal.

**Independent Test**: Review each frontend’s form modules: validation rules for Evento/Palestrante (and nested collections where applicable) live in a central place per app; input-only state is not hand-rolled where the chosen stack provides binding; TypeScript avoids `any` on form values; existing form-related automated tests still pass.

**Acceptance Scenarios**:

1. **Given** the React app, **When** I inspect evento/palestrante (and related) forms, **Then** they follow React’s locked form approach (centralized schemas, form-state errors, inferred types)—not hand-mirrored input state for every field.
2. **Given** the Vue app, **When** I inspect the same journeys, **Then** forms follow Vue’s locked form approach (Composition API form/field helpers, centralized schemas, standard field binding) without unnecessary field-sync watchers.
3. **Given** the Angular app, **When** I inspect the same journeys, **Then** forms follow Angular’s locked reactive approach with reusable validators instead of template-driven binding on those screens.
4. **Given** all three apps after the change, **When** existing automated tests for form flows are run, **Then** they pass without weakening assertions that encode current behavior.

---

### Edge Cases

- What happens when the user submits while a save is already in progress? Saving remains disabled / guarded as today; no double-create.
- What happens when the API returns an error after client validation passed? The existing page-level error message (or equivalent) still appears; field schemas do not invent new business rules to “fix” the server.
- What happens on edit load failure (invalid id / not found)? The same error messaging and non-editable state as today remain.
- What about login/registro stubs? They stay inert and out of scope (constitution Identity/JWT ban); do not turn them into real authenticated forms.
- What about nested dynamic rows (lotes, redes)? Adding/removing rows and binding their fields continue to work; validation covers the same requiredness already implied by the UI (e.g. HTML `required` / existing checks), without new domain rules.
- What if a field had only HTML5 validation before? Behavior MUST remain at least as helpful: either keep equivalent constraints in the schema/validators or preserve HTML constraints without regressing empty-submit feedback.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each active frontend MUST migrate all in-scope data-entry and search forms away from hand-rolled input state toward that frontend’s locked modern form approach (see Assumptions), while preserving current user-visible behavior, persistence outcomes, and navigation.
- **FR-002**: On React, in-scope forms MUST stop using component state solely to mirror each input; validation rules MUST live in centralized schemas; field errors MUST come from form state; initial values MUST be declared explicitly; form value types MUST be inferred from those schemas; controlled-field wrappers MUST be used only when a control cannot bind as an uncontrolled field.
- **FR-003**: On Vue, in-scope forms MUST use Composition API form helpers for form and field state, centralized schemas (schema validation when practical), and standard two-way field binding; watchers that exist only to keep fields in sync with form state MUST be removed.
- **FR-004**: On Angular, in-scope forms MUST use reactive form groups built via a form builder with shared validators (including reusable custom validators where the same rule repeats) and MUST NOT keep template-driven two-way model binding on those migrated screens.
- **FR-005**: Validation rules for Evento, Palestrante, and nested Lote/RedeSocial fields used in forms MUST be centralized and discoverable per frontend under a dedicated forms area (schemas, validators, hooks/helpers, optional shared form UI pieces)—without sharing code packages across frontends.
- **FR-006**: The refactor MUST NOT change business rules, HTTP contracts with the shared API, or invent new client-only domain validations beyond mirroring existing UI constraints and current client checks.
- **FR-007**: The refactor MUST NOT change layout, visual structure, or styles; markup may change only as needed to bind the form approach while preserving appearance.
- **FR-008**: Each frontend MUST obtain any missing libraries required by its locked form approach through that app’s own dependency manifest and package manager; screens MUST actually use those capabilities after migration.
- **FR-009**: Form models and values MUST be strongly typed; dead form state and unused manual input handlers MUST be removed after migration.
- **FR-010**: Form modules MUST separate validation definitions from UI rendering and from submit/side-effects, and MUST avoid duplicating the same validation rule in multiple places within one frontend.
- **FR-011**: Existing automated tests that cover form journeys MUST continue to pass; tests that break only because wiring changed MUST be updated to assert the same user-visible behavior without lowering coverage intent.
- **FR-012**: Identity/login/registro forms and Contatos remain out of scope; stubs MUST NOT be expanded into real auth or contacts flows as part of this feature.

### Key Entities

- **Evento form model**: tema, local, data, quantidade de pessoas, telefone, e-mail, imagem (and any other fields already on the create/edit screens), plus nested **Lote** and **RedeSocial** collections where the screen already edits them.
- **Palestrante form model**: nome, mini currículo, telefone, e-mail (as already collected).
- **Search/filter form model**: list filter fields already present (e.g. tema on eventos list).
- **Validation schema (per frontend)**: centralized description of requiredness, min lengths, and formats already enforced in the UI—not a new domain layer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On all three frontends, a learner can complete create and edit of an Evento (including nested lotes/redes where previously supported) with the same field set and the same success/error outcomes as before the refactor, in a single uninterrupted attempt when data is valid.
- **SC-002**: On all three frontends that expose Palestrante CRUD forms, create, edit, cancel-edit, and validation-on-invalid-submit behave equivalently to the pre-refactor experience (same fields, same persistence results).
- **SC-003**: 100% of pre-existing automated tests for in-scope form user journeys pass after the refactor (or are updated only to match new wiring while preserving behavioral assertions).
- **SC-004**: Spot-check comparison of migrated form screens shows no intentional layout/style redesign (structure and styling tokens/classes preserved aside from binding attributes required by the form libraries).
- **SC-005**: Manual invalid submit on each major form (Evento, Palestrante) shows field-level feedback before any successful persistence, on every frontend.
- **SC-006**: A reviewer can locate centralized validation definitions for Evento and Palestrante in each frontend’s forms area within one minute of opening that app’s `src` tree.
- **SC-007**: No frontend introduces Identity/JWT or Contatos behavior; login stubs remain disabled/inert if present.

## Out of Scope *(mandatory for ProEventos)*

- Identity / JWT (login, registro, tokens, authorization gates)—including upgrading login stubs into working auth forms
- Página Contatos
- Premium / heavy UI redesign (clean didactic UI only); no style system changes
- Backend/API contract changes, new endpoints, or new business rules
- Sharing a cross-framework form package between Vue, React, and Angular
- Changing list/detail navigation IA unrelated to form binding
- Expanding coverage gates or unrelated refactors outside form surfaces

## Cross-Frontend Parity *(when UI work is included)*

| Frontend              | In this feature? | Notes                                                                 |
|-----------------------|------------------|-----------------------------------------------------------------------|
| Vue                   | yes              | Locked Vue form approach; app-local forms organization                |
| React                 | yes              | Locked React form approach; app-local forms organization              |
| Angular               | yes              | Locked Angular reactive form approach; app-local forms organization   |

Parity means equivalent user journeys and validation feedback intensity, not identical APIs or shared code. Each frontend keeps its own schemas/validators.

## Assumptions

- All clients continue to consume the same ProEventos HTTP API (no per-frontend backends).
- Unauthenticated use remains acceptable; Identity/JWT stays out of scope.
- **Locked technology decisions (from the feature request; planning MUST honor these):**
  - **React**: React Hook Form + Zod + `@hookform/resolvers/zod` (`register` by default; `Controller` only for controlled widgets; `defaultValues`; `formState.errors`; `z.infer` types).
  - **Vue**: `v-model` + VeeValidate (`useForm`, `useField`) + Zod when practical; Composition API.
  - **Angular**: Reactive Forms (`FormGroup`, `FormBuilder`, `Validators` / reusable validators); remove template-driven forms on migrated screens.
- “Maintain current behavior” means matching today’s field set, persistence side-effects, navigation after save, disable-while-saving, and page-level API error handling—not freezing internal state management.
- Existing HTML required/minlength constraints (and any hand-written client checks) define the baseline validation to encode in schemas/validators; we do not add stricter domain rules unless already enforced in the UI.
- Search forms that are real form elements are in scope; purely non-form filter widgets without submit are unchanged.
- Login page stubs that are disabled for study remain untouched beyond what is needed to keep the app compiling.
- Angular already includes forms support; migration means switching in-scope screens from template-driven to reactive patterns.
- React and Vue do not yet ship the locked form libraries; they will be added as direct dependencies of each app via `pnpm`.
- Preferred organization is `src/forms/{schemas,validators,hooks,components}` (or `src/app/forms/...` on Angular) when it fits; equivalents are fine if equally discoverable.
- Implementation delivery for a migrated module MUST be complete and compiling (no half-wired forms); planning/tasks will enforce full-file consistency per story.
- Existing coverage-gate expectations from `002-coverage-gate` remain in force; this feature does not lower coverage requirements.
