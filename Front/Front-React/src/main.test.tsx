import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("react-dom/client", () => ({
  createRoot: vi.fn(() => ({ render: vi.fn() })),
}));

vi.mock("./App", () => ({
  default: () => null,
}));

describe("main", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    vi.resetModules();
  });

  it("bootstraps the React app", async () => {
    await import("./main");
    const { createRoot } = await import("react-dom/client");
    expect(createRoot).toHaveBeenCalledWith(document.getElementById("root"));
  });
});
