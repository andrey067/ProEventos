# Feature Specification: Rede Social & Palestrante — Parity Gaps

**Feature Branch**: `018-rede-social-palestrante-parity`  
**Created**: 2026-07-29  
**Status**: Draft  
**Input**: Depara curso [vsandrade/ProEventos](https://github.com/vsandrade/ProEventos) × repo local — ver [`depara.md`](./depara.md)

## User Scenarios & Testing

### User Story 1 — Organizador só gerencia redes dos próprios eventos (Priority: P1)

Como organizador autenticado (role `User`), quero que apenas eu possa criar/editar/excluir redes sociais dos eventos que eu criei, para que outro organizador não altere minha vitrine.

**Why this priority**: Sem `Evento.UserId` e checagem de ownership, qualquer User altera redes de qualquer evento (lacuna de segurança vs curso).

**Independent Test**: User A cria evento; User B autenticado tenta PUT/DELETE em `/redes-sociais/evento/{idA}` → 401/403; User A consegue.

**Acceptance Scenarios**:

1. **Given** evento criado por User A, **When** User A faz PUT de redes, **Then** 200 e redes persistidas.
2. **Given** mesmo evento, **When** User B (role User) faz PUT/DELETE nas redes, **Then** 403 (ou 404 sem vazar existência — escolher e documentar).
3. **Given** User B, **When** GET público das redes do evento A, **Then** 200 (browse público permanece).

---

### User Story 2 — Palestrante gerencia só as próprias redes via JWT (Priority: P1)

Como palestrante autenticado, quero salvar/excluir minhas redes sem informar `palestranteId` na URL (API resolve pelo token), como no curso.

**Why this priority**: Hoje qualquer User pode PUT em `/redes-sociais/palestrante/{qualquerId}`.

**Independent Test**: Login palestrante sem perfil → 401/403; com perfil → PUT `/redes-sociais/palestrante` salva só o próprio id.

**Acceptance Scenarios**:

1. **Given** user com Palestrante vinculado, **When** GET `/redes-sociais/palestrante`, **Then** lista só redes desse id.
2. **Given** mesmo user, **When** PUT body com `palestranteId` de outro, **Then** service ignora e força o id do token.
3. **Given** user sem Palestrante, **When** GET/PUT self-scoped, **Then** 401/403.

---

### User Story 3 — Validação de Nome/URL nas redes (Priority: P1)

Como usuário no formulário de Evento ou Palestrante, não consigo salvar redes com nome ou URL vazios.

**Acceptance Scenarios**:

1. **Given** linha de rede com nome vazio, **When** submit, **Then** form inválido e nenhum PUT de redes.
2. **Given** nome e url preenchidos (trim), **When** submit, **Then** save segue o fluxo atual.

---

### User Story 4 — “Meu palestrante” + autorização de escrita (Priority: P2)

Como palestrante, quero `GET /palestrantes/me` e só poder atualizar o meu registro; organizador (role `User`) mantém CRUD amplo.

**Acceptance Scenarios**:

1. **Given** palestrante logado, **When** GET `/palestrantes/me`, **Then** 200 com seu DTO (include redes opcional).
2. **Given** palestrante, **When** PUT em id de outro palestrante, **Then** 403.
3. **Given** role User, **When** PUT em qualquer id válido, **Then** 200 (política híbrida).

---

### User Story 5 — Redes no perfil quando função é Palestrante (Priority: P3)

Como usuário com `funcao === Palestrante`, vejo no perfil um bloco de redes sociais que usa a API self-scoped (US2).

**Acceptance Scenarios**:

1. **Given** perfil com função Palestrante, **When** abro perfil, **Then** editor de redes carrega via endpoint self-scoped.
2. **Given** função Participante, **When** abro perfil, **Then** bloco de redes não aparece.

---

## Edge Cases

- Eventos legados sem `UserId` após migration: definir backfill (seed admin / nullable + deny writes até claim) — documentar em research na implementação.
- Update de rede com `Id` que não pertence ao dono: skip ou 404 (hoje skip no save) — preferir consistência com delete (404).
- Conflito rota `GET /palestrantes/me` vs `GET /palestrantes/{id}`: registrar `me` **antes** de `{id:int}`.

## Requirements

### Functional Requirements

- **FR-001**: `Evento` MUST ter `UserId` (string Identity) preenchido na criação autenticada.
- **FR-002**: Mutações de Evento e de Redes por Evento MUST exigir que o caller seja o dono **ou** role `User` com política explícita; default sugerido: **somente dono** para redes (parity curso). Role `User` que não é dono → deny.
- **FR-003**: MUST existir API self-scoped de redes do palestrante autenticado (GET/PUT/DELETE sem palestranteId na path, exceto redeSocialId no delete).
- **FR-004**: Mutações self-scoped MUST forçar `PalestranteId` do token; MUST reject se não houver perfil.
- **FR-005**: Fronts Angular, Vue e React MUST validar `nome` e `url` obrigatórios em cada rede antes do save.
- **FR-006**: MUST expor `GET /palestrantes/me` autenticado.
- **FR-007**: Role `Palestrante` MUST só alterar o próprio Palestrante; role `User` MAY alterar qualquer um.
- **FR-008**: Perfil (3 fronts) SHOULD mostrar editor de redes quando função/role for palestrante.

### Non-goals (explicit)

- Reverter DELETE de palestrante, modelo expandido, ou busca global 017.
- Auto-save de minicurrículo com debounce.
- Tornar GET de redes autenticado (permanece público).

## Success Criteria

- **SC-001**: Testes API cobrem cross-user deny em redes de evento e self-scoped palestrante.
- **SC-002**: Specs de form/schema nos 3 fronts falham se nome/url vazios forem aceitos.
- **SC-003**: Depara items GAP-01, GAP-02, GAP-06 marcados feitos; GAP-03/04/07 conforme stories P2/P3.
