# Research: 006-eventos-list-ux

**Date**: 2026-07-26  
**Spec**: [spec.md](./spec.md)

## 1. Pagination: client vs shared API

**Decision**: Client-side pagination on all three frontends over the existing `GET /eventos` (and tema search) array responses. Default `pageSize = 10`; allowed values `{10, 20, 30}`; expose page index, total pages, and prev/next (and/or page numbers).

**Rationale**: Spec explicitly allows client or API pagination if UX matches. Current API returns full arrays; with Bogus seeding ~50–80 eventos, payload remains fine for local study. Avoids a breaking `PageList` contract change while teaching the same UX on Vue/React/Angular. Shared API contract stays one shape for all clients.

**Alternatives considered**:
- Server `GET /eventos?page=&pageSize=` + `PageList<T>` — better at scale; deferred (YAGNI for study volume; can be a follow-up without changing the list UX).
- Infinite scroll — does not match “itens por página” requirement.

## 2. Unsplash images without ProEventos JWT

**Decision**: Persist event-themed Unsplash CDN URLs on `Evento.ImagemURL` at seed time (Bogus). List column renders `<img src={imagemURL}>` (thumb/small). Frontends never call `api.unsplash.com` with the ProEventos JWT; image requests go to `images.unsplash.com` without the app Bearer token. Optional: if `Unsplash:AccessKey` is present in API config, seed may call Unsplash Search (Authorization: `Client-ID {key}` only) to refresh the URL pool; otherwise use a curated list of known Unsplash photo URLs.

**Rationale**: User required Unsplash free developer source and “sem passar o JWT”. Storing URLs keeps one shared contract (`imagemURL`), parity across three fronts, and didactic simplicity (no per-frontend Access Key, no rate-limit ×3). Hotlinking Unsplash image CDN is the free display path; developer Access Key is only for optional API search at seed, never the app JWT.

**Alternatives considered**:
- Each frontend calls Unsplash Search at runtime with its own Access Key — triples config/rate limits; easier to accidentally attach JWT interceptors.
- Backend proxy endpoint for Unsplash — extra surface, not needed for didactic list thumbnails.
- Keep `evento.jpg` placeholder — fails FR-002 (real Unsplash event photos).

**Validation impact**: Current `EventoDto.ImagemURL` regex requires file extension suffix (`gif|jpg|jpeg|bmp|png`). Unsplash CDN URLs typically lack that suffix. **Relax validation** to accept either extension-style paths **or** `https://` URLs (especially `images.unsplash.com`).

## 3. Bogus seed volume and quality

**Decision**: Replace/upgrade `EventoSeeds` to generate a **fixed minimum of 50 eventos** (target 50–80), each with 1–3 lotes. Rules: `Tema` length 3–50; `Preco > 0`; `Quantidade > 0`; `DataFim >= DataIncio`; `ImagemURL` = Unsplash HTTPS URL; phone/email plausible. Use a fixed Bogus seed (deterministic) for reproducible local demos. Ensure seed runs when DB is empty / on EnsureCreated path already used by the app.

**Rationale**: Spec requires >30 eventos to demo page sizes 10/20/30. Current seed uses `Randomizer.Seed.Next(1, 20)` and often yields too few rows; lote date order is not guaranteed.

**Alternatives considered**: Manual SQL inserts — brittle. Runtime fake API only on frontend — breaks shared-backend study goal.

## 4. Date display/input `dd/MM/yyyy`

**Decision**: Each frontend owns a small date helper (no shared cross-framework package): `formatDateBr` for display and parse/serialize helpers for forms. List/detail show `dd/MM/yyyy`. Edit inputs accept/display that format; wire to API using existing DTO shapes (`DataEvento` string; lote `DataIncio`/`DataFim` as DateTime/ISO as today). Keep persistence spelling `DataIncio` on API; map Vue’s `dataInicio` at the service/form boundary if needed.

**Rationale**: Constitution forbids shared UI libraries; format is a UX rule, not a new API date type. ISO on the wire remains fine (spec assumption).

**Alternatives considered**: Force API to always emit `dd/MM/yyyy` strings — couples server to locale UI; rejected. `date-fns` only where already present; native `Intl`/`toLocaleDateString('pt-BR')` preferred for simplicity.

## 5. Lote cards on edit

**Decision**: On create/edit evento screens, render **one card per lote** with visible labels for Nome, Preço, Quantidade, Data início, Data fim (plus existing fields). Client validation mirrors domain: required fields, preço/quantidade > 0, data fim ≥ data início. Reuse existing upsert `PUT /lotes/{eventoId}` flows.

**Rationale**: Spec FR-009–FR-012; domain already validates lote date order in `LoteDto`. UI gap is presentation (cards + labels + date fields consistently editable).

**Alternatives considered**: Single flat table of lotes — denser but fails “card diferente” / naming clarity. Modal-per-lote — extra navigation, less didactic.

## 6. Image column hide/show

**Decision**: Session-scoped boolean (component state) toggles visibility of the image column for the whole list. Default: images **visible**. Control placed near list toolbar (e.g. “Ocultar imagens” / “Mostrar imagens”).

**Rationale**: Spec assumption — column-level toggle, not per-row. No persistence required.

## Resolved clarifications

| Topic | Resolution |
|-------|------------|
| Pagination location | Client-side over existing list endpoints |
| Unsplash + JWT | URLs on `ImagemURL`; CDN `<img>`; no ProEventos JWT to Unsplash |
| Seed count | ≥50 eventos via Bogus |
| Date format | UI `dd/MM/yyyy`; API wire unchanged |
| ImagemURL validation | Allow HTTPS Unsplash URLs |
