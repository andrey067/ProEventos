import { beforeEach, describe, expect, it } from "vitest";
import {
  canWrite,
  clearToken,
  getRoles,
  getToken,
  hasRole,
  setSession,
  setRoles,
  setToken,
} from "./authToken";

describe("authToken", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("setSession stores token and roles", () => {
    setSession("tok", ["User"]);
    expect(getToken()).toBe("tok");
    expect(getRoles()).toEqual(["User"]);
    expect(canWrite()).toBe(true);
    expect(hasRole("User")).toBe(true);
  });

  it("canWrite is false for Palestrante-only roles", () => {
    setSession("tok", ["Palestrante"]);
    expect(canWrite()).toBe(false);
    expect(hasRole("Palestrante")).toBe(true);
    expect(hasRole("User")).toBe(false);
  });

  it("clearToken removes token and roles", () => {
    setSession("tok", ["User"]);
    clearToken();
    expect(getToken()).toBeNull();
    expect(getRoles()).toEqual([]);
    expect(canWrite()).toBe(false);
  });

  it("setToken alone does not grant canWrite", () => {
    setToken("tok");
    expect(canWrite()).toBe(false);
  });

  it("getRoles returns empty array for invalid JSON", () => {
    localStorage.setItem("proeventos_roles", "not-json");
    expect(getRoles()).toEqual([]);
  });

  it("setRoles clears storage when empty", () => {
    setSession("tok", ["User"]);
    setRoles([]);
    expect(getRoles()).toEqual([]);
  });
});
