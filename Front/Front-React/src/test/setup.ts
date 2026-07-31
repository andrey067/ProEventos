import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

const store = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  get length() {
    return store.size;
  },
};

function stubLocalStorage(): void {
  vi.stubGlobal("localStorage", localStorageMock);
}

function stubDefaultMatchMedia(): void {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
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

stubLocalStorage();
if (typeof window.matchMedia !== "function") {
  stubDefaultMatchMedia();
}

beforeEach(() => {
  store.clear();
  // Re-apply after any test that called vi.unstubAllGlobals()
  stubLocalStorage();
});
