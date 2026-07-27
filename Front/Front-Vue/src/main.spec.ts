import { describe, it, expect, vi } from "vitest";

const useMock = vi.fn();
const mountMock = vi.fn();

vi.mock("vue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("vue")>();
  return {
    ...actual,
    createApp: vi.fn(() => ({
      use: useMock,
      mount: mountMock,
    })),
  };
});

vi.mock("./App.vue", () => ({ default: { name: "App" } }));
vi.mock("./router/index", () => ({ default: { name: "router" } }));
vi.mock("./style.css", () => ({}));

describe("main.ts", () => {
  it("creates app, registers router and mounts", async () => {
    await import("./main");
    expect(useMock).toHaveBeenCalled();
    expect(mountMock).toHaveBeenCalledWith("#app");
  });
});
