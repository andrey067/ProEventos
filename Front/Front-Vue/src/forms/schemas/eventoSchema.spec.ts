import { describe, it, expect } from "vitest";
import {
  defaultEventoFormValues,
  emptyLote,
  emptyRede,
  eventoSchema,
  loteFormSchema,
  redeSocialFormSchema,
} from "./eventoSchema";

function validBase() {
  return {
    ...defaultEventoFormValues(),
    tema: "Tema válido",
    local: "São Paulo",
    dataEvento: "2026-01-15",
    qtdPessoas: 100,
    telefone: "11999999999",
    email: "test@example.com",
  };
}

describe("eventoSchema", () => {
  it("rejects tema longer than 50 characters", () => {
    const result = eventoSchema.safeParse({
      ...validBase(),
      tema: "a".repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("máximo 50"))).toBe(true);
    }
  });

  it("rejects tema shorter than 4 characters", () => {
    const result = eventoSchema.safeParse({
      ...validBase(),
      tema: "abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("ao menos 4"))).toBe(true);
    }
  });

  it("rejects invalid email", () => {
    const result = eventoSchema.safeParse({
      ...validBase(),
      email: "nao-email",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("E-mail inválido"))).toBe(true);
    }
  });

  it("rejects qtdPessoas above 120000", () => {
    const result = eventoSchema.safeParse({
      ...validBase(),
      qtdPessoas: 120001,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes("120000"))).toBe(true);
    }
  });

  it("accepts valid payload", () => {
    const result = eventoSchema.safeParse(validBase());
    expect(result.success).toBe(true);
  });

  it("rejects lote when dataInicio is after dataFim", () => {
    const result = loteFormSchema.safeParse({
      ...emptyLote(),
      dataInicio: "2026-02-01",
      dataFim: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects rede social without nome or url", () => {
    const empty = redeSocialFormSchema.safeParse(emptyRede());
    expect(empty.success).toBe(false);

    const valid = redeSocialFormSchema.safeParse({
      ...emptyRede(),
      nome: "LinkedIn",
      url: "https://linkedin.com/in/ana",
    });
    expect(valid.success).toBe(true);
  });

  it("accepts BR date format in dataEvento", () => {
    const result = eventoSchema.safeParse({
      ...validBase(),
      dataEvento: "15/01/2026",
    });
    expect(result.success).toBe(true);
  });
});
