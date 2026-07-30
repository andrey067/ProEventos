# Rede Social & Palestrante Parity — Implementation Plan

> **For agentic workers:** Use `depara.md` + `tasks.md` under `specs/018-rede-social-palestrante-parity/`. Prefer subagent-driven or executing-plans task-by-task. Steps use checkbox syntax in `tasks.md`.

**Goal:** Close security/UX gaps vs [vsandrade/ProEventos](https://github.com/vsandrade/ProEventos) for Rede Social and Palestrante without reverting local improvements (CRUD expandido, busca 017, DELETE, GET público).

**Architecture:** Add `Evento.UserId` as ownership root; scope rede mutations to event owner or JWT-linked palestrante; add `/palestrantes/me` and hybrid write policy (`User` = organizer CRUD, `Palestrante` = self only); tighten FE rede validators; optional redes block on profile.

**Tech Stack:** .NET Minimal APIs, EF Core, Angular/Vue/React forms (Zod / Reactive Forms)

## Global Constraints

- Do not remove global search (017), palestrante DELETE, or expanded palestrante fields.
- Keep GET redes públicas.
- Prefer `GET /palestrantes/me` over overloading `GET /palestrantes`.
- Register `me` route before `{id:int}`.
- Cross-user deny must have API tests.

## File map (primary)

| Area | Files |
|------|--------|
| Domain | `Evento.cs`, mappings, migration |
| API | `EventoEndpoints.cs`, `RedeSocialEndpoints.cs`, `PalestranteEndpoints.cs` |
| Services | `EventoService.cs`, `RedeSocialService.cs`, `PalestranteService.cs` |
| Front forms | `evento-form.factory.ts`, `eventoSchema.ts` (Vue/React) |
| Front profile | `profile.component.*`, Vue/React profile pages |
| Tests | Api.Tests, Services.Tests, front form specs |

## Execution order

Follow `specs/018-rede-social-palestrante-parity/tasks.md` phases 0 → 3 (phase 4 optional).

## Reference

- Full gap matrix: `specs/018-rede-social-palestrante-parity/depara.md`
- Acceptance: `specs/018-rede-social-palestrante-parity/spec.md`
