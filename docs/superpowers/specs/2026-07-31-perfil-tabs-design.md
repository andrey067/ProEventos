# Design: Tabs no Perfil + espelho do card (3 fronts)

**Date:** 2026-07-31  
**Status:** Approved (brainstorming)  
**Approach:** Subcomponentes por tab (Abordagem 1) — paridade com modelo do curso Udemy  
**Fronts:** Angular, Vue, React

## Context

Hoje a página de perfil nos três fronts é um formulário monolítico (dados da conta + redes se palestrante + senha) com card à esquerda que só atualiza após load/save. O curso usa `tabset` com Perfil / Palestrante / Rede Social e `(changeFormValue)` para refletir o form no card ao vivo.

Referência de parity: `specs/018-rede-social-palestrante-parity/depara.md` (FE-RS-04, FE-PL — redes no perfil já feitos; falta estrutura em tabs + detalhe do palestrante no perfil).

## Decisions (brainstorming)

| Tema | Decisão |
|------|----------|
| Conteúdo tab Palestrante | Nome, e-mail, telefone, imagemURL + miniCurriculo (opção B) |
| Espelho do card | Ao vivo só campos da tab **Perfil** (nome, descrição) — opção A |
| Mudar senha | Dentro da tab **Perfil** — opção A |
| Quando mostrar tabs extras | Assim que `funcao === Palestrante` no form (antes de salvar) — opção A |
| Estrutura de código | Extrair subcomponentes por tab (Abordagem 1) |
| Backend | Nenhum endpoint novo; usar `GET /palestrantes/me` + `PUT /{id}` + APIs de redes já existentes |

## Goals

1. Reorganizar o painel direito do perfil em tabs: **Perfil** | **Palestrante** | **Rede Social**.
2. Mostrar Palestrante e Rede Social somente quando a função no formulário for `Palestrante`.
3. Atualizar o card à esquerda em tempo real ao editar nome/descrição na tab Perfil.
4. Isolar save por tab (perfil, palestrante, redes independentes).
5. Aplicar o mesmo comportamento e UX nos três fronts.
6. Cobrir com testes unitários/componentes migrados e novos.

## Non-goals

- Endpoints ou migrations novas no backend
- Upload multipart de imagem (manter campo URL texto)
- Espelhar no card dados da tab Palestrante ou Redes
- Auto-save / debounce de minicurrículo (manter Save explícito — decisão 018)
- Dependência nova de UI de tabs (ngx-bootstrap Tabs, etc.)
- Alterar a rota dedicada de Alterar Senha / Change Password

## Architecture

```
┌─────────────┐   changeFormValue     ┌──────────────────────────────┐
│  Card (pai) │ ◄──────────────────── │ Tab Perfil (filho)           │
│  cardView   │   (nome, descricao)   │  updateProfile + senha        │
└─────────────┘                       ├──────────────────────────────┤
                                      │ Tab Palestrante (filho)      │
                                      │  getMe + update(id)          │
                                      ├──────────────────────────────┤
                                      │ Tab Rede Social (filho)      │
                                      │  getMine / saveMine / delete │
                                      └──────────────────────────────┘
```

**Página-pai** (`ProfileComponent` / `PerfilUsuario` / `ProfilePage`):
- Layout grid: card (~280px) + painel com tabset
- Carrega perfil; mantém `snapshot` (persistido) e `cardView` (preview ao vivo)
- Controla tab ativa e `ehPalestrante` a partir do `funcao` emitido/observado da tab Perfil
- Não contém campos de formulário das tabs (só orquestra)

**Filhos** (nomes equivalentes):

| Papel | Angular (ex.) | Vue / React (ex.) |
|-------|---------------|-------------------|
| Detalhe perfil | `perfil-detalhe` | `PerfilDetalhe` |
| Detalhe palestrante | `palestrante-detalhe` (perfil) | `PalestranteDetalhe` no escopo user/perfil |
| Redes | `redes-sociais` | `RedesSociais` |

Evitar colisão com o form CRUD de palestrantes da lista: o filho do perfil fica sob `user/profile` (ou `user/perfil`), não sob `palestrantes/`.

### Tabset UI

- HTML semântico: `role="tablist"` / `tab` / `tabpanel`
- Estilos do design system atual (Tailwind tokens: `border-line`, `accent`, painel)
- Tab ativa: destaque accent + borda inferior
- Conteúdo: `border border-top-0` alinhado ao painel
- Sem biblioteca de tabs nova
- Ícones: opcionais; se o chrome já usa Font Awesome de forma consistente, pode espelhar o curso; senão só texto

### Serviços front

Adicionar nos três `PalestranteService`:

- `getMe()` → `GET /palestrantes/me`

Reutilizar `update(id, payload)` existente. Redes: APIs self-scoped já usadas no perfil.

## Data flow

### Card

| Campo | Fonte |
|-------|--------|
| Foto, `@userName`, contadores | Snapshot após load/save do perfil |
| Nome | `cardView`: `primeiroNome + ultimoNome` (ao vivo) ou `nome` do snapshot |
| Descrição | `cardView.descricao` ao vivo |

### Tab Perfil → pai

1. Form emite em toda mudança: `{ primeiroNome, ultimoNome, descricao, funcao }` (mínimo necessário para card + `ehPalestrante`).
2. Pai atualiza `cardView` e `ehPalestrante`.
3. **Cancelar:** reset form ao snapshot; `cardView` = snapshot.
4. **Salvar:** `accountService.updateProfile` → novo snapshot + card; se `funcao === Palestrante`, filhos Palestrante/Redes podem carregar.

### Tab Palestrante

1. Quando `ehPalestrante` fica true (ou ao montar já palestrante): `getMe()`.
2. Sucesso: preenche form (nome, email, telefone, imagemURL, miniCurriculo).
3. Save: `PUT /palestrantes/{id}` com id do `getMe`.
4. **404:** aviso “Salve o perfil com função Palestrante primeiro” (backend cria row em `UpdateProfile` / `EnsurePalestranteProfile`); form sem save útil até o perfil existir.
5. Não atualiza o card.

### Tab Rede Social

- Comportamento atual do bloco de redes no perfil, extraído para o filho.
- `getMine` / `saveMine` / `deleteMine` + confirm dialog.
- Sem efeito no card.

### Troca de função

- → `Palestrante`: mostra tabs; dispara load palestrante + redes.
- → outra: esconde tabs; limpa estado local dos filhos (não apaga no servidor). Se a tab ativa era Palestrante ou Rede Social, o pai volta para a tab **Perfil**.

## Error handling

- Load inicial do perfil falhou: alerta no pai (como hoje).
- Cada tab: `error` / `success` / `loading` / `saving` próprios.
- Validação: schemas/factories já usados (perfil, palestrante form, rede nome/url required).
- Troca de tab não salva; estado dos forms preservado enquanto a página estiver montada.

## Testing

Espelhar nos três fronts:

1. Tabs Palestrante/Rede ocultas se função ≠ Palestrante; visíveis ao mudar o select.
2. Digitar nome/descrição na tab Perfil atualiza o card sem save.
3. Cancelar restaura card + form ao snapshot.
4. `getMe` chamado ao virar palestrante; 404 mostra aviso.
5. Save perfil e save palestrante independentes (mocks de serviços distintos).
6. Save/delete redes com confirm (migrar testes atuais do monolito para o filho / página).

Testes de serviço: `getMe` aponta para `/palestrantes/me`.

## File touch map (orientação)

| Front | Áreas |
|-------|--------|
| Angular | `profile.component.*` → orquestra; novos filhos sob `user/profile/`; `palestrante.service.ts` + specs |
| Vue | `PerfilUsuario.vue` → orquestra; filhos em `user/perfil/`; `palestranteService.ts` + specs |
| React | `ProfilePage.tsx` → orquestra; filhos em `user/`; `palestranteService.ts` + tests |

## Acceptance criteria

- [ ] Layout card + tabs nos 3 fronts, visual alinhado ao design system
- [ ] Tab Perfil: campos atuais + senha; espelho ao vivo no card; cancel/save
- [ ] Tabs Palestrante e Rede Social só com `funcao === Palestrante` no form
- [ ] Tab Palestrante: CRUD dos campos acordados via `/me` + `PUT`
- [ ] Tab Rede Social: parity com editor atual
- [ ] `getMe` nos 3 serviços de palestrante
- [ ] Testes listados passando
- [ ] Sem regressão nas rotas de change-password / lista de palestrantes

## Out of scope reminders

Não reabrir: auto-save minicurrículo, GET redes público, POST palestrante 409 vs idempotente, upload de imagem (ver depara 018).
