import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  setSession,
  getRoles,
  canWrite,
  hasRole,
  clearToken,
  getToken,
  isAuthenticated,
} from "./authToken";

const store = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, String(value));
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
});

describe("authToken", () => {
  beforeEach(() => {
    store.clear();
  });

  it("setSession persists token and roles", () => {
    setSession("tok-1", ["User", "Palestrante"]);
    expect(getToken()).toBe("tok-1");
    expect(getRoles()).toEqual(["User", "Palestrante"]);
    expect(isAuthenticated()).toBe(true);
  });

  it("getRoles returns empty array when missing or invalid", () => {
    expect(getRoles()).toEqual([]);
    localStorage.setItem("proeventos_roles", "{not-json");
    expect(getRoles()).toEqual([]);
    localStorage.setItem("proeventos_roles", '"User"');
    expect(getRoles()).toEqual([]);
  });

  it("canWrite is true only for User role", () => {
    setSession("t", ["Palestrante"]);
    expect(canWrite()).toBe(false);

    setSession("t", ["User"]);
    expect(canWrite()).toBe(true);

    setSession("t", ["User", "Palestrante"]);
    expect(canWrite()).toBe(true);
  });

  it("hasRole checks stored roles", () => {
    setSession("t", ["Palestrante"]);
    expect(hasRole("Palestrante")).toBe(true);
    expect(hasRole("User")).toBe(false);
  });

  it("clearToken removes token and roles", () => {
    setSession("tok", ["User"]);
    clearToken();
    expect(getToken()).toBeNull();
    expect(getRoles()).toEqual([]);
    expect(isAuthenticated()).toBe(false);
    expect(canWrite()).toBe(false);
  });
});
