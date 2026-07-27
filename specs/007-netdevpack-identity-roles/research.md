# Research: NetDevPack Identity & Palestrante Roles

**Feature**: `007-netdevpack-identity-roles`  
**Date**: 2026-07-26

## 1. Adopt NetDevPack.Identity for Identity + JWT

**Decision**: Add package `NetDevPack.Identity` **8.0.0** (supports `net10.0` and `net8.0`). Wire JWT with `AddJwtConfiguration` + `AddNetDevPackIdentity<User>()`, Identity with `AddIdentityConfiguration()` (or equivalent builder that enables roles), and middleware with `UseAuthConfiguration()` between routing and endpoints as documented. Issue tokens via `IJwtBuilder` using `.WithEmail(...).WithJwtClaims().WithUserClaims().WithUserRoles()` (refresh token optional for didactic scope — omit unless already needed).

**Rationale**: Spec requires replacing ad-hoc HMAC JWT in `AccountService` with the chosen library. NetDevPack centralizes Identity setup, RSA key management (`NetDevPack.Security.Jwt`), and role claims on the token — matches FR-002/FR-013.

**Alternatives considered**:
- Keep manual `JwtSecurityToken` + symmetric key — rejected by feature request
- Duende / OpenIddict — heavier than didactic needs
- Use NetDevPack’s `NetDevPackAppDbContext` only — rejected; project already has `DataContext : IdentityDbContext<User>`

## 2. Keep existing DataContext (do not split Identity DB)

**Decision**: Continue using `ProEventos.Persistence.DataContext` as the single Identity + domain store. Skip `AddIdentityEntityFrameworkContextConfiguration` that registers `NetDevPackAppDbContext`, unless research during implement shows NetDevPack hard-requires it — prefer documenting custom context in EF migrations/commands (`--context DataContext`).

**Rationale**: Avoid dual contexts and migration chaos (known NetDevPack sample pitfall when custom user + wrong context name). README allows own `IdentityDbContext`.

**Alternatives considered**: Separate Identity DbContext — more moving parts for a study app.

## 3. Package / framework version alignment

**Decision**: Target `net10.0` assets of NetDevPack.Identity 8.0.0 (pulls Identity/JwtBearer ≥ 10.0.2). Align related `Microsoft.AspNetCore.Identity.*` / `JwtBearer` package references in Domain/Persistence/CrossCutting/Api with versions compatible with NetDevPack’s dependency graph when restoring (prefer bumping to the pack’s major rather than forcing 8.0.11 against net10 Identity).

**Rationale**: Project already targets `net10.0`; mixing Identity 8.x stores with Identity 10.x host is a restore/runtime risk.

**Alternatives considered**: Downgrade API to `net8.0` only for NetDevPack — unnecessary; 8.0.0 ships net10.0 TFM.

## 4. Configuration: `AppJwtSettings` vs current `Jwt`

**Decision**: Migrate configuration to NetDevPack’s `AppJwtSettings` (at least `Audience`; set `Issuer`/`Expiration` as needed). Remove didactic dependence on a long symmetric `Jwt:Key` for signing (RSA via NetDevPack.Security.Jwt). Update `.env.example`, `appsettings`, and test factory configuration accordingly. Document breaking config change in contracts/quickstart.

**Rationale**: Library’s documented contract; SecretKey is deprecated in NetDevPack docs.

**Alternatives considered**: Adapter mapping old `Jwt:*` into AppJwtSettings — extra glue, not didactic.

## 5. Roles model

**Decision**:
- Role names: `User` (write/maintenance) and `Palestrante` (ReadOnly).
- Enable ASP.NET Identity roles (`AddRoles<IdentityRole>()` on the Identity builder if not included by NetDevPack defaults).
- Seed both roles at startup; seed organizer `admin` with role `User`; seed a sample speaker account with role `Palestrante` + linked `Palestrante` row.
- Authorization policies:
  - Policy `RequireUserRole` → role `User` for POST/PUT/DELETE (and associate/disassociate) on Eventos, Lotes, Palestrantes, RedesSociais.
  - Authenticated profile/password: any authenticated identity (both roles).
  - GET list/detail/search: remain **anonymous** (unchanged from 005/current API) so public browse still works; ReadOnly for Palestrante means they cannot write, not that GETs require their role.
- Mutual exclusivity: on register/provision, assign exactly one family; refuse assigning both.

**Rationale**: Matches spec FR-003–FR-007 and edge-case mutual exclusivity; keeps anonymous reads for didactic frontends until UI catch-up.

**Alternatives considered**:
- Require auth on all GETs — breaks current frontends without UI work
- Fine-grained claims per resource — out of scope

## 6. Domain: Palestrante ↔ User

**Decision**: Add required `string UserId` on `Palestrante` (matches `IdentityUser.Id`) + navigation `User`. EF: required FK, unique index on `UserId` (one speaker profile per identity). Services reject create/update without valid UserId. Organizer Users need no Palestrante row.

**Rationale**: FR-008–FR-010; string key is Identity default already used by `User : IdentityUser`.

**Alternatives considered**: int FK with custom Identity key — large migration, no benefit.

## 7. Account flows & token response

**Decision**:
- `POST /account/register` → create User, assign role `User`, return auth payload including **roles**.
- Add `POST /account/register-palestrante` (or equivalent) → create User + Palestrante (UserId) + role `Palestrante`, return same auth shape.
- `POST /account/login` → validate password via UserManager/SignIn patterns as NetDevPack samples; build JWT with **WithUserRoles**; return roles in body for SC-004.
- Replace hand-rolled `GenerateJwtToken` with `IJwtBuilder`.
- Extend `AuthResponseDto` with `roles: string[]` (and optionally `palestranteId` when applicable).

**Rationale**: Spec user stories 1 & 4; clients must see role without a second call.

**Alternatives considered**: Only roles inside JWT (clients decode) — less clear for didactic JS clients; still include JWT roles **and** response field.

## 8. Endpoint authorization tightening

**Decision**: Change maintenance endpoint `.RequireAuthorization()` to `.RequireAuthorization("RequireUserRole")` (or `[Authorize(Roles = "User")]`). Leave Account login/register anonymous; profile endpoints `[Authorize]` without role restriction.

**Rationale**: Today any authenticated user (including future Palestrante) can write; FR-005 requires denial for Palestrante.

## 9. Testing strategy

**Decision**: Extend API integration tests: login as User → write 2xx; login as Palestrante → write 401/403; both can login and receive roles; Palestrante seed has UserId; register-palestrante creates link + role.

**Rationale**: SC-001/SC-002 verifiable without frontend.

## 10. Frontends

**Decision**: No frontend code in this feature. Document OpenAPI delta so Vue/React/Angular can catch up later (store roles, hide write UI for Palestrante).

**Rationale**: Spec Cross-Frontend Parity = deferred.
