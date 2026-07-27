# Feature Specification: NetDevPack Identity & Palestrante Roles

**Feature Branch**: `007-netdevpack-identity-roles`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "vamos alterar para usar o NetDevPack na aplicação. Analise a documentação para entender como a lib trabalhar (https://github.com/NetDevPack/Security.Identity). Alterar o domínio, Palestrante deve ter um User e UserId, o login será por User e Palestrante ou seja Palestrante vai ter User e UserId, e vamos ter Roles de User e Roles de Palestrantes. Configure as Roles para cada um dos dois. Deixe Palestrante somente com ReadOnly."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticate and receive role-aware access (Priority: P1)

A person signs in with username/password and receives an access credential that reflects whether they are an organizer **User** or a **Palestrante**. The application uses that credential to allow or deny maintenance actions.

**Why this priority**: Without reliable login and role claims, no other permission or domain-link behavior can be verified.

**Independent Test**: Register or seed one organizer and one palestrante account, sign in with each, and confirm the credential includes the correct role and that write endpoints accept the organizer and reject the palestrante.

**Acceptance Scenarios**:

1. **Given** a valid organizer User account, **When** they sign in with correct credentials, **Then** they receive an access credential that includes the User role set and can call maintenance (create/update/delete) operations they are authorized for.
2. **Given** a valid Palestrante-linked account, **When** they sign in with correct credentials, **Then** they receive an access credential that includes the Palestrante role set and can call read operations but not write/maintenance operations.
3. **Given** invalid credentials, **When** they attempt to sign in, **Then** access is denied with a clear error and no credential is issued.

---

### User Story 2 - Palestrante is always linked to a User identity (Priority: P1)

Every Palestrante profile in the domain is owned by exactly one User identity (`UserId` + navigation to User). Login is always against the User identity; the Palestrante record is the domain profile attached to that identity when the person is a speaker.

**Why this priority**: The requested domain change is the foundation for “login by User and Palestrante” and for assigning Palestrante roles.

**Independent Test**: Create or seed a Palestrante with a UserId; load the palestrante and confirm User/UserId are present and consistent; attempt to create a palestrante without a User link and confirm it is rejected.

**Acceptance Scenarios**:

1. **Given** a User identity that should represent a speaker, **When** a Palestrante profile is created for that identity, **Then** the Palestrante stores that User’s id and can resolve the related User.
2. **Given** an existing Palestrante, **When** the profile is retrieved, **Then** its UserId is present and matches the linked User.
3. **Given** an attempt to persist a Palestrante without a UserId, **When** save is requested, **Then** the system rejects the operation.

---

### User Story 3 - Distinct role sets: User (write) vs Palestrante (read-only) (Priority: P1)

The system defines and seeds two role families: **User** roles for organizers/maintainers with write access, and **Palestrante** roles limited to **ReadOnly**. Protected maintenance endpoints enforce these roles.

**Why this priority**: Explicit role configuration and read-only palestrantes are core acceptance criteria of this feature.

**Independent Test**: Inspect seeded roles; call a write endpoint with a Palestrante credential (expect deny) and with a User credential (expect allow); call a read endpoint with both (expect allow when authenticated as required).

**Acceptance Scenarios**:

1. **Given** seeded role configuration, **When** the application starts (or seed runs), **Then** User role(s) and Palestrante ReadOnly role(s) exist and are assignable.
2. **Given** a caller with only Palestrante ReadOnly role(s), **When** they attempt create, update, or delete on maintenance resources (e.g. eventos, lotes), **Then** the system denies the action.
3. **Given** a caller with User role(s), **When** they attempt the same maintenance create/update/delete actions, **Then** the system allows them subject to existing domain rules.
4. **Given** a caller with Palestrante ReadOnly role(s), **When** they request list/detail (read) of allowed resources, **Then** the system allows the read.

---

### User Story 4 - Register or provision both account kinds (Priority: P2)

An organizer can be registered as a User with User roles. A speaker can be provisioned as a User identity plus Palestrante profile with Palestrante ReadOnly roles, so both kinds can log in through the same authentication flow.

**Why this priority**: Needed for didactic demos and for exercising both role paths without manual database edits.

**Independent Test**: Register/provision one of each kind; sign in; confirm roles and (for speaker) the Palestrante↔User link.

**Acceptance Scenarios**:

1. **Given** valid organizer registration data, **When** registration completes, **Then** a User exists with User role(s) and no Palestrante profile is required.
2. **Given** valid speaker provisioning data, **When** provisioning completes, **Then** a User exists, a Palestrante exists with that UserId, and Palestrante ReadOnly role(s) are assigned.
3. **Given** an email or username already in use, **When** registration/provisioning is attempted, **Then** the system rejects with a conflict/validation message.

---

### Edge Cases

- What happens when a User has no roles assigned? Access to protected maintenance endpoints is denied.
- What happens when credentials are valid but the linked Palestrante profile was removed? Login may still succeed as User identity; speaker-specific profile data is unavailable / not found for palestrante-only views.
- How does the system handle assigning both User write roles and Palestrante ReadOnly roles to the same identity? Roles are treated as mutually exclusive for this feature: an identity is either organizer (User roles) or speaker (Palestrante ReadOnly), not both.
- What happens on expired or missing access credentials for a write request? The system denies access (unauthorized/forbidden as appropriate).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authenticate accounts with username (or equivalent login identifier) and password and issue an access credential suitable for subsequent API calls.
- **FR-002**: System MUST include the caller’s roles in the access credential (or equivalent authorization context) so clients and the API can enforce permissions.
- **FR-003**: System MUST support two role families: **User** (organizer/maintainer with write permissions) and **Palestrante** (speaker with **ReadOnly** permissions only).
- **FR-004**: System MUST seed or otherwise ensure the configured roles exist before they are assigned (at least one User write role and one Palestrante ReadOnly role).
- **FR-005**: System MUST deny create, update, and delete on maintenance resources for callers who only have Palestrante ReadOnly role(s).
- **FR-006**: System MUST allow create, update, and delete on maintenance resources for callers who have User role(s), subject to existing domain validation rules.
- **FR-007**: System MUST allow authenticated read (list/detail) for callers with either User or Palestrante roles on resources that require authentication for read, unless a more specific rule says otherwise.
- **FR-008**: Domain **Palestrante** MUST reference a **User** via a required **UserId** and expose the related User association.
- **FR-009**: System MUST NOT accept a Palestrante without a valid UserId linking to an existing User identity.
- **FR-010**: Login MUST always authenticate against the User identity; Palestrante is a domain profile linked to that identity when the account is a speaker.
- **FR-011**: System MUST provide a way to register/provision an organizer User with User role(s).
- **FR-012**: System MUST provide a way to provision a speaker as User + Palestrante (with UserId) and Palestrante ReadOnly role(s).
- **FR-013**: System MUST use the project’s chosen standardized Identity/JWT package (see Assumptions) for configuration, credential issuance, and role inclusion, preserving a single shared API contract for all frontends.
- **FR-014**: Unauthenticated callers MUST be denied access to endpoints that require authentication.

### Key Entities

- **User**: Authentication identity (login credentials, display name, and Identity roles). Base for both organizers and speakers.
- **Role (User family)**: Authorization labels granting maintenance write access (e.g. organizer/admin style User roles).
- **Role (Palestrante family)**: Authorization labels limited to ReadOnly for speakers.
- **Palestrante**: Speaker domain profile (nome, mini-currículo, imagem, telefone, email, redes sociais, eventos) **owned by** a User via required UserId.
- **Access credential**: Issued after successful login/register; carries identity and roles for authorization.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of seeded or newly provisioned Palestrante profiles have a non-empty UserId pointing to an existing User.
- **SC-002**: In verification tests, 100% of write attempts (create/update/delete) by Palestrante-only accounts on maintenance resources are denied; 100% of the same attempts by User-role accounts succeed when domain rules allow.
- **SC-003**: A learner can sign in as either account type and complete the happy-path login in under 1 minute with clear success or failure feedback.
- **SC-004**: After login, a client can determine within the first authenticated response whether the account is User (write) or Palestrante (read-only) without a second round-trip solely for role discovery.
- **SC-005**: Existing frontends continue to use the same shared API base; auth-related contract changes are documented so all three clients can stay compatible (parity deferred unless listed below).

## Out of Scope *(mandatory for ProEventos)*

- Página Contatos
- Premium / heavy UI redesign (clean didactic UI only)
- External SSO / third-party IdP (Google, Azure AD, etc.)
- Fine-grained permission matrix beyond the two role families (User write vs Palestrante ReadOnly)
- Password reset / email confirmation flows beyond what is needed for local didactic login
- Changing Vue/React/Angular UI in this feature (backend/auth domain only unless catch-up is scheduled)

## Cross-Frontend Parity *(when UI work is included)*

| Frontend       | In this feature? | Notes                                                                 |
|----------------|------------------|-----------------------------------------------------------------------|
| Vue (`Front/`) | deferred         | API/auth contract may change; UI catch-up in a follow-up if needed    |
| React/Next.js  | deferred         | Same shared API; no UI work in this feature                           |
| Angular        | deferred         | Same shared API; no UI work in this feature                           |

## Assumptions

- All clients consume the same ProEventos HTTP API (no per-frontend backends).
- Identity/auth is explicitly in scope for this feature (constitution allows it when the active spec requires it).
- **NetDevPack.Identity** (https://github.com/NetDevPack/Security.Identity) is the chosen library: Identity EF context helpers, `AddIdentityConfiguration` / `UseAuthConfiguration`, JWT via `AddJwtConfiguration` + token builder with user roles/claims—implementation detail for planning, outcome is standardized auth with roles in the credential.
- Role names used in seeds/docs: at least `User` (write/maintenance) and `Palestrante` (ReadOnly). Additional claim names may mirror NetDevPack defaults.
- User and Palestrante role families are **mutually exclusive** per account for didactic clarity.
- Organizer Users do not require a Palestrante profile; speakers always have User + Palestrante + ReadOnly role.
- Existing Eventos/Lotes/Palestrante/RedeSocial domain rules remain; this feature adds identity linkage and authorization, not new business entities beyond User↔Palestrante.
- Persistence remains behind the API; frontends never access the database directly.
- Read-only for Palestrante means no create/update/delete on maintenance resources; public or authenticated reads remain available as today’s contract requires after auth is applied.
