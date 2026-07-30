# Frontend Motion Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared motion catalog (tokens + primitives) and wire it across React, Vue, and Angular so every product surface uses the same timings, easings, and reduced-motion behavior.

**Architecture:** CSS custom properties (`--motion-*`) mirrored in all three theme stylesheets are the single source of truth. Thin wrappers per stack (`motion/react`, Vue `<Transition>`/`<TransitionGroup>`, Angular `@angular/animations`) implement the catalog patterns. Pages only compose those wrappers — no ad-hoc keyframes. RouteFade (opacity on outlet) + PageEnter (translate-y on page root) compose one enter; never stack the same effect twice.

**Tech Stack:** Tailwind v4, Vitest + Testing Library / Vue Test Utils, React 19 + `motion`, Vue 3 transitions, Angular 21 + `@angular/animations` (already provided).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-30-frontend-motion-catalog-design.md`
- Tokens: `--motion-fast: 150ms`, `--motion-base: 220ms`, `--motion-slow: 320ms`, `--motion-ease: cubic-bezier(0.16, 1, 0.3, 1)`, `--motion-ease-exit: cubic-bezier(0.4, 0, 1, 1)`, `--motion-stagger: 40ms`
- `prefers-reduced-motion: reduce` → no translate/scale/stagger/shimmer; instant show/hide
- React only new dependency: `motion` (`motion/react`); Vue/Angular: no new libs
- E2E must not assert animation frames
- Keep existing LoadingSpinner overlays; SkeletonShimmer only for empty content placeholders
- No GSAP, parallax, marquees, shared-element, landing patterns
- ButtonPress: keep `active:scale-[0.98]` but drive duration via `--motion-fast`
- Portuguese UI copy unchanged

## File map

| Responsibility | Create / Modify |
|----------------|-----------------|
| Motion tokens + CSS utilities | Modify: `Front/Front-React/src/index.css`, `Front/Front-Vue/src/style.css`, `Front/Front-Angular/src/styles.scss` |
| React primitives | Create: `Front/Front-React/src/shared/motion/*` |
| Vue primitives | Create: `Front/Front-Vue/src/shared/motion/*` |
| Angular primitives | Create: `Front/Front-Angular/src/app/shared/motion/*` |
| React chrome | Modify: `App.tsx`, `shared/Nav.tsx`, `shared/ConfirmDialog.tsx` |
| Vue chrome | Modify: `App.vue`, `shared/MenuComponent.vue`, `shared/ConfirmDialog.vue` |
| Angular chrome | Modify: `app.ts`, `app.html`, `shared/nav/*`, `shared/confirm-dialog/*` |
| React pages | Modify: Login/Register/ChangePassword/Profile, Eventos/Palestrantes pages + forms/detail |
| Vue pages | Modify: login/registro/senha/perfil, EventoLista/Detalhes/Formulario, Palestrantes*, LotesEvento |
| Angular pages | Modify: login/register/change-password/profile, eventos-list/evento-form, palestrantes/palestrante-form |

---

### Task 1: Motion tokens + CSS utilities (all three fronts)

**Files:**
- Modify: `Front/Front-React/src/index.css`
- Modify: `Front/Front-Vue/src/style.css`
- Modify: `Front/Front-Angular/src/styles.scss`
- Create: `Front/Front-React/src/shared/motion/tokens.test.ts` (asserts CSS vars exist after import)

**Interfaces:**
- Consumes: none
- Produces: CSS variables `--motion-fast|base|slow|ease|ease-exit|stagger`; utility classes `.motion-fade-*`, `.motion-panel-*`, `.motion-alert-*`, `.motion-empty-*`, `.motion-modal-backdrop-*`, `.motion-modal-panel-*`, `.motion-nav-drawer-*`, `.motion-press`, `.motion-skeleton` (+ reduced-motion overrides)

- [ ] **Step 1: Write the failing token test (React)**

```ts
// Front/Front-React/src/shared/motion/tokens.test.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("motion tokens css", () => {
  it("defines shared motion variables in index.css", () => {
    const css = readFileSync(
      resolve(__dirname, "../../index.css"),
      "utf8",
    );
    for (const token of [
      "--motion-fast",
      "--motion-base",
      "--motion-slow",
      "--motion-ease",
      "--motion-ease-exit",
      "--motion-stagger",
    ]) {
      expect(css).toContain(token);
    }
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain(".motion-press");
    expect(css).toContain(".motion-skeleton");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "Front/Front-React" && pnpm test -- src/shared/motion/tokens.test.ts`
Expected: FAIL (file missing or tokens absent)

- [ ] **Step 3: Add tokens + utilities to React `index.css`**

Inside existing `@theme { ... }` block, append:

```css
  --motion-fast: 150ms;
  --motion-base: 220ms;
  --motion-slow: 320ms;
  --motion-ease: cubic-bezier(0.16, 1, 0.3, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --motion-stagger: 40ms;
```

After `@layer base { ... }`, add:

```css
@layer utilities {
  .motion-press {
    transition: transform var(--motion-fast) var(--motion-ease);
  }
  .motion-press:active:not(:disabled) {
    transform: scale(0.98);
  }

  .motion-skeleton {
    background: linear-gradient(
      90deg,
      var(--color-line) 0%,
      var(--color-surface) 50%,
      var(--color-line) 100%
    );
    background-size: 200% 100%;
    animation: motion-shimmer var(--motion-slow) linear infinite;
  }

  @keyframes motion-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Vue / shared class names (also usable from React for CSS-only bits) */
  .motion-fade-enter-active,
  .motion-fade-leave-active {
    transition: opacity var(--motion-slow) var(--motion-ease);
  }
  .motion-fade-enter-from,
  .motion-fade-leave-to { opacity: 0; }
  .motion-fade-enter-to,
  .motion-fade-leave-from { opacity: 1; }

  .motion-panel-enter-active,
  .motion-panel-leave-active {
    transition: transform var(--motion-base) var(--motion-ease),
      opacity var(--motion-base) var(--motion-ease);
  }
  .motion-panel-enter-from { opacity: 0; transform: translateY(8px); }
  .motion-panel-enter-to { opacity: 1; transform: translateY(0); }
  .motion-panel-leave-from { opacity: 1; }
  .motion-panel-leave-to { opacity: 0; }

  .motion-alert-enter-active,
  .motion-alert-leave-active {
    transition: opacity var(--motion-base) var(--motion-ease),
      transform var(--motion-base) var(--motion-ease);
  }
  .motion-alert-enter-from { opacity: 0; transform: translateY(-4px); }
  .motion-alert-enter-to { opacity: 1; transform: translateY(0); }
  .motion-alert-leave-to { opacity: 0; }

  .motion-empty-enter-active {
    transition: opacity var(--motion-base) var(--motion-ease);
  }
  .motion-empty-enter-from { opacity: 0; }
  .motion-empty-enter-to { opacity: 1; }

  .motion-modal-backdrop-enter-active,
  .motion-modal-backdrop-leave-active {
    transition: opacity var(--motion-slow) var(--motion-ease);
  }
  .motion-modal-backdrop-enter-from,
  .motion-modal-backdrop-leave-to { opacity: 0; }

  .motion-modal-panel-enter-active,
  .motion-modal-panel-leave-active {
    transition: transform var(--motion-slow) var(--motion-ease),
      opacity var(--motion-slow) var(--motion-ease);
  }
  .motion-modal-panel-enter-from { opacity: 0; transform: scale(0.98); }
  .motion-modal-panel-enter-to { opacity: 1; transform: scale(1); }
  .motion-modal-panel-leave-to { opacity: 0; transform: scale(0.98); }

  .motion-nav-drawer-enter-active,
  .motion-nav-drawer-leave-active {
    transition: opacity var(--motion-base) var(--motion-ease),
      transform var(--motion-base) var(--motion-ease);
  }
  .motion-nav-drawer-enter-from { opacity: 0; transform: translateY(-6px); }
  .motion-nav-drawer-enter-to { opacity: 1; transform: translateY(0); }
  .motion-nav-drawer-leave-to { opacity: 0; transform: translateY(-6px); }

  .motion-list-enter-active {
    transition: opacity var(--motion-base) var(--motion-ease),
      transform var(--motion-base) var(--motion-ease);
    transition-delay: calc(var(--motion-stagger-index, 0) * var(--motion-stagger));
  }
  .motion-list-enter-from { opacity: 0; transform: translateY(6px); }
  .motion-list-enter-to { opacity: 1; transform: translateY(0); }
  .motion-list-move {
    transition: transform var(--motion-base) var(--motion-ease);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .motion-press:active:not(:disabled) {
    transform: none;
  }

  .motion-skeleton {
    animation: none;
    background: var(--color-line);
  }
}
```

- [ ] **Step 4: Mirror the same `@theme` motion vars + `@layer utilities` + reduced-motion block into Vue `style.css` and Angular `styles.scss`**

Copy the exact same token names and class names (parity). Angular already has `@theme` in `styles.scss` — add vars there. Vue uses `style.css` like React.

Also add a Vue/Angular source-scan test mirroring React:

- Create: `Front/Front-Vue/src/shared/motion/tokens.spec.ts` (same `readFileSync` against `../../style.css`)
- Create: `Front/Front-Angular/src/app/shared/motion/tokens.spec.ts` (against `../../../styles.scss`)

- [ ] **Step 5: Run token tests**

Run:
```bash
cd "Front/Front-React" && pnpm test -- src/shared/motion/tokens.test.ts
cd "Front/Front-Vue" && pnpm test -- src/shared/motion/tokens.spec.ts
cd "Front/Front-Angular" && pnpm test -- src/app/shared/motion/tokens.spec.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add Front/Front-React/src/index.css Front/Front-React/src/shared/motion/tokens.test.ts \
  Front/Front-Vue/src/style.css Front/Front-Vue/src/shared/motion/tokens.spec.ts \
  Front/Front-Angular/src/styles.scss Front/Front-Angular/src/app/shared/motion/tokens.spec.ts
git commit -m "feat(front): add shared motion design tokens and CSS utilities"
```

---

### Task 2: React motion primitives (core + reduced-motion)

**Files:**
- Create: `Front/Front-React/src/shared/motion/usePrefersReducedMotion.ts`
- Create: `Front/Front-React/src/shared/motion/usePrefersReducedMotion.test.ts`
- Create: `Front/Front-React/src/shared/motion/PageEnter.tsx`
- Create: `Front/Front-React/src/shared/motion/PageEnter.test.tsx`
- Create: `Front/Front-React/src/shared/motion/RouteFade.tsx`
- Create: `Front/Front-React/src/shared/motion/ListStagger.tsx`
- Create: `Front/Front-React/src/shared/motion/ListStagger.test.tsx`
- Create: `Front/Front-React/src/shared/motion/ModalMotion.tsx`
- Create: `Front/Front-React/src/shared/motion/AlertMotion.tsx`
- Create: `Front/Front-React/src/shared/motion/PanelEnter.tsx`
- Create: `Front/Front-React/src/shared/motion/SkeletonShimmer.tsx`
- Create: `Front/Front-React/src/shared/motion/SkeletonShimmer.test.tsx`
- Create: `Front/Front-React/src/shared/motion/EmptyState.tsx`
- Create: `Front/Front-React/src/shared/motion/index.ts`
- Modify: `Front/Front-React/package.json` (add `motion`)

**Interfaces:**
- Consumes: CSS tokens from Task 1; package `motion`
- Produces:
  - `usePrefersReducedMotion(): boolean`
  - `PageEnter({ children, className? })` — translateY only
  - `RouteFade({ children, routeKey })` — opacity only via `AnimatePresence`
  - `ListStagger({ children })` + `ListStaggerItem({ children, index })`
  - `ModalMotion({ open, onCancel, children })` — backdrop + panel; children = dialog body
  - `AlertMotion({ show, children, className? })`
  - `PanelEnter({ children, className? })`
  - `SkeletonShimmer({ className?, rows?: number })`
  - `EmptyState({ show, children, className? })`

- [ ] **Step 1: Install `motion`**

```bash
cd "Front/Front-React" && pnpm add motion
```

- [ ] **Step 2: Write failing tests for hook + PageEnter + ListStagger + Skeleton**

```ts
// usePrefersReducedMotion.test.ts
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("usePrefersReducedMotion", () => {
  it("returns true when reduced motion preferred", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it("returns false when motion is allowed", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });
});
```

```tsx
// PageEnter.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageEnter } from "./PageEnter";

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => false,
}));

describe("PageEnter", () => {
  it("renders children", () => {
    render(
      <PageEnter>
        <h1>Olá</h1>
      </PageEnter>,
    );
    expect(screen.getByRole("heading", { name: "Olá" })).toBeTruthy();
  });
});
```

```tsx
// ListStagger.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ListStagger, ListStaggerItem } from "./ListStagger";

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => true,
}));

describe("ListStagger", () => {
  it("renders items when reduced motion is on (static)", () => {
    render(
      <ListStagger>
        <ListStaggerItem index={0}>A</ListStaggerItem>
        <ListStaggerItem index={1}>B</ListStaggerItem>
      </ListStagger>,
    );
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
  });
});
```

```tsx
// SkeletonShimmer.test.tsx
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SkeletonShimmer } from "./SkeletonShimmer";

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => false,
}));

describe("SkeletonShimmer", () => {
  it("renders placeholder rows with motion-skeleton class", () => {
    const { container } = render(<SkeletonShimmer rows={3} />);
    expect(container.querySelectorAll(".motion-skeleton").length).toBe(3);
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

Run: `cd "Front/Front-React" && pnpm test -- src/shared/motion/`
Expected: FAIL (modules missing)

- [ ] **Step 4: Implement primitives**

```ts
// usePrefersReducedMotion.ts
import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(QUERY).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
```

```tsx
// PageEnter.tsx
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Props = { children: ReactNode; className?: string };

export function PageEnter({ children, className }: Props) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ y: 8 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

```tsx
// RouteFade.tsx
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Props = { routeKey: string; children: ReactNode };

export function RouteFade({ routeKey, children }: Props) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

```tsx
// ListStagger.tsx
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export function ListStagger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function ListStaggerItem({
  children,
  index,
  className,
}: {
  children: ReactNode;
  index: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.22,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
```

```tsx
// ModalMotion.tsx
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Props = {
  open: boolean;
  onCancel: () => void;
  children: ReactNode;
};

export function ModalMotion({ open, onCancel, children }: Props) {
  const reduced = usePrefersReducedMotion();
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          role="presentation"
          onClick={onCancel}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.32 }}
        >
          <motion.div
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: reduced ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
```

```tsx
// AlertMotion.tsx
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Props = { show: boolean; children: ReactNode; className?: string };

export function AlertMotion({ show, children, className }: Props) {
  const reduced = usePrefersReducedMotion();
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className={className}
          initial={reduced ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.22 }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
```

```tsx
// PanelEnter.tsx
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Props = { children: ReactNode; className?: string };

export function PanelEnter({ children, className }: Props) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

```tsx
// SkeletonShimmer.tsx
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Props = { rows?: number; className?: string };

export function SkeletonShimmer({ rows = 4, className }: Props) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className={className ?? "flex flex-col gap-3"} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={
            reduced
              ? "h-10 rounded-[length:var(--radius-control)] bg-line"
              : "motion-skeleton h-10 rounded-[length:var(--radius-control)]"
          }
        />
      ))}
    </div>
  );
}
```

```tsx
// EmptyState.tsx
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Props = { show: boolean; children: ReactNode; className?: string };

export function EmptyState({ show, children, className }: Props) {
  const reduced = usePrefersReducedMotion();
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className={className}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.22 }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
```

```ts
// index.ts
export { usePrefersReducedMotion } from "./usePrefersReducedMotion";
export { PageEnter } from "./PageEnter";
export { RouteFade } from "./RouteFade";
export { ListStagger, ListStaggerItem } from "./ListStagger";
export { ModalMotion } from "./ModalMotion";
export { AlertMotion } from "./AlertMotion";
export { PanelEnter } from "./PanelEnter";
export { SkeletonShimmer } from "./SkeletonShimmer";
export { EmptyState } from "./EmptyState";
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `cd "Front/Front-React" && pnpm test -- src/shared/motion/`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add Front/Front-React/package.json Front/Front-React/pnpm-lock.yaml Front/Front-React/src/shared/motion
git commit -m "feat(react): add motion catalog primitives with reduced-motion"
```

---

### Task 3: React chrome — RouteFade, Nav, ConfirmDialog, ButtonPress

**Files:**
- Modify: `Front/Front-React/src/App.tsx`
- Modify: `Front/Front-React/src/shared/Nav.tsx`
- Modify: `Front/Front-React/src/shared/ConfirmDialog.tsx`
- Modify: `Front/Front-React/src/shared/ConfirmDialog.test.tsx` (keep behavior assertions; dialog still role=dialog)
- Modify: `Front/Front-React/src/shared/Nav.test.tsx` if needed for drawer presence

**Interfaces:**
- Consumes: `RouteFade`, `ModalMotion`, CSS `.motion-press`, `.motion-nav-drawer-*` via Motion or conditional render
- Produces: animated shell used by all routes

- [ ] **Step 1: Update ConfirmDialog to use ModalMotion (keep API)**

Replace early `if (!open) return null` body with:

```tsx
import { ModalMotion } from "@/shared/motion";

// ... same props/effects ...

return (
  <ModalMotion open={open} onCancel={onCancel}>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      className="w-full max-w-md rounded-[length:var(--radius-control)] border border-line bg-panel p-6 shadow-lg"
    >
      {/* title, message, buttons unchanged; add motion-press to buttons */}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className={`${btnOutline} motion-press`} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className={`${btnDanger} motion-press`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </ModalMotion>
);
```

Remove the outer backdrop `div` (ModalMotion owns it). Keep Escape `useEffect`.

- [ ] **Step 2: Run ConfirmDialog tests**

Run: `cd "Front/Front-React" && pnpm test -- src/shared/ConfirmDialog.test.tsx`
Expected: PASS (adjust queries if backdrop structure changed — dialog role must remain)

- [ ] **Step 3: Wire RouteFade in App.tsx**

```tsx
import { useLocation, Navigate, Route, Routes } from "react-router-dom";
import { RouteFade } from "@/shared/motion";
// ...existing imports...

export default function App() {
  const location = useLocation();
  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface font-sans text-ink">
      <Nav />
      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-6 md:py-8">
        <RouteFade routeKey={location.pathname}>
          <Routes location={location}>
            {/* existing routes unchanged */}
          </Routes>
        </RouteFade>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: NavChrome — animate mobile drawer**

In `Nav.tsx`, wrap mobile nav with Motion when open:

```tsx
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/shared/motion";

// inside Nav():
const reduced = usePrefersReducedMotion();

// replace `{menuOpen && ( <nav>...</nav> )}` with:
<AnimatePresence>
  {menuOpen ? (
    <motion.nav
      id="mobile-nav"
      className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden"
      initial={reduced ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: reduced ? 0 : 0.22 }}
    >
      <NavLinks onNavigate={() => setMenuOpen(false)} />
    </motion.nav>
  ) : null}
</AnimatePresence>
```

Ensure existing `transition-colors` on links remains (NavChrome hover/active already CSS).

- [ ] **Step 5: Run App + Nav + ConfirmDialog tests**

Run: `cd "Front/Front-React" && pnpm test -- src/App.test.tsx src/shared/Nav.test.tsx src/shared/ConfirmDialog.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add Front/Front-React/src/App.tsx Front/Front-React/src/shared/Nav.tsx \
  Front/Front-React/src/shared/ConfirmDialog.tsx Front/Front-React/src/shared/ConfirmDialog.test.tsx
git commit -m "feat(react): wire RouteFade, NavChrome, and ModalMotion"
```

---

### Task 4: React pages — auth, lists, forms, profile

**Files:**
- Modify: `Front/Front-React/src/components/user/LoginPage.tsx`
- Modify: `Front/Front-React/src/components/user/RegisterPage.tsx`
- Modify: `Front/Front-React/src/components/user/ChangePasswordPage.tsx` (if standalone UI; else Profile password section)
- Modify: `Front/Front-React/src/components/user/ProfilePage.tsx`
- Modify: `Front/Front-React/src/components/eventos/EventosPage.tsx`
- Modify: `Front/Front-React/src/components/eventos/EventoDetailPage.tsx`
- Modify: `Front/Front-React/src/components/palestrantes/PalestrantesPage.tsx`
- Modify: `Front/Front-React/src/components/palestrantes/PalestranteFormPage.tsx`
- Existing `*.test.tsx` for those pages must stay green

**Interfaces:**
- Consumes: `PageEnter`, `AlertMotion`, `ListStagger`/`ListStaggerItem`, `SkeletonShimmer`, `EmptyState`, `PanelEnter`, `.motion-press`
- Produces: full React screen mapping from spec

**Wire-up rules (apply on every page):**
1. Root return wrapped in `<PageEnter>` (translate only; RouteFade already did opacity).
2. Success/error banners: `<AlertMotion show={!!msg} className="...existing alert classes...">{msg}</AlertMotion>`.
3. Primary/outline buttons that already use `active:scale-[0.98]`: add `motion-press` and keep scale class or rely on `.motion-press:active`.
4. Lists: while `loading`, show `<SkeletonShimmer rows={5} />` **in addition to** existing `LoadingSpinner` only if spinner is overlay — if spinner is full-page overlay, show skeleton **instead of empty table body** when `loading` (keep spinner if already used as overlay; do not remove it). Prefer: keep `LoadingSpinner`; when `loading`, also render skeleton inside the list region OR replace the table with skeleton (pick one per page — skeleton in list region, spinner overlay OK).
5. Table/list rows: wrap each row content with `<ListStaggerItem index={i}>` inside `<ListStagger>`; only when `!loading && items.length > 0`.
6. Empty row/message: `<EmptyState show={!loading && items.length === 0}>...</EmptyState>`.
7. Forms/detail: wrap major panels (card sections for dados / lotes / redes / palestrantes) in `<PanelEnter className={existing panel classes}>`.

- [ ] **Step 1: Apply LoginPage pattern**

```tsx
import { PageEnter, AlertMotion } from "@/shared/motion";

// return (
<PageEnter>
  <div className="mx-auto max-w-md ...">
    <AlertMotion show={!!error} className="...danger alert classes...">
      {error}
    </AlertMotion>
    {/* form; button className includes motion-press */}
  </div>
</PageEnter>
// );
```

- [ ] **Step 2: Mirror for RegisterPage + ChangePasswordPage + ProfilePage** (alerts + PageEnter + PanelEnter on profile cards)

- [ ] **Step 3: EventosPage + PalestrantesPage** (skeleton, list stagger, empty, alerts, PageEnter, motion-press)

Example list body:

```tsx
{loading ? (
  <SkeletonShimmer rows={5} className="p-4" />
) : (
  <ListStagger>
    {eventos.map((evento, index) => (
      <ListStaggerItem key={evento.id} index={index}>
        {/* existing row / card */}
      </ListStaggerItem>
    ))}
  </ListStagger>
)}
<EmptyState show={!loading && !error && eventos.length === 0} className="...">
  Nenhum evento encontrado.
</EmptyState>
```

Do **not** call ListStagger when `eventos.length === 0`.

- [ ] **Step 4: EventoDetailPage + PalestranteFormPage** — PageEnter + PanelEnter per section + AlertMotion

- [ ] **Step 5: Run React page tests + full unit suite**

```bash
cd "Front/Front-React" && pnpm test
```
Expected: PASS (fix any broken queries from wrapper divs — prefer `getByRole`/`getByText`)

- [ ] **Step 6: Commit**

```bash
git add Front/Front-React/src/components
git commit -m "feat(react): apply motion catalog across all product pages"
```

---

### Task 5: Vue motion primitives

**Files:**
- Create: `Front/Front-Vue/src/shared/motion/usePrefersReducedMotion.ts`
- Create: `Front/Front-Vue/src/shared/motion/usePrefersReducedMotion.spec.ts`
- Create: `Front/Front-Vue/src/shared/motion/PageEnter.vue`
- Create: `Front/Front-Vue/src/shared/motion/RouteFade.vue`
- Create: `Front/Front-Vue/src/shared/motion/ListStagger.vue` (wrapper around `TransitionGroup`)
- Create: `Front/Front-Vue/src/shared/motion/AlertMotion.vue`
- Create: `Front/Front-Vue/src/shared/motion/PanelEnter.vue`
- Create: `Front/Front-Vue/src/shared/motion/ModalMotion.vue`
- Create: `Front/Front-Vue/src/shared/motion/SkeletonShimmer.vue`
- Create: `Front/Front-Vue/src/shared/motion/EmptyState.vue`
- Create: `Front/Front-Vue/src/shared/motion/PageEnter.spec.ts`
- Create: `Front/Front-Vue/src/shared/motion/SkeletonShimmer.spec.ts`

**Interfaces:**
- Consumes: CSS classes from Task 1
- Produces: same catalog names as React, Vue SFCs

- [ ] **Step 1: Write failing hook + PageEnter + Skeleton specs**

```ts
// usePrefersReducedMotion.spec.ts
import { describe, expect, it, vi, afterEach } from "vitest";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

afterEach(() => vi.unstubAllGlobals());

it("reads matchMedia", () => {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  expect(usePrefersReducedMotion().value).toBe(true);
});
```

```ts
// PageEnter.spec.ts
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import PageEnter from "./PageEnter.vue";

it("renders slot content", () => {
  const w = mount(PageEnter, { slots: { default: "<p>Oi</p>" } });
  expect(w.text()).toContain("Oi");
});
```

```ts
// SkeletonShimmer.spec.ts
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import SkeletonShimmer from "./SkeletonShimmer.vue";

it("renders N skeleton rows", () => {
  const w = mount(SkeletonShimmer, { props: { rows: 3 } });
  expect(w.findAll(".motion-skeleton, .bg-line").length).toBe(3);
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd "Front/Front-Vue" && pnpm test -- src/shared/motion/`

- [ ] **Step 3: Implement**

```ts
// usePrefersReducedMotion.ts
import { onMounted, onUnmounted, ref, type Ref } from "vue";

const QUERY = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion(): Ref<boolean> {
  const reduced = ref(false);
  let mql: MediaQueryList | null = null;
  const onChange = () => {
    if (mql) reduced.value = mql.matches;
  };
  onMounted(() => {
    mql = window.matchMedia(QUERY);
    onChange();
    mql.addEventListener("change", onChange);
  });
  onUnmounted(() => mql?.removeEventListener("change", onChange));
  return reduced;
}
```

```vue
<!-- PageEnter.vue: CSS-only y enter via Transition; opacity left to RouteFade -->
<template>
  <div v-if="reduced"><slot /></div>
  <Transition v-else appear name="motion-page">
    <div><slot /></div>
  </Transition>
</template>
<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
const reduced = usePrefersReducedMotion();
</script>
```

Add to CSS utilities (Task 1 files — if missing, add now):

```css
.motion-page-enter-active {
  transition: transform var(--motion-base) var(--motion-ease);
}
.motion-page-enter-from { transform: translateY(8px); }
.motion-page-enter-to { transform: translateY(0); }
```

```vue
<!-- RouteFade.vue -->
<template>
  <router-view v-slot="{ Component, route }">
    <Transition :name="reduced ? undefined : 'motion-fade'" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </router-view>
</template>
<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
const reduced = usePrefersReducedMotion();
</script>
```

```vue
<!-- AlertMotion.vue -->
<template>
  <Transition :name="reduced ? undefined : 'motion-alert'">
    <div v-if="show" :class="className"><slot /></div>
  </Transition>
</template>
<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
defineProps<{ show: boolean; className?: string }>();
const reduced = usePrefersReducedMotion();
</script>
```

```vue
<!-- PanelEnter.vue -->
<template>
  <div v-if="reduced" :class="className"><slot /></div>
  <Transition v-else appear name="motion-panel">
    <div :class="className"><slot /></div>
  </Transition>
</template>
<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
defineProps<{ className?: string }>();
const reduced = usePrefersReducedMotion();
</script>
```

```vue
<!-- ModalMotion.vue — wrap ConfirmDialog content; parent still controls `open` -->
<template>
  <Transition :name="reduced ? undefined : 'motion-modal-backdrop'">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="presentation"
      @click="$emit('cancel')"
    >
      <Transition appear :name="reduced ? undefined : 'motion-modal-panel'">
        <div @click.stop>
          <slot />
        </div>
      </Transition>
    </div>
  </Transition>
</template>
<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
defineProps<{ open: boolean }>();
defineEmits<{ cancel: [] }>();
const reduced = usePrefersReducedMotion();
</script>
```

```vue
<!-- ListStagger.vue — use on parent of keyed children with name="motion-list" -->
<template>
  <TransitionGroup
    v-if="!reduced && itemsLength > 0"
    name="motion-list"
    tag="div"
    :class="className"
  >
    <slot />
  </TransitionGroup>
  <div v-else :class="className"><slot /></div>
</template>
<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
defineProps<{ itemsLength: number; className?: string }>();
const reduced = usePrefersReducedMotion();
</script>
```

For stagger delay, child elements set style `--motion-stagger-index: n` (already in CSS).

```vue
<!-- SkeletonShimmer.vue -->
<template>
  <div class="flex flex-col gap-3" aria-hidden="true">
    <div
      v-for="i in rows"
      :key="i"
      :class="reduced ? 'h-10 rounded-[length:var(--radius-control)] bg-line' : 'motion-skeleton h-10 rounded-[length:var(--radius-control)]'"
    />
  </div>
</template>
<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
withDefaults(defineProps<{ rows?: number }>(), { rows: 4 });
const reduced = usePrefersReducedMotion();
</script>
```

```vue
<!-- EmptyState.vue -->
<template>
  <Transition :name="reduced ? undefined : 'motion-empty'">
    <div v-if="show" :class="className"><slot /></div>
  </Transition>
</template>
<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
defineProps<{ show: boolean; className?: string }>();
const reduced = usePrefersReducedMotion();
</script>
```

- [ ] **Step 4: Run specs — PASS**

Run: `cd "Front/Front-Vue" && pnpm test -- src/shared/motion/`

- [ ] **Step 5: Commit**

```bash
git add Front/Front-Vue/src/shared/motion Front/Front-Vue/src/style.css
git commit -m "feat(vue): add motion catalog primitives"
```

---

### Task 6: Vue chrome + pages

**Files:**
- Modify: `Front/Front-Vue/src/App.vue` — replace bare `<router-view />` with `<RouteFade />`
- Modify: `Front/Front-Vue/src/shared/MenuComponent.vue` — Transition on mobile drawer (`motion-nav-drawer`)
- Modify: `Front/Front-Vue/src/shared/ConfirmDialog.vue` — use `ModalMotion`
- Modify pages: `LoginComponent.vue`, `RegistrarUsuario.vue`, `AlterarSenha.vue`, `PerfilUsuario.vue`, `EventoLista.vue`, `DetalhesEvento.vue`, `FormularioEvento.vue`, `LotesEvento.vue`, `PalestrantesPage.vue`, `PalestranteFormPage.vue` (and list wrappers as needed)

**Interfaces:**
- Consumes: Task 5 components
- Produces: full Vue screen mapping

- [ ] **Step 1: App.vue**

```vue
<template>
  <div class="flex min-h-[100dvh] flex-col bg-surface font-sans text-ink">
    <MenuComponent />
    <div class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:py-8">
      <RouteFade />
    </div>
  </div>
</template>
<script setup lang="ts">
import MenuComponent from "./shared/MenuComponent.vue";
import RouteFade from "./shared/motion/RouteFade.vue";
</script>
```

- [ ] **Step 2: ConfirmDialog + MenuComponent + pages** — same mapping rules as Task 4 (PageEnter, AlertMotion, ListStagger with `--motion-stagger-index`, SkeletonShimmer, EmptyState, PanelEnter, `motion-press` on buttons)

For list children inside `TransitionGroup`, each item needs `:key` and `:style="{ '--motion-stagger-index': index }"`.

- [ ] **Step 3: Run Vue tests**

```bash
cd "Front/Front-Vue" && pnpm test
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add Front/Front-Vue/src
git commit -m "feat(vue): wire motion catalog into chrome and all pages"
```

---

### Task 7: Angular motion primitives

**Files:**
- Create: `Front/Front-Angular/src/app/shared/motion/motion.tokens.ts` (duration helpers optional)
- Create: `Front/Front-Angular/src/app/shared/motion/prefers-reduced-motion.ts`
- Create: `Front/Front-Angular/src/app/shared/motion/prefers-reduced-motion.spec.ts`
- Create: `Front/Front-Angular/src/app/shared/motion/page-enter.animation.ts`
- Create: `Front/Front-Angular/src/app/shared/motion/route-fade.animation.ts`
- Create: `Front/Front-Angular/src/app/shared/motion/list-stagger.animation.ts`
- Create: `Front/Front-Angular/src/app/shared/motion/modal.animation.ts`
- Create: `Front/Front-Angular/src/app/shared/motion/alert.animation.ts`
- Create: `Front/Front-Angular/src/app/shared/motion/panel-enter.animation.ts`
- Create: `Front/Front-Angular/src/app/shared/motion/empty.animation.ts`
- Create: `Front/Front-Angular/src/app/shared/motion/skeleton-shimmer.component.ts`
- Create: `Front/Front-Angular/src/app/shared/motion/skeleton-shimmer.component.spec.ts`
- Create: `Front/Front-Angular/src/app/shared/motion/index.ts`

**Interfaces:**
- Consumes: `provideAnimations()` already in `app.config.ts`
- Produces:
  - `prefersReducedMotion(): boolean` (sync read of `matchMedia`)
  - exported `AnimationTriggerMetadata`: `pageEnterAnimation`, `routeFadeAnimation`, `listStaggerAnimation`, `modalAnimation`, `alertAnimation`, `panelEnterAnimation`
  - `SkeletonShimmerComponent` (`rows` input)

- [ ] **Step 1: Failing specs**

```ts
// prefers-reduced-motion.spec.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion } from "./prefers-reduced-motion";

afterEach(() => vi.unstubAllGlobals());

it("returns true when media matches", () => {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
  expect(prefersReducedMotion()).toBe(true);
});
```

```ts
// skeleton-shimmer.component.spec.ts
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SkeletonShimmerComponent } from "./skeleton-shimmer.component";

afterEach(() => vi.unstubAllGlobals());

describe("SkeletonShimmerComponent", () => {
  it("renders N placeholder rows", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
    await TestBed.configureTestingModule({
      imports: [SkeletonShimmerComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SkeletonShimmerComponent);
    fixture.componentInstance.rows = 3;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll(".motion-skeleton").length,
    ).toBe(3);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// prefers-reduced-motion.ts
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

```ts
// page-enter.animation.ts
import { animate, style, transition, trigger } from "@angular/animations";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export const pageEnterAnimation = trigger("pageEnter", [
  transition(":enter", [
    style({ transform: prefersReducedMotion() ? "none" : "translateY(8px)" }),
    animate(
      prefersReducedMotion() ? "0ms" : "220ms cubic-bezier(0.16, 1, 0.3, 1)",
      style({ transform: "translateY(0)" }),
    ),
  ]),
]);
```

```ts
// route-fade.animation.ts
import {
  animate,
  query,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const ms = () => (prefersReducedMotion() ? "0ms" : "320ms cubic-bezier(0.16, 1, 0.3, 1)");

export const routeFadeAnimation = trigger("routeFade", [
  transition("* <=> *", [
    query(
      ":enter",
      [style({ opacity: 0 }), animate(ms(), style({ opacity: 1 }))],
      { optional: true },
    ),
  ]),
]);
```

```ts
// list-stagger.animation.ts
import {
  animate,
  query,
  stagger,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { prefersReducedMotion } from "./prefers-reduced-motion";

export const listStaggerAnimation = trigger("listStagger", [
  transition("* => *", [
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateY(6px)" }),
        stagger(prefersReducedMotion() ? 0 : 40, [
          animate(
            prefersReducedMotion() ? "0ms" : "220ms cubic-bezier(0.16, 1, 0.3, 1)",
            style({ opacity: 1, transform: "translateY(0)" }),
          ),
        ]),
      ],
      { optional: true },
    ),
  ]),
]);
```

```ts
// modal.animation.ts — triggers `modalBackdrop` + `modalPanel`
import { animate, style, transition, trigger } from "@angular/animations";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const d = () => (prefersReducedMotion() ? "0ms" : "320ms cubic-bezier(0.16, 1, 0.3, 1)");

export const modalBackdropAnimation = trigger("modalBackdrop", [
  transition(":enter", [
    style({ opacity: 0 }),
    animate(d(), style({ opacity: 1 })),
  ]),
  transition(":leave", [animate(d(), style({ opacity: 0 }))]),
]);

export const modalPanelAnimation = trigger("modalPanel", [
  transition(":enter", [
    style({ opacity: 0, transform: "scale(0.98)" }),
    animate(d(), style({ opacity: 1, transform: "scale(1)" })),
  ]),
  transition(":leave", [
    animate(d(), style({ opacity: 0, transform: "scale(0.98)" })),
  ]),
]);
```

```ts
// alert.animation.ts
import { animate, style, transition, trigger } from "@angular/animations";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const d = () =>
  prefersReducedMotion() ? "0ms" : "220ms cubic-bezier(0.16, 1, 0.3, 1)";

export const alertAnimation = trigger("alertMotion", [
  transition(":enter", [
    style({ opacity: 0, transform: "translateY(-4px)" }),
    animate(d(), style({ opacity: 1, transform: "translateY(0)" })),
  ]),
  transition(":leave", [animate(d(), style({ opacity: 0 }))]),
]);
```

```ts
// panel-enter.animation.ts
import { animate, style, transition, trigger } from "@angular/animations";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const d = () =>
  prefersReducedMotion() ? "0ms" : "220ms cubic-bezier(0.16, 1, 0.3, 1)";

export const panelEnterAnimation = trigger("panelEnter", [
  transition(":enter", [
    style({ opacity: 0, transform: "translateY(8px)" }),
    animate(d(), style({ opacity: 1, transform: "translateY(0)" })),
  ]),
]);
```

```ts
// empty.animation.ts
import { animate, style, transition, trigger } from "@angular/animations";
import { prefersReducedMotion } from "./prefers-reduced-motion";

const d = () =>
  prefersReducedMotion() ? "0ms" : "220ms cubic-bezier(0.16, 1, 0.3, 1)";

export const emptyAnimation = trigger("emptyFade", [
  transition(":enter", [
    style({ opacity: 0 }),
    animate(d(), style({ opacity: 1 })),
  ]),
]);
```

```ts
// skeleton-shimmer.component.ts
import { Component, Input } from "@angular/core";
import { prefersReducedMotion } from "./prefers-reduced-motion";

@Component({
  selector: "app-skeleton-shimmer",
  standalone: true,
  template: `
    <div class="flex flex-col gap-3" aria-hidden="true">
      @for (r of rowList; track r) {
        <div
          class="h-10 rounded-[length:var(--radius-control)]"
          [class.motion-skeleton]="!reduced"
          [class.bg-line]="reduced"
        ></div>
      }
    </div>
  `,
})
export class SkeletonShimmerComponent {
  @Input() rows = 4;
  reduced = prefersReducedMotion();
  get rowList(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
```

Export all from `index.ts`.

- [ ] **Step 3: Run Angular motion specs**

```bash
cd "Front/Front-Angular" && pnpm test -- src/app/shared/motion/
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add Front/Front-Angular/src/app/shared/motion
git commit -m "feat(angular): add motion catalog animations and skeleton"
```

---

### Task 8: Angular chrome + pages

**Files:**
- Modify: `Front/Front-Angular/src/app/app.ts`, `app.html`
- Modify: `Front/Front-Angular/src/app/shared/nav/nav.component.ts`, `nav.component.html`
- Modify: `Front/Front-Angular/src/app/shared/confirm-dialog/confirm-dialog.component.ts`, `.html`
- Modify: login/register/change-password/profile, eventos-list, evento-form, palestrantes, palestrante-form (`.ts` + `.html`)

**Interfaces:**
- Consumes: Task 7 triggers + `SkeletonShimmerComponent`
- Produces: full Angular screen mapping

- [ ] **Step 1: App route fade**

```ts
// app.ts
import { routeFadeAnimation } from './shared/motion';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [routeFadeAnimation],
})
export class App {}
```

```html
<!-- app.html -->
<div class="flex min-h-[100dvh] flex-col overflow-x-hidden bg-surface font-sans text-ink">
  <app-nav />
  <main
    class="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-6 md:py-8"
    [@routeFade]="outlet.isActivated ? outlet.activatedRoute : ''"
  >
    <router-outlet #outlet="outlet" />
  </main>
</div>
```

- [ ] **Step 2: Confirm dialog animations**

Add `animations: [modalBackdropAnimation, modalPanelAnimation]` and `[@modalBackdrop]` / `[@modalPanel]` on the existing `@if (open)` template nodes. Add `motion-press` class on buttons.

- [ ] **Step 3: Nav drawer** — optional `[@navDrawer]` trigger (opacity+y) on mobile nav `@if`; or CSS classes `motion-nav-drawer-*` via `@starting-style` / Transition — prefer Angular trigger `navDrawer` in `nav.component.ts` for parity.

- [ ] **Step 4: Pages** — each page component:
  - `animations: [pageEnterAnimation, alertAnimation, panelEnterAnimation, listStaggerAnimation]` as needed
  - host or root div `[@pageEnter]`
  - alerts `[@alert]` with `@if`
  - list container `[@listStagger]="items.length"`
  - panels `[@panelEnter]`
  - loading region `<app-skeleton-shimmer [rows]="5" />`
  - empty state: CSS `motion-empty` or simple `@if` (EmptyState can be CSS Transition via `@if` + alert-like fade trigger `emptyFade`)
  - buttons: add `motion-press`

- [ ] **Step 5: Run Angular tests**

```bash
cd "Front/Front-Angular" && pnpm test
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add Front/Front-Angular/src
git commit -m "feat(angular): wire motion catalog into chrome and all pages"
```

---

### Task 9: Final verification (all fronts)

**Files:** none new (smoke only)

- [ ] **Step 1: Run all three unit suites**

```bash
cd "Front/Front-React" && pnpm test
cd "Front/Front-Vue" && pnpm test
cd "Front/Front-Angular" && pnpm test
```
Expected: all PASS

- [ ] **Step 2: Build all three**

```bash
cd "Front/Front-React" && pnpm build
cd "Front/Front-Vue" && pnpm build
cd "Front/Front-Angular" && pnpm build
```
Expected: success

- [ ] **Step 3: Manual reduced-motion check (engineer)**

In browser DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce", open Login + Eventos list + ConfirmDialog on each front. Expect: no visible slide/scale/shimmer; UI still usable.

- [ ] **Step 4: Commit only if leftover fixes**

```bash
git status
# if fixes: git add ... && git commit -m "fix(front): motion catalog verification follow-ups"
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|------------------|------|
| Tokens mirrored in 3 CSS files | Task 1 |
| Catalog patterns (10) | Tasks 2, 5, 7 |
| React `motion` dep only | Task 2 |
| Vue/Angular no new libs | Tasks 5–8 |
| RouteFade + PageEnter composition | Tasks 3–4, 6, 8 |
| Screen mapping all surfaces | Tasks 4, 6, 8 |
| Reduced-motion | Tasks 1–2, 5, 7 |
| Skeleton complements spinner | Tasks 4, 6, 8 |
| Unit tests for primitives + matchMedia | Tasks 2, 5, 7 |
| No E2E frame asserts | Task 9 (manual only) |
| ConfirmDialog ModalMotion | Tasks 3, 6, 8 |
| NavChrome | Tasks 3, 6, 8 |
| ButtonPress via `--motion-fast` | Task 1 utilities + page tasks |
