import { describe, expect, it, vi, afterEach } from "vitest";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

afterEach(() => vi.unstubAllGlobals());

it("reads matchMedia", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
  expect(usePrefersReducedMotion().value).toBe(true);
});
