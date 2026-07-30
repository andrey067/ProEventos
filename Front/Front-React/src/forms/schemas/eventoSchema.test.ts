import { describe, expect, it } from "vitest";
import { emptyRede, loteSchema, redeSocialSchema } from "./eventoSchema";

const baseLote = {
  id: 1,
  nome: "VIP",
  preco: 100,
  quantidade: 10,
  dataIncio: "01/01/2026",
  dataFim: "31/01/2026",
  eventoId: 1,
};

describe("redeSocialSchema", () => {
  it("rejects empty nome and url", () => {
    const result = redeSocialSchema.safeParse(emptyRede());
    expect(result.success).toBe(false);
  });

  it("accepts valid rede social", () => {
    const result = redeSocialSchema.safeParse({
      ...emptyRede(),
      nome: "Instagram",
      url: "https://instagram.com/pro",
    });
    expect(result.success).toBe(true);
  });
});

describe("eventoSchema", () => {
  it("accepts lote when dates are empty", () => {
    const result = loteSchema.safeParse({
      ...baseLote,
      dataIncio: "",
      dataFim: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts lote when dates are invalid strings", () => {
    const result = loteSchema.safeParse({
      ...baseLote,
      dataIncio: "invalid",
      dataFim: "invalid",
    });
    expect(result.success).toBe(true);
  });

  it("rejects lote when start date is after end date", () => {
    const result = loteSchema.safeParse({
      ...baseLote,
      dataIncio: "31/01/2026",
      dataFim: "01/01/2026",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("posterior");
    }
  });
});
