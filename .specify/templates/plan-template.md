# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]

**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify against `.specify/memory/constitution.md` (ProEventos v1.0.0+):

- [ ] **Shared API Contract**: One backend; no client-specific API forks; business
  rules stay on the server
- [ ] **Frontend Independence**: Changes do not couple Vue / React-Next / Angular
  toolchains or share cross-framework UI packages
- [ ] **Domain Focus**: Feature stays in eventos (and related API resources such
  as lotes); no Contatos work
- [ ] **Didactic Simplicity**: Clean/legible UI only; no premium redesign or
  speculative layers
- [ ] **Feature Parity**: In-scope UI behavior is planned for each active
  frontend (or gaps are explicit in the spec)
- [ ] **Out of scope respected**: No Contatos or premium redesign; Identity/auth
  only if the feature spec explicitly requires it

Any failed gate MUST be justified in Complexity Tracking or the plan MUST be
revised.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Use the ProEventos layout below (or the concrete paths for
  this feature). Delete unused frontend app folders only if that app is not in
  scope for the feature. The delivered plan must not include Option labels.
-->

```text
Back/src/
├── ProEventos.Api/
├── ProEventos.Application/
├── ProEventos.Domain/
├── ProEventos.Persistence/
├── ProEventos.Services/
└── ProEventos.CrossCutting/

Front/                       # Vue 3 + Vite (existing)
├── src/
│   ├── components/
│   ├── services/
│   ├── Models/
│   └── router/
└── ...

Front-React/                 # React / Next.js (when present)
└── ...

Front-Angular/               # Angular (when present)
└── ...
```

**Structure Decision**: [Document which apps are touched and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
