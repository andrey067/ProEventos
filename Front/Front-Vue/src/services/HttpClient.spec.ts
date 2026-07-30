import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./authToken", () => ({
  getToken: vi.fn(() => "test-token"),
}));

import apiClient from "./HttpClient";
import { getToken } from "./authToken";

describe("HttpClient", () => {
  beforeEach(() => {
    vi.mocked(getToken).mockReturnValue("test-token");
  });

  it("adds Authorization header when token exists", async () => {
    const handler = (apiClient.interceptors.request as { handlers: { fulfilled: (c: unknown) => unknown }[] })
      .handlers[0].fulfilled;
    const config = { headers: {} as Record<string, string> };
    const next = handler(config) as { headers: Record<string, string> };
    expect(next.headers.Authorization).toBe("Bearer test-token");
  });

  it("skips Authorization when token is missing", async () => {
    vi.mocked(getToken).mockReturnValue(null);
    const handler = (apiClient.interceptors.request as { handlers: { fulfilled: (c: unknown) => unknown }[] })
      .handlers[0].fulfilled;
    const config = { headers: {} as Record<string, string> };
    const next = handler(config) as { headers: Record<string, string> };
    expect(next.headers.Authorization).toBeUndefined();
  });
});
