import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import router from "./index";

vi.mock("../services/authToken", () => ({
  isAuthenticated: vi.fn(() => false),
}));

import { isAuthenticated } from "../services/authToken";

describe("router/index", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockReturnValue(false);
  });

  it("exports router with expected routes", () => {
    expect(router.getRoutes().map((r) => r.path)).toEqual(
      expect.arrayContaining([
        "/user",
        "/eventos",
        "/palestrantes",
        "/:catchAll(.*)*",
      ]),
    );
  });

  it("redirects unknown paths to eventos lista", async () => {
    const history = createMemoryHistory();
    const testRouter = createRouter({ history, routes: router.getRoutes() });
    await testRouter.push("/rota-inexistente");
    await testRouter.isReady();
    expect(testRouter.currentRoute.value.path).toBe("/eventos/lista");
  });

  it("redirects /eventos to lista", async () => {
    const history = createMemoryHistory();
    const testRouter = createRouter({ history, routes: router.getRoutes() });
    await testRouter.push("/eventos");
    await testRouter.isReady();
    expect(testRouter.currentRoute.value.path).toBe("/eventos/lista");
  });

  it("resolves named routes", async () => {
    const history = createMemoryHistory();
    const testRouter = createRouter({ history, routes: router.getRoutes() });
    await testRouter.push({ name: "login" });
    await testRouter.isReady();
    expect(testRouter.currentRoute.value.path).toBe("/user/login");
  });

  it("redirects unauthenticated users from protected routes to login", async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false);
    await router.push({ name: "detalhe", params: { id: "1" } });
    await router.isReady();
    expect(router.currentRoute.value.name).toBe("login");
    expect(router.currentRoute.value.query.redirect).toBe("/eventos/detalhes/1");
  });
});
