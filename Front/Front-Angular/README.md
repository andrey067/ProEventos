# Front-Angular — ProEventos

Frontend de estudo em **Angular 21 (standalone) + HttpClient + CSS**.

App **independente** — use o `package.json` desta pasta. Package manager: **pnpm**.

Consulte também o [README do repositório](../../README.md).

## Pré-requisitos

- Node.js 20+ e pnpm
- API ProEventos em `http://localhost:5050` (pasta `Back/`)

## Configuração

A URL da API vem do `.env` (`NG_APP_API_URL`), tipada em `src/env.d.ts` e exposta via `src/environments/environment.ts`:

```bash
cp .env.example .env
```

```typescript
// src/environments/environment.ts
export const environment = {
  apiUrl: import.meta.env.NG_APP_API_URL,
};
```

## Setup e execução (porta 4200)

```bash
cd Front/Front-Angular
cp .env.example .env
pnpm install
pnpm dev      # alias: pnpm start
```

Abra [http://localhost:4200](http://localhost:4200) — a rota raiz redireciona para `/eventos`.

## Testes

```bash
pnpm test              # rápido, sem gate
pnpm test:coverage     # Vitest + v8; falha se coverage < 80%
```

Exclusões do denominador: `*.d.ts`, CSS, `src/test-setup.ts`. Páginas, router e App **entram** no gate.

Runner Angular CLI (se configurado com browser):

```bash
pnpm run test:ng
```

## Rotas

| Rota | Descrição |
|------|-----------|
| `/eventos` | Lista, busca por tema, excluir |
| `/eventos/new` | Criar evento |
| `/eventos/:id` | Editar evento + lotes/redes |
| `/palestrantes` | CRUD simples inline |
| `/login` | Shell (sem API) |

## Estrutura

- `src/app/services/` — serviços HTTP da API
- `src/app/components/eventos|palestrantes|user/` — telas por domínio (Feature Based)
- `src/app/shared/` — nav, confirm-dialog e chrome reutilizável
- `src/app/models/` — tipos das entidades da API
- `src/app/forms/` — schemas/validators de formulário
- `src/environments/` — configuração da API
