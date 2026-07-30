import { describe, expect, it } from "vitest";
import type { Evento, Lote, Palestrante, RedeSocial } from "@/models";
import { FUNCAO_OPTIONS, PAGE_SIZES, TITULO_OPTIONS } from "@/models";
import { eventoModelKey } from "@/models/Evento";
import { loteModelKey } from "@/models/Lote";
import { palestranteModelKey } from "@/models/Palestrante";
import { redeSocialModelKey } from "@/models/RedeSocial";

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

  it("expõe opções de título e função", () => {
    expect(TITULO_OPTIONS.length).toBeGreaterThan(0);
    expect(FUNCAO_OPTIONS.map((o) => o.value)).toContain("Palestrante");
    expect(PAGE_SIZES).toEqual([10, 20, 30]);
    expect(eventoModelKey).toBe("Evento");
    expect(loteModelKey).toBe("Lote");
    expect(palestranteModelKey).toBe("Palestrante");
    expect(redeSocialModelKey).toBe("RedeSocial");
  });
});
