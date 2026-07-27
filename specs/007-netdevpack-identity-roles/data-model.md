# Data Model: NetDevPack Identity & Palestrante Roles

**Feature**: `007-netdevpack-identity-roles`  
**Date**: 2026-07-26

## Overview

Identity remains ASP.NET Identity tables (via existing `DataContext`). Domain change: **Palestrante** is owned by **User**. Authorization uses two roles: `User` and `Palestrante`.

```text
User (Identity) 1 ── 0..1 Palestrante
User * ── * IdentityRole   (AspNetUserRoles)
```

## Entities

### User

| Field | Type | Rules |
|-------|------|--------|
| Id | string (PK) | Identity default |
| UserName | string | Required, unique |
| Email | string | Required, unique |
| Nome | string | Display name |
| PasswordHash / … | Identity fields | Managed by Identity |

**Notes**: Extends `IdentityUser`. Organizers have role `User` and no Palestrante. Speakers have role `Palestrante` and exactly one Palestrante profile.

### IdentityRole (system)

| Name | Meaning |
|------|---------|
| `User` | Organizer/maintainer — create/update/delete on maintenance resources |
| `Palestrante` | Speaker — ReadOnly (no maintenance writes) |

**Rules**:
- Both roles MUST exist after seed
- An account receives exactly one of these two roles (mutually exclusive)
- Role names are stable API contract values (appear in JWT and auth response)

### Palestrante

| Field | Type | Rules |
|-------|------|--------|
| Id | int (PK) | Existing |
| Nome | string | Required (existing domain rules) |
| MiniCurriculo | string | Optional |
| ImagemURL | string | Optional |
| Telefone | string | Optional |
| Email | string | Optional (profile contact; login uses User) |
| **UserId** | **string (FK → User.Id)** | **Required; unique** |
| User | User | Navigation |
| RedeSociais | collection | Existing |
| PalestrantesEventos | collection | Existing |

**Validation**:
- Cannot persist without non-empty `UserId` referencing an existing User
- At most one Palestrante per UserId
- Creating a speaker account MUST set UserId to the newly created User

### Access credential (auth response — not a table)

| Field | Type | Rules |
|-------|------|--------|
| token | string | JWT including role claims |
| userName, email, nome | string | Profile snapshot |
| roles | string[] | e.g. `["User"]` or `["Palestrante"]` |
| palestranteId | int \| null | Set when speaker profile exists |

## Relationships

| From | To | Cardinality | Cascade |
|------|-----|-------------|---------|
| Palestrante | User | many→one (enforced 1:1 via unique UserId) | Restrict delete of User if Palestrante exists (or delete profile first) |
| User | Role | many↔many | Identity tables |

## State / lifecycle

1. **Register organizer** → User created → role `User` assigned → JWT with roles
2. **Register speaker** → User created → role `Palestrante` assigned → Palestrante row with UserId → JWT with roles + palestranteId
3. **Login** → authenticate User → emit JWT with current roles (no role change on login)
4. **Write attempt** → policy requires role `User`; role `Palestrante` → denied

## Seed data (didactic)

| Account | UserName (example) | Role | Palestrante row |
|---------|--------------------|------|-----------------|
| Organizer | `admin` | `User` | No |
| Speaker | `palestrante` | `Palestrante` | Yes, UserId = that user |

Passwords remain local didactic secrets (document in quickstart; do not invent production secrets management).

## Migration impact

- Add `Palestrantes.UserId` (NOT NULL) + unique index + FK
- Existing palestrantes without users: seed/migrate by creating linked Users or clearing and reseeding in Development
- Ensure Identity role tables populated (`AspNetRoles`, `AspNetUserRoles`)
