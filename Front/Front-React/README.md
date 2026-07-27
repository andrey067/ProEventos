# Front-React (Vite + TypeScript)

SPA de estudo ProEventos com React 19, Vite 6, TypeScript e React Router.

App **independente** — use o `package.json` desta pasta.

## Pré-requisitos

- Node.js 20+ e pnpm
- API em `http://localhost:5050`

## Setup e execução

```bash
cd Front/Front-React
cp .env.example .env
pnpm install
pnpm dev      # http://localhost:3000
```

API URL tipada: `VITE_API_URL` em `.env` (`src/vite-env.d.ts`).

## Outros scripts

```bash
pnpm test              # rápido, sem gate
pnpm test:coverage     # Vitest + v8; falha se coverage < 80%
pnpm build
```

Exclusões do denominador: `*.d.ts`, CSS, `src/test/setup.ts`. Páginas, Nav e App **entram** no gate.

Variável de ambiente: `VITE_API_URL` (padrão `http://localhost:5050`).

Documentação geral: [README raiz](../../README.md)
