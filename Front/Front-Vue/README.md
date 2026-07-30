# Front-Vue

Vue 3.5 + Vite 6 + Element Plus consumindo a API ProEventos.

App **independente** — use o `package.json` desta pasta.

## Setup e execução

```bash
cd Front/Front-Vue
cp .env.example .env
pnpm install
pnpm dev      # http://localhost:5173
```

Porta **5173**. API tipada: `VITE_API_URL` em `.env` (`src/vite-env.d.ts`; default de estudo `http://localhost:5050`).

## Testes

```bash
pnpm test              # rápido, sem gate
pnpm test:coverage     # Vitest + v8; falha se lines/functions/branches/statements < 90
```

Exclusões do denominador: `*.d.ts`, CSS, arquivos de setup de teste. Páginas, router e App **entram** no gate.

Documentação geral: [README raiz](../../README.md)
