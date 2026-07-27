# Research: 005-eventos-domain-rules

## Decision: Enforce domain rules on the shared API; clients only mirror UX

**Rationale**: Constitution Principle I — business rules belong on the server. Spec already states validations and cascade must not diverge per frontend.

**Alternatives considered**: Client-only validation without API enforcement — rejected (forked behavior, easy to bypass).

---

## Decision: ASP.NET Core Identity + JWT Bearer for User/Auth

**Rationale**: Spec requires register, login, unique email, password change, access credential, and protected maintenance. Identity provides password hashing and unique email with minimal custom code; JWT matches the study course pattern and works identically for all three SPAs via `Authorization: Bearer`. Constitution v2.0.0 allows auth when a feature requires it; keep didactic (no external IdP/SSO).

**Alternatives considered**:
- Custom user table + hand-rolled hashing — more code, weaker defaults
- Cookie auth only — awkward for three separate SPA origins
- OAuth/OIDC provider — out of scope (spec forbids SSO sprawl)

---

## Decision: Protect write/edit/profile; keep public GET lists readable without auth

**Rationale**: Spec assumption: read-only consultation may stay open; write/edit/profile require authentication (FR-024). Aligns with study UX (browse seeds before registering) while satisfying protected maintenance.

**Alternatives considered**: Lock all endpoints — heavier for learners and contradicts stated assumption.

**API rule**:
- Anonymous: `GET` list/detail/search for eventos, lotes, palestrantes, redes
- Authenticated: `POST`/`PUT`/`DELETE` on domain resources + account profile/password
- Clients: route guards on `/eventos/edit…`, `/palestrantes/edit…`, `/perfil` (and equivalents); interceptor attaches Bearer token

---

## Decision: Tighten Lote validation to match FR-009–FR-012

**Rationale**: Current `LoteDto` has no DataAnnotations; seeds allow `Preco`/`Quantidade` of 0. Spec requires name, price > 0, quantity > 0, and start ≤ end (same-day OK).

**Alternatives considered**: Keep `>= 0` from older data-model notes — rejected; conflicts with SC-003 / FR-011–FR-012.

**Action**: Add DTO validation (+ service checks); adjust seeds to emit valid lotes; keep persistence column name `DataIncio` for compatibility (document as known spelling) while UI labels say “Data Início”.

---

## Decision: Cascade delete already present — verify via tests, do not reinvent

**Rationale**: EF relationships already use `DeleteBehavior.Cascade` for Evento → Lotes / RedeSociais (and related joins). Spec FR-004 / SC-004 need verification, not a new cascade design.

**Alternatives considered**: Soft delete — out of scope and more complex.

---

## Decision: Add palestrante search and explicit evento–palestrante link APIs

**Rationale**: Spec FR-015–FR-017 require search by name and by event theme, plus many-to-many participation. Current `PalestranteEndpoints` only expose basic CRUD; join entity `Palestrante_Evento` exists in persistence but no dedicated associate/list-by-tema surface.

**Alternatives considered**: Only nest palestrantes inside Evento DTO — insufficient for “search by tema do evento” and bidirectional visibility.

**Chosen surface** (see contracts):
- `GET /palestrantes/nome/{nome}` — case-insensitive contains
- `GET /palestrantes/tema/{tema}` — palestrantes linked to eventos whose tema matches
- `PUT`/`DELETE` (or POST) under `/eventos/{eventoId}/palestrantes/{palestranteId}` for associate/disassociate

---

## Decision: Require Evento Local on create (align FR-001)

**Rationale**: Spec lists Local as mandatory; `EventoDto` currently lacks `[Required]` on Local. Add server validation; fronts already tend to collect Local.

**Alternatives considered**: Leave optional — fails FR-001.

---

## Decision: Extend OpenAPI contract rather than replace 001 wholesale

**Rationale**: Domain CRUD paths from `specs/001-multi-front-eventos/contracts/openapi.yaml` remain the baseline. This feature adds Account/Auth, authorization notes, lote validation semantics, palestrante search/link, and documents Bearer security scheme.

**Alternatives considered**: Duplicate full OpenAPI — maintenance drift risk.

---

## Decision: Frontend parity — activate existing user stubs; no redesign

**Rationale**: All three apps already have inert login/register shells. Wire them to Account API, add profile + password change, guards, and interceptors using each framework’s idiomatic APIs. Preserve didactic UI from prior features (`003` forms, `004` folders).

**Alternatives considered**: Auth only on Angular first — rejected by Cross-Frontend Parity in the spec.

---

## Unknowns resolved

| Topic | Resolution |
|-------|------------|
| Auth in scope? | Yes — Q1:A; constitution 2.0.0 |
| Credential storage | Client session persistence (commonly local storage equivalent) — implementation detail per app; contract only requires credential on requests |
| Password policy | Identity defaults acceptable for study; password required non-empty |
| Email uniqueness | Enforced via Identity `UserManager` / unique index |
| Token lifetime | Short didactic default (e.g. 8–24h); document in quickstart; refresh tokens out of scope |
