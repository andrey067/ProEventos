import { onMounted, onUnmounted, ref, type Ref } from "vue";

const QUERY = "(prefers-reduced-motion: reduce)";

function readReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

export function usePrefersReducedMotion(): Ref<boolean> {
  const reduced = ref(readReducedMotion());
  let mql: MediaQueryList | null = null;
  const onChange = () => {
    if (mql) reduced.value = mql.matches;
  };
  onMounted(() => {
    if (typeof window.matchMedia !== "function") return;
    mql = window.matchMedia(QUERY);
    onChange();
    mql.addEventListener("change", onChange);
  });
  onUnmounted(() => mql?.removeEventListener("change", onChange));
  return reduced;
}
