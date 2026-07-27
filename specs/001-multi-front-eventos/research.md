# Research: 001-multi-front-eventos

## 1. .NET 8 + Minimal APIs (replace Controllers)

**Decision**: Host with .NET 8 minimal `Program.cs`; map endpoints in `ProEventos.Api/Endpoints/*Endpoints.cs` per context; remove MVC Controllers.

**Rationale**: Matches the study brief, reduces ceremony vs Controllers, and groups routes by domain file for teaching.

**Alternatives considered**:
- Keep Controllers on .NET 8 — works, but conflicts with “Minimal APIs por contexto”
- Controllers + Minimal hybrid — unnecessary complexity for a study API

## 2. Mapster instead of AutoMapper

**Decision**: Replace AutoMapper profiles/DI with Mapster (`TypeAdapterConfig` + `Adapt<T>()`), registered once in CrossCutting/startup.

**Rationale**: User requirement; Mapster is lighter for DTO↔entity mapping in small APIs.

**Alternatives considered**:
- Keep AutoMapper — rejected by brief
- Manual mapping only — verbose and error-prone across four contexts

## 3. Persistence: EF Core 8 + SQLite

**Decision**: Stay on SQLite with EF Core 8; bump all projects from net5.0 → net8.0; recreate/update migrations as needed after package upgrade.

**Rationale**: Already used in repo; zero local DB install for learners; constitution prefers extending existing layers.

**Alternatives considered**:
- SQL Server / PostgreSQL — more setup friction for a study repo
- In-memory only — loses persistence across restarts and seeds

## 4. OpenAPI: Swashbuckle 9

**Decision**: Use Swashbuckle 9 with Minimal API endpoint metadata (`WithName`, `WithTags`, `Produces`).

**Rationale**: User-specified; familiar Swagger UI for validating contracts without frontends.

**Alternatives considered**:
- Microsoft.AspNetCore.OpenApi only — thinner docs UX for learners
- NSwag — extra stack with little benefit here

## 5. Evento route + bug fixes

**Decision**:
- Stabilize paths: `GET/POST /eventos`, `GET/PUT/DELETE /eventos/{id}`, `GET /eventos/tema/{tema}` (tema under `/eventos`, not root `/tema/{tema}`)
- POST → create service; PUT → update service (fix inverted bugs in current Controllers)

**Rationale**: Current `EventoController` POST calls `UpdateEvento` and PUT calls `DeleteEvento`; frontends cannot learn correct CRUD until fixed.

**Alternatives considered**:
- Keep legacy `/tema/{tema}` — breaks “contratos estáveis” clarity
- Versioned `/api/v2` — overkill for study upgrade

## 6. RedeSocial ownership routes

**Decision**: Owner-scoped routes:
- `/redes-sociais/evento/{eventoId}` GET + PUT (batch save)
- `/redes-sociais/evento/{eventoId}/{redeSocialId}` DELETE
- `/redes-sociais/palestrante/{palestranteId}` GET + PUT
- `/redes-sociais/palestrante/{palestranteId}/{redeSocialId}` DELETE

**Rationale**: Matches “por dono sob `/redes-sociais/evento`” and mirrors lote-by-evento pattern already in the codebase.

**Alternatives considered**:
- Flat `/redes-sociais/{id}` only — weaker teaching of ownership
- Nest under `/eventos/{id}/redes-sociais` — also fine, but brief pointed at `/redes-sociais/evento`

## 7. CORS allowlist

**Decision**: Explicit origins for `http://localhost:5173` (Vue), `http://localhost:3000` (Next), `http://localhost:4200` (Angular); methods/headers needed for JSON CRUD.

**Rationale**: Three browser origins must call the API in dev without disabling CORS entirely.

**Alternatives considered**:
- `AllowAnyOrigin` — easier but less realistic and breaks credentialed patterns later
- Proxy-only (no CORS) — couples each frontend dev server config

## 8. Front-Vue upgrade path

**Decision**: Rename `Front/` → `Front-Vue/`; Vue 3.5 + Vite 6 + Element Plus + Axios; remove Bootstrap/Bootswatch; services per resource; wire full Evento/Palestrante CRUD (today mostly list/delete).

**Rationale**: Existing app is the behavior reference; Element Plus already present — keep one UI system.

**Alternatives considered**:
- Rewrite Vue from scratch — wastes working list/detail scaffolding
- Keep Bootstrap + Element Plus — violates “um sistema só”

## 9. Front-React stack

**Decision**: React + Vite + TypeScript + React Router; client `fetch` to API; pages for eventos list, eventos/:id, palestrantes; plain CSS (one system); `VITE_API_URL` in `.env.example`. Package manager: **pnpm** (workspace).

**Rationale**: Aligns with Vite+TS study stack; Next.js does not use Vite as the app bundler, so the React SPA replaces the former Front-Next app.

**Alternatives considered**:
- Next.js App Router — rejected for Vite standardization across compatible frameworks
- Server Actions / SSR calling DB — would bypass shared API and break comparison

## 10. Front-Angular version

**Decision**: Angular **21 LTS** standalone + TypeScript + HttpClient services + routes mirroring Vue. Prefer Angular Material **or** plain CSS (one system). `environment.ts` holds `apiUrl`. If `ng new` defaults to Angular 22 (active), either pin 21 or accept 22 with a README note — both are supported as of 2026-07; LTS preference is 21. Package manager: **pnpm** (`cli.packageManager`).

**Rationale**: User asked for current LTS; Angular 21 is LTS while 22 is active (June 2026). App bundler remains `@angular/build` / `ng serve`; Vitest covers unit tests (Vite-based).

**Alternatives considered**:
- Angular 22 only — fine for longest runway; slightly looser vs “LTS” wording
- Vite as Angular app bundler — not the official stable path for Angular 21
- NgModules-first template — outdated vs standalone teaching path

## 11. Auth shell

**Decision**: Keep optional login/registro **visual** routes/pages; no API, no JWT storage required for feature completion.

**Rationale**: Constitution and brief postpone Identity; shells avoid broken menu links without implying security.

**Alternatives considered**:
- Remove all auth UI now — also acceptable; shells are optional polish
- Implement Identity — explicitly out of scope

## 12. Documentation layout

**Decision**: Root `README.md` (overview, tree, prereqs, run all, endpoint table, auth note, how to run unit tests) + thin `Back/README.md`, `Front-*/README.md` linking to root.

**Rationale**: Learners need one entry point; per-folder READMEs stay short.

**Alternatives considered**:
- Docs only in `/docs` — extra hop for a small study repo
- README only at root — weaker when opening a subfolder in the IDE

## 13. Unit testing (backend + frontends) — REQUIRED

**Decision**: Add **unit tests** for the API layer services and for each frontend. Keep **E2E cross-front** out of scope.

| Layer | Tooling | Focus |
|-------|---------|--------|
| Backend | xUnit + Moq (+ FluentAssertions) + Coverlet (`Threshold=80` line/branch/method) in `Services.Tests`, `Persistence.Tests`, `Api.Tests` | Per-layer Includes; real tests until gate passes — see `specs/002-coverage-gate/` |
| Front-Vue | Vitest + Vue Test Utils + `@vitest/coverage-v8` (`pnpm test:coverage`) | Services + UI; thresholds lines/functions/branches/statements = 80 |
| Front-React | Vitest + Testing Library + `@vitest/coverage-v8` | Same bar as Vue |
| Front-Angular | Vitest (`pnpm test` / `test:coverage`) + `@vitest/coverage-v8` | Same bar as Vue |

**Minimum bar (local 80% coverage gate — adopted in `specs/002-coverage-gate/`)**:
- Backend: Coverlet fails below 80% per Include scope; Services cover public methods + Mapster paths; Persistence+Domain via InMemory; Api+CrossCutting via WebApplicationFactory
- Each frontend: `pnpm test:coverage` fails below 80% on all four Vitest dimensions; expand service + page/router tests until pass
- Document `dotnet test` (with Coverlet settings) and per-app `pnpm test:coverage` in READMEs and quickstart
- Still didactic: no empty “coverage theater” tests; exclusions limited to Migrations / Designer / `*.d.ts` / CSS / test setup

**Rationale**: Spec now requires unit tests for learning how each stack tests; constitution allows tests when the feature requests them. Feature `002-coverage-gate` adds an honest local %-gate. E2E across three apps stays expensive and was already excluded. CI coverage workflows remain out of scope.

**Alternatives considered**:
- Keep tests optional / manual only — rejected by amended plan request
- Shared Playwright E2E matrix for three fronts — out of scope; slow for study feedback
- Single test runner for all fronts — fights Angular CLI and reduces framework-specific learning
- Soft coverage without fail-below-threshold — rejected by `002-coverage-gate`
- Backend WebApplicationFactory only — useful and now required for Api+CrossCutting gate; services unit tests remain for create/update regression teaching
