# Design: Catálogo de motion nos três frontends

**Date:** 2026-07-30  
**Status:** Approved (brainstorming)  
**Approach:** Catálogo de patterns + wrappers finos por stack (tokens CSS compartilhados)

## Context

ProEventos tem três frontends parity (`Front-React`, `Front-Vue`, `Front-Angular`) com o mesmo design system (Tailwind v4, Outfit, accent teal, `--radius-control`). Hoje o motion é só CSS pontual (`transition-colors`, `active:scale-[0.98]`). Angular já tem `@angular/animations` / `provideAnimations()`; React e Vue não têm lib de motion.

Isto é **produto CRUD** (listas, forms, auth, perfil), não landing. Princípios do design-taste-frontend aplicam-se aos dials, reduced-motion e motion motivada; padrões de marketing (marquee, sticky-stack, magnetic, scroll-hijack) ficam fora.

## Decisions (brainstorming)

| Tema | Decisão |
|------|----------|
| Intensidade | **B** — fluida / polished (`MOTION_INTENSITY` ~5–6) |
| Escopo de telas | **A** — patterns em todas as surfaces dos três fronts |
| Stack | **A** — tokens CSS + Motion (`motion/react`) / Vue `<Transition>` / Angular animations |
| Organização | **1** — catálogo único + wrappers finos por framework |
| Dials | Variance 5 · Motion 6 · Density 5 |

## Goals

1. Linguagem de motion única e auditável nos três fronts.
2. Cobrir chrome global (rota, nav, modal, loading skeleton) e todas as telas de produto.
3. Respeitar `prefers-reduced-motion` de forma centralizada.
4. Não regressar fluxos CRUD nem flakes de E2E (não assertar frames).

## Non-goals

- Landing / marketing pages
- GSAP, parallax, shared-element lista→detalhe, magnetic physics, marquees
- Redesign de layout, tipografia ou dark-mode toggle novo
- Substituir spinners de submit por skeleton (skeleton só para conteúdo ainda vazio)
- Assertar animações no E2E

## Architecture

### Tokens (fonte de verdade)

Espelhar nos três CSS de tema (`Front-React/src/index.css`, `Front-Vue/src/style.css`, `Front-Angular/src/tailwind.css` e/ou `:root` em `styles.scss`):

| Token | Valor | Uso |
|-------|-------|-----|
| `--motion-fast` | `150ms` | hover, press |
| `--motion-base` | `220ms` | page fade, alerts |
| `--motion-slow` | `320ms` | modal, route |
| `--motion-ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | enter |
| `--motion-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | exit |
| `--motion-stagger` | `40ms` | itens de lista |

Reduced-motion: sob `prefers-reduced-motion: reduce`, durações → `0` (ou instant), sem translate/scale/stagger/shimmer; só show/hide.

### Catálogo de patterns

| Pattern | Comportamento |
|---------|----------------|
| **PageEnter** | Conteúdo da página: **somente** `y: 8px → 0` (sem opacity extra) |
| **RouteFade** | Outlet / router-view: **somente** opacity enter/leave |
| **ListStagger** | Rows/cards; stagger `--motion-stagger`; só na primeira carga / rebuild da lista |
| **ModalMotion** | ConfirmDialog: backdrop fade + painel scale `0.98 → 1` |
| **AlertMotion** | Banners success/error |
| **PanelEnter** | Blocos de formulário (dados, lotes, redes, palestrantes) |
| **ButtonPress** | Padronizar `active:scale-[0.98]` com `--motion-fast` |
| **SkeletonShimmer** | Placeholder de listas/detalhe durante load |
| **NavChrome** | Drawer mobile open/close + hover/active de links |
| **EmptyState** | Fade do empty / filter-zero |

### Wrappers por stack

| Front | Local | Tecnologia |
|-------|-------|------------|
| React | `src/shared/motion/` | `motion` package (`motion/react`) |
| Vue | `src/shared/motion/` | `<Transition>` / `<TransitionGroup>` + classes CSS do catálogo |
| Angular | `src/app/shared/motion/` | animation triggers + `provideAnimations()` (já ligado) |

Telas **consomem** primitives; não inventam keyframes locais.

### Regra anti-duplo-enter

RouteFade e PageEnter **compõem** um único enter: opacity no outlet + translate no conteúdo. Não duplicar opacity nem translate nos dois. Formulários longos: animar o painel (`PanelEnter`), não cada input. Modal acima de tudo; backdrop sem stagger.

## Screen mapping

| Surface | Patterns |
|---------|----------|
| Layout + Nav | RouteFade no outlet; NavChrome |
| Login / Register / Alterar senha | PageEnter; AlertMotion; ButtonPress |
| Eventos lista / Palestrantes lista | PageEnter; SkeletonShimmer; ListStagger; AlertMotion; EmptyState; ButtonPress |
| Evento detalhe / form | PageEnter; PanelEnter por bloco; AlertMotion; ButtonPress |
| Palestrante form | PageEnter; PanelEnter; AlertMotion; ButtonPress |
| Perfil | PageEnter; PanelEnter (dados + redes); AlertMotion |
| ConfirmDialog | ModalMotion |
| Loading overlays atuais | Mantidos; SkeletonShimmer complementar |

## Dependencies

- **React:** adicionar `motion`
- **Vue / Angular:** nenhuma lib nova

## Error handling & a11y

- Reduced-motion obrigatório nos três fronts (tokens + wrappers).
- Foco/teclado inalterados; motion não atrasa focus do modal.
- Shimmer só em placeholders; pausa sob reduced-motion.
- React: se Motion indisponível em teste, wrapper degrada para elemento estático.
- Lista vazia / erro de API → EmptyState ou AlertMotion, nunca ListStagger em zero itens.
- Troca rápida de rota: cancelar/ignorar leave incompleto (`AnimatePresence` / Vue transition / Angular).

## Testing

- Unit: primitives montam; `matchMedia('(prefers-reduced-motion: reduce)')` desliga motion.
- Smoke: Login, lista Eventos, ConfirmDialog sem regressão em cada front.
- E2E: apenas presença de UI e fluxos; **não** assertar frames de animação.

## Implementation order (high level)

1. Tokens + reduced-motion nos três CSS.
2. Primitives `shared/motion` por front (React + dep `motion`).
3. Chrome: RouteFade, NavChrome, ModalMotion, SkeletonShimmer.
4. Auth pages → listas → forms/detalhe/perfil.
5. Testes unitários dos wrappers + smoke.

## Success criteria

- Mesmos timings/easings perceptíveis nos três fronts.
- Toda surface da tabela de mapeamento usa só o catálogo.
- Reduced-motion verificado manualmente e em unit dos wrappers.
- Builds e testes existentes verdes; E2E sem asserts de animação.
