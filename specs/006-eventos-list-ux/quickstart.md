# Quickstart: 006-eventos-list-ux

Validate list images, pagination, Bogus volume, `dd/MM/yyyy` dates, and lote cards end-to-end.

## Prerequisites

- .NET SDK matching `Back/src/global.json`
- Node + pnpm for frontends
- Fresh or recreated SQLite so Bogus seed runs (≥50 eventos)

### Recreate SQLite (required once for new seeds)

Seeds run only when `Eventos` is empty (`Program.cs`). To force reseed:

```bash
# stop the API first, then:
rm -f Back/src/ProEventos.Api/ProEventos.db Back/src/ProEventos.Api/ProEventos.db-shm Back/src/ProEventos.Api/ProEventos.db-wal
```

## 1. API + seed

```bash
cd Back/src/ProEventos.Api
dotnet run
```

Expected:

- API on http://localhost:5000 (or launchSettings ports)
- After seed: `GET /eventos` returns **more than 30** items (target ≥50; default seed = 60)
- Several items have `imagemURL` starting with `https://images.unsplash.com/`
- Sample lotes include `dataIncio` / `dataFim` with início ≤ fim
- Bogus uses fixed `Randomizer.Seed = 40626` for reproducible demos

Quick check:

```bash
curl -s http://localhost:5000/eventos | head -c 500
# Count items with jq if available: curl -s http://localhost:5000/eventos | jq 'length'
```

## 2. One frontend happy path

Pick any app (parity requires all three eventually):

```bash
cd Front/Front-React && pnpm install && pnpm dev
# or Front/Front-Vue  → typically :5173
# or Front/Front-Angular → typically :4200
```

### List

1. Open Eventos list.
2. Confirm **image column left of Tema**.
3. Toggle **hide/show** images — Tema and other columns stay.
4. Default page size **10**; change to **20** then **30**; navigate pages (≥3 pages at size 10).
5. Confirm dates show as **dd/MM/yyyy**.
6. DevTools → Network: loading thumbnails does **not** send `Authorization: Bearer` to Unsplash/CDN.

### Edit lotes

1. Sign in if required by 005 (mutating routes).
2. Open an evento with 2+ lotes.
3. Confirm **one card per lote** with labeled Nome, Preço, Quantidade, Data início, Data fim.
4. Set data fim before data início → save blocked with field feedback.
5. Fix dates to valid `dd/MM/yyyy` range → save succeeds.

## 3. Parity checklist

Repeat list + edit checks on the other two frontends against the same API.

| Check | Vue | React | Angular |
|-------|-----|-------|---------|
| Image left of Tema | | | |
| Hide/show images | | | |
| pageSize 10/20/30 | | | |
| Dates dd/MM/yyyy | | | |
| Lote cards + date validation | | | |
| No JWT on Unsplash/CDN | | | |

## 4. Automated smoke (when implemented)

```bash
cd Back && dotnet test
# Frontend unit tests for date helper + list pagination slice as added in /speckit-tasks
```

## References

- [spec.md](./spec.md)
- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/openapi.yaml](./contracts/openapi.yaml)
- [contracts/client-list-behavior.md](./contracts/client-list-behavior.md)
