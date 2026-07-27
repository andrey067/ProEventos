import { describe, expect, it } from "vitest";
import type { Evento, Lote, Palestrante, RedeSocial } from "@/models";

describe("models", () => {
  it("aceita estruturas de domínio usadas nos serviços", () => {
    const lote: Lote = {
      id: 1,
      nome: "VIP",
      preco: 99.9,
      dataIncio: "01-01-2026",
      dataFim: "31-01-2026",
      quantidade: 10,
      eventoId: 1,
    };

    const rede: RedeSocial = {
      id: 1,
      nome: "Instagram",
      url: "https://instagram.com/pro",
      eventoId: 1,
      palestranteId: null,
    };

    const palestrante: Palestrante = {
      id: 1,
      nome: "Ana",
      miniCurriculo: "Dev",
      imagemURL: "",
      telefone: "11999999999",
      email: "ana@example.com",
      redesSociais: [rede],
    };

    const evento: Evento = {
      id: 1,
      local: "SP",
      dataEvento: "01-01-2026",
      tema: "React",
      qtdPessoas: 50,
      imagemURL: "",
      telefone: "11999999999",
      email: "contato@example.com",
      lotes: [lote],
      redesSociais: [rede],
      palestrantes: [palestrante],
    };

    expect(evento.lotes?.[0].nome).toBe("VIP");
    expect(palestrante.redesSociais?.[0].url).toContain("instagram");
    expect(rede.palestranteId).toBeNull();
  });
});
