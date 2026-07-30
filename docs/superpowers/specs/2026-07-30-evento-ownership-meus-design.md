# Design: Fechamento de ownership de Evento + GET /eventos/meus

**Date:** 2026-07-30  
**Status:** Approved for planning  
**Approach:** Spec de fechamento (ownership em Lotes/Associate + híbrido browse/`meus`), backend only

## Context

Auditoria das regras de negócio do curso (Evento → Lotes / RedesSociais / Palestrantes; `Evento.UserId`; Account/JWT; paginação) contra o repositório atual.

A spec **018** (`specs/018-rede-social-palestrante-parity/`) já fechou ownership em Evento e RedesSociais do evento, redes self-scoped do palestrante, `GET /palestrantes/me` e policies híbridas. Restam buracos de segurança em mutações **derivadas** do evento e a falta do endpoint “meus eventos” no modelo híbrido escolhido.

## Decisions (brainstorming)

| Tema | Decisão |
|------|----------|
| Acesso a eventos de terceiros | **Híbrido (C):** GET lista/detalhe público; `GET /eventos/meus` só do dono |
| Upload de imagem | **Manter URL** — não é gap |
| Lotes + associate/disassociate | **Só dono do evento** |
| Fronts | **Fora** desta leva (só backend) |
| GAP-05 (filtro Funcao) | Fora / deferido (018) |
| Controllers vs Minimal APIs, headers de paginação JSON | Equivalente / decisão local — não gap |

## Goals

1. Impedir que organizador B altere lotes ou associações de palestrantes do evento de A.
2. Expor `GET /eventos/meus` paginado, autenticado, filtrado por `UserId` do JWT.
3. Manter browse público de eventos e lotes intacto.
4. Cobrir com testes API (e service se o gate for novo).
5. Atualizar levemente `specs/018-rede-social-palestrante-parity/depara.md` com os novos itens fechados.

## Non-goals

- Upload multipart (evento/perfil)
- Alterar fronts (Angular/Vue/React)
- Filtrar GET público por dono
- GAP-05, parity cosmético do curso (Controllers, `CheckPasswordSignInAsync`, headers HTTP separados)
- Extrair helper compartilhado de ownership além do necessário (YAGNI: espelhar `EnsureEventoOwnerAsync` se bastar)

## Architecture

Reutilizar o padrão já usado em `RedeSocialService.EnsureEventoOwnerAsync` + `ResourceOwnership.IsOwner`:

```
HTTP (JWT)
  → Endpoint passa userId
  → Service carrega Evento por id
  → NotFound se inexistente / Forbidden se !IsOwner
  → Mutação / query filtrada
```

**Camadas:**

| Área | Arquivos típicos |
|------|------------------|
| Lotes | `LoteEndpoints`, `LotesServices`, opcional `IEventoRepository` |
| Associate | `EventoEndpoints`, `PalestranteService` (+ interface) |
| Meus | `EventoEndpoints`, `EventoService`, `IEventoRepository` / `EventoRepository` |
| Testes | `ProEventos.Api.Tests` (ex. `OwnershipParityEndpointsTests`), service tests se útil |

## Contracts

### `GET /eventos/meus`

- **Auth:** `RequireUserRolePolicy`
- **Query:** `page`, `pageSize`, `q` (opcional; mesma busca global de eventos públicos)
- **Persistência:** estender `GetPagedEventosAsync` com filtro opcional `userId` (ou overload dedicado): `WHERE UserId == caller`
- **Resposta:** mesmo formato paginado atual (`items` + header `Pagination`)
- Sem claim de userId → 401; sem eventos → lista vazia (200)

`GET /eventos` e `GET /eventos/{id}` permanecem **públicos**.

### Lotes

- `PUT /lotes/{eventoId}` e `DELETE /lotes/{eventoId}/{loteId}` passam `userId` do JWT ao service
- Antes de mutar: evento inexistente → NotFound; não-dono → Forbidden
- `GET /lotes/{eventoId}` continua **público**

### Associate / Disassociate

- Endpoints já autenticados; passam `userId` para `AssociateAsync` / `DisassociateAsync`
- Mesmo gate de ownership do evento antes do join
- Evento/palestrante inexistente → 404; não-dono → 403

### Error codes (estáveis)

Exemplos alinhados ao estilo atual:

- `Lote.Evento.NotFound` / `Lote.Evento.Forbidden`
- `Palestrante.Associate.Forbidden` / `Palestrante.Disassociate.Forbidden`
- (reusar NotFound existentes de associate quando ids inválidos)

## Data flow

### Mutação protegida (lote / associate)

1. Endpoint obtém `userId` do JWT (`NameIdentifier` / `sub`)
2. Service resolve evento por `eventoId`
3. `ResourceOwnership.IsOwner(evento.UserId, userId)` → Forbidden se falso
4. Prossegue Insert/Update/Delete ou join
5. Retorna DTO / Success via `ErrorOr` → HTTP

### Meus eventos

1. Endpoint autenticado
2. Service normaliza paginação (`PaginationHelper`)
3. Repository `GetPagedEventosAsync(..., userId: caller)`
4. Header `Pagination` + JSON dos items

## Testing / acceptance

### Minimum tests

1. **Lotes:** user B (role User) PUT/DELETE em evento de A → **403**; A → 200  
2. **Associate/Disassociate:** B em evento de A → **403**; A → 200 (404 se ids inválidos)  
3. **`GET /eventos/meus`:** A só vê os próprios; B vê conjunto distinto/vazio; anônimo → **401**  
4. **Regressão:** `GET /eventos` público lista de todos; GET lotes sem auth ok  

Preferir `ProEventos.Api.Tests` no padrão de `OwnershipParityEndpointsTests`.

### Acceptance criteria

- [ ] Organizador não altera lotes/associações de evento alheio  
- [ ] Organizador autenticado lista só os seus via `/eventos/meus`  
- [ ] Browse público intacto  
- [ ] Imagem continua URL  
- [ ] Sem mudanças de front nesta leva  
- [ ] Depara 018 atualizado com os gaps fechados  

## Implementation notes

1. Fechar ownership de Lotes e Associate primeiro (risco de segurança).  
2. Em seguida `GET /eventos/meus` + filtro no repository.  
3. Testes API + atualização do depara.  
4. Não inventar `GeralPersist`/Controllers — manter Minimal APIs e `IRepository`.

## Out of scope recap (audit leftovers)

| Item | Tratamento |
|------|------------|
| Upload multipart | Decisão local (URL) |
| GET eventos privado estrito | Rejeitado; híbrido com `/meus` |
| GAP-05 filtro Funcao | Deferido 018 |
| PageParams/PageList vs PageResultDto + header JSON | Equivalente |
| `CheckPasswordAsync` vs `CheckPasswordSignInAsync` | Equivalente para fluxo atual |
| Tipografia `DataIncio` | Débito cosmético; fora desta leva |
