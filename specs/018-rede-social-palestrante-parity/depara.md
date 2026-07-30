# Depara: Rede Social & Palestrante

**Referência:** [vsandrade/ProEventos](https://github.com/vsandrade/ProEventos) (curso Udemy)  
**Alvo:** este repositório (`pro-eventos`)  
**Data:** 2026-07-29

Legenda de status:

| Status | Significado |
|--------|-------------|
| ✅ Feito | Comportamento alinhado (ou equivalente aceitável) |
| ⚠️ Parcial | Existe, mas falta regra/UX do curso |
| ❌ Falta | Ainda não implementado |
| 🔵 Decisão local | Diferente do curso de propósito — **não** espelhar |

---

## 1. Rede Social — domínio e API

| # | Regra (curso) | Local hoje | Status | O que falta |
|---|---------------|------------|--------|-------------|
| RS-01 | Rede pertence a Evento **XOR** Palestrante | Service força `EventoId`/`PalestranteId` exclusivo no save | ✅ | — |
| RS-02 | Cascade delete ao apagar pai | EF `OnDelete(Cascade)` em `RedeSocialMapping` | ✅ | — |
| RS-03 | Upsert em lote (`Id==0` insert, `Id>0` update) | `SaveByEventoId` / `SaveByPalestranteId` | ✅ | — |
| RS-04 | Delete só com ownership (mesmo EventoId/PalestranteId) | Checa FK no delete; senão 404 | ✅ | — |
| RS-05 | Mutações exigem autenticação | PUT/DELETE com `RequireUserRolePolicy` | ✅ | — |
| RS-06 | **Só o autor do evento** lê/grava redes do evento (`AutorEvento`) | Owner check via `Evento.UserId` + JWT; GET público | ✅ | — |
| RS-07 | Redes do **palestrante logado** (URL sem `palestranteId`; resolve via JWT) | Self-scoped `/redes-sociais/palestrante` + gate no id explícito | ✅ | — |
| RS-08 | GET redes exige auth | GET anônimo | 🔵 | Manter público se produto quer browse; senão alinhar ao curso |

---

## 2. Palestrante — domínio e API

| # | Regra (curso) | Local hoje | Status | O que falta |
|---|---------------|------------|--------|-------------|
| PL-01 | 1 User → no máx. 1 Palestrante | Unique + conflict no service | ✅ | — |
| PL-02 | Criar/atualizar amarrado ao user (JWT) | POST preenche `UserId` do token se vazio; valida Identity | ✅ | — |
| PL-03 | POST idempotente (já existe → retorna existente) | Local retorna **409 Conflict** | 🔵 | Preferir 409 (mais correto); opcional endpoint “ensure” |
| PL-04 | `GET /palestrantes` = “meu” palestrante (user logado) | `GET /palestrantes/me` | ✅ | — |
| PL-05 | `PUT /palestrantes` sem id (update do próprio) | `PUT /{id}` com policy: organizer full / palestrante só próprio | ✅ | — |
| PL-06 | Lista só quem tem `Funcao == Palestrante` | Lista **todos** os registros Palestrante | ⚠️ | Ver [GAP-05](#gap-05-filtro-função-na-listagem) |
| PL-07 | Busca: MiniCurriculo + nome do User | Busca global: Nome, MiniCurriculo, Email, Telefone, tema de eventos | 🔵 | Manter busca ampliada (spec 017) |
| PL-08 | Sem DELETE de palestrante | DELETE existe | 🔵 | Manter |
| PL-09 | Campos só MiniCurriculo (+ User) | Nome, Email, Telefone, ImagemURL no próprio Palestrante | 🔵 | Manter modelo expandido |
| PL-10 | Ativar função Palestrante no perfil cria perfil | `UpdateProfile` + `EnsurePalestranteProfileAsync` | ✅ | Front já envia `funcao`; backend cria row + role |
| PL-11 | Associate/disassociate evento↔palestrante | Existe em EventoEndpoints + service | ✅ | — |
| PL-12 | Paginação server-side | Page 10/20/30 + header | ✅ | Curso usava máx. 50; local é decisão 011 |

---

## 3. Frontend — Rede Social

| # | Regra (curso) | Local hoje | Status | O que falta |
|---|---------------|------------|--------|-------------|
| FE-RS-01 | `nome` e `url` **required** no FormArray | Validação nos 3 fronts | ✅ | — |
| FE-RS-02 | Confirmação antes de excluir | Confirm dialog / `window.confirm` nos 3 fronts | ✅ | — |
| FE-RS-03 | Origem evento vs palestrante (`eventoId !== 0`) | Serviços separados `…/evento/{id}` e `…/palestrante/{id}` | ✅ | — |
| FE-RS-04 | Componente redes no **perfil** quando `ehPalestrante` | Editor de redes no perfil (3 fronts) via API self-scoped | ✅ | — |
| FE-RS-05 | Gate de escrita (só organizador) | `canWrite()` esconde/desabilita mutações | ✅ | — |

---

## 4. Frontend — Palestrante

| # | Regra (curso) | Local hoje | Status | O que falta |
|---|---------------|------------|--------|-------------|
| FE-PL-01 | Lista paginada + filtro debounce | 3 fronts com debounce + paginação | ✅ | — |
| FE-PL-02 | Auto-save minicurrículo (debounce ~1s) | Form explícito Save (CRUD) | 🔵 | Curso UX; local é form clássico — opcional |
| FE-PL-03 | Perfil chama `post()` ao setar Funcao=Palestrante | Backend `EnsurePalestranteProfile` no update; front não chama post extra | ✅ | Equivalente |
| FE-PL-04 | Imagem fallback se sem URL | Placeholder / broken-image handling | ✅ | — |
| FE-PL-05 | AuthGuard nas rotas de palestrantes | Rotas autenticadas + canWrite para mutação | ✅ | — |
| FE-PL-06 | Tela “meu palestrante” sem escolher id | CRUD por `/palestrantes/:id` / `new` | ⚠️ | Depende de GAP-03; atalho no perfil útil |

---

## 5. Pré-requisito estrutural (bloqueia RS-06)

| # | Regra (curso) | Local hoje | Status | O que falta |
|---|---------------|------------|--------|-------------|
| EV-01 | `Evento.UserId` + filtro “meus eventos” | `Evento.UserId` + ownership em mutações; lista permanece pública | ✅ | — |

Sem `Evento.UserId`, ownership de redes/eventos do curso **não dá** para espelhar de forma correta.

---

## Gaps priorizados (ainda implementar)

### GAP-01 — Ownership de Evento (UserId)

**Prioridade:** P0 (bloqueia parity de segurança)  
**Camadas:** Domain → Persistence (migration) → Services/Endpoints Evento + RedeSocial → Fronts (só “meus” eventos se desejado)

- Adicionar `UserId` (string) em `Evento`
- Preencher no create com user autenticado
- Filtrar update/delete/redes: só dono (ou role admin, se houver)
- Testes API: user A não altera redes/evento de user B

### GAP-02 — Redes do palestrante autenticado

**Prioridade:** P0  
**Camadas:** `RedeSocialEndpoints` (+ opcional service)

- Rotas espelho do curso: `GET/PUT /redes-sociais/palestrante`, `DELETE /redes-sociais/palestrante/{redeSocialId}`
- Resolver `palestranteId` via `GetPalestranteByUserIdAsync(userId)`
- Sem perfil → 401/403
- Manter rotas com `{palestranteId}` **ou** restringi-las a dono/User role

### GAP-03 — Endpoint “meu palestrante”

**Prioridade:** P1  
**Camadas:** `PalestranteEndpoints` + services front

- `GET /palestrantes/me` (ou `GET /palestrantes` sem page params = me — evitar conflito com lista)
- Preferência local: **`GET /palestrantes/me`** para não quebrar lista paginada em `/`

### GAP-04 — Update somente do próprio perfil

**Prioridade:** P1  
**Camadas:** `PalestranteEndpoints` / `PalestranteService`

- Em PUT/DELETE: se role `Palestrante`, só o próprio `UserId`
- Role `User` (organizador): pode manter CRUD amplo **ou** alinhar 100% ao curso (só próprio) — decidir na spec
- Sugestão: organizador (`User`) CRUD total; palestrante só o próprio

### GAP-05 — Filtro função na listagem

**Prioridade:** P2  
**Camadas:** Repository query

- Opcional `?funcao=Palestrante` ou sempre filtrar users com `Funcao.Palestrante` / role
- Como Palestrante local tem `Nome` próprio, filtrar por existência de row já lista speakers; alinhar a `User.Funcao` se quiser parity estrita

### GAP-06 — Validação nome/url nas redes

**Prioridade:** P1  
**Camadas:** Angular `createRedeGroup`; Vue `redeSocialFormSchema`; React `redeSocialSchema`

- `nome` e `url` obrigatórios (trim min 1); URL opcionalmente `Validators`/`z.string().url()`
- Bloquear save do form pai se redes inválidas
- Testes de form/schema

### GAP-07 — Redes sociais no perfil do palestrante

**Prioridade:** P2  
**Camadas:** Profile UI (Angular/Vue/React)

- Se `funcao === Palestrante` (ou role), mostrar editor de redes usando GAP-02
- Reutilizar padrão do form de palestrante (não duplicar lógica de API)

---

## Matriz rápida: implementar vs manter

| Item | Ação |
|------|------|
| Ownership Evento + redes (GAP-01, RS-06) | **Implementar** |
| Redes scoped ao JWT do palestrante (GAP-02, RS-07) | **Implementar** |
| GET/me palestrante (GAP-03) | **Implementar** |
| Autorização PUT próprio vs organizador (GAP-04) | **Implementar** (política híbrida) |
| Validação FE redes (GAP-06) | **Implementar** |
| Redes no perfil (GAP-07) | **Implementar** (UX curso) |
| Filtro Funcao na lista (GAP-05) | Opcional / baixo |
| Auto-save minicurrículo | **Não** (manter Save explícito) |
| DELETE palestrante, modelo expandido, busca 017 | **Não reverter** |
| GET redes público | **Manter** (decisão produto) |
| POST 409 vs idempotente | **Manter 409** |

---

## Ordem sugerida de entrega

1. **GAP-01** (UserId no Evento + ownership)  
2. **GAP-02** + **GAP-06** (redes seguras + validação FE)  
3. **GAP-03** + **GAP-04** (me + autorização palestrante)  
4. **GAP-07** (perfil)  
5. **GAP-05** se ainda fizer sentido  

Detalhamento de aceite: [`spec.md`](./spec.md) · backlog: [`tasks.md`](./tasks.md)
