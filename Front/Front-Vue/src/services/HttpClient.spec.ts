import { describe, it, expect, vi } from "vitest";

const useMock = vi.fn((handler) => {
  handler({ headers: {} });
  return Promise.resolve({ headers: {} });
});

const createMock = vi.fn(() => ({
  get: vi.fn(),
  post: vi.fn(),
  interceptors: {
    request: {
      use: useMock,
    },
  },
}));

vi.mock("axios", () => ({
  default: {
    create: createMock,
  },
}));

vi.mock("./authToken", () => ({
  getToken: vi.fn(() => "test-token"),
}));

describe("HttpClient", () => {
  it("creates axios instance with baseURL and json header", async () => {
    vi.resetModules();
    createMock.mockClear();
    useMock.mockClear();
    await import("./HttpClient");
    expect(createMock).toHaveBeenCalledWith({
      baseURL: "http://localhost:5050",
      headers: {
        "Content-type": "application/json",
      },
    });
  });

  it("registers request interceptor for bearer token", async () => {
    vi.resetModules();
    useMock.mockClear();
    await import("./HttpClient");
    expect(useMock).toHaveBeenCalled();
  });
});
