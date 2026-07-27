import { describe, expect, it } from "vitest";
import { apiErrorMessage } from "./apiErrorMessage";

describe("apiErrorMessage", () => {
  it("prioriza description sobre detail e message", () => {
    expect(
      apiErrorMessage(
        { description: "desc", detail: "det", message: "msg" },
        "fallback",
      ),
    ).toBe("desc");
  });

  it("usa detail quando não há description", () => {
    expect(apiErrorMessage({ detail: "detalhe", message: "msg" }, "fallback")).toBe(
      "detalhe",
    );
  });

  it("usa message legado", () => {
    expect(apiErrorMessage({ message: "legado" }, "fallback")).toBe("legado");
  });

  it("aceita string direta", () => {
    expect(apiErrorMessage("texto", "fallback")).toBe("texto");
  });

  it("retorna fallback quando body vazio", () => {
    expect(apiErrorMessage(null, "fallback")).toBe("fallback");
    expect(apiErrorMessage({}, "fallback")).toBe("fallback");
    expect(apiErrorMessage("  ", "fallback")).toBe("fallback");
  });
});
