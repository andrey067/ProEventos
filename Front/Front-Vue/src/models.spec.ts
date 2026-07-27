import { describe, it, expect } from "vitest";
import type { Evento } from "./Models/Evento";
import type { Lote } from "./Models/Lote";
import type { Palestrante } from "./Models/Palestrante";
import type { RedeSocial } from "./Models/RedeSocial";
import type { CadastrarEventoFrom } from "./Models/Eventos/CadastroEventoForm";
import { User } from "./Models/identity/User";
import { UserLogin } from "./Models/identity/UserLogin";
import type { Titulo } from "./interfaces/Titulo";
import { Constantes } from "./utils/constants";

describe("models and utils", () => {
  it("builds Evento graph with related models", () => {
    const lote: Lote = {
      id: 1,
      nome: "VIP",
      preco: 100,
      dataInicio: new Date(),
      dataFim: new Date(),
      quantidade: 10,
      eventoId: 1,
      evento: {} as Evento,
    };
    const rede: RedeSocial = {
      id: 1,
      nome: "Twitter",
      URL: "https://x.com",
      eventoId: 1,
      palestranteId: 0,
    };
    const evento: Evento = {
      id: 1,
      local: "SP",
      dataEvento: "01-01-2026",
      tema: "Vue",
      qtdPessoas: 50,
      imagemURL: "",
      telefone: "11",
      email: "a@b.com",
      lotes: [lote],
      redesSociais: [rede],
      palestrantesEventos: [],
    };
    lote.evento = evento;
    expect(evento.lotes[0].nome).toBe("VIP");
    expect(evento.redesSociais[0].URL).toContain("x.com");
  });

  it("builds Palestrante with events and redes", () => {
    const palestrante: Palestrante = {
      id: 2,
      nome: "Ana",
      miniCurriculo: "Dev",
      imagemURL: "",
      telefone: "11",
      email: "ana@test.com",
      redesSociais: [],
      palestrantesEventos: [],
    };
    expect(palestrante.nome).toBe("Ana");
  });

  it("supports CadastrarEventoFrom shape", () => {
    const form: CadastrarEventoFrom = {
      tema: "T",
      local: "L",
      dataEvento: "D",
      passawords: { password: "p", confirPassword: "p" },
      qtdPessoas: 1,
      telefone: 11,
      email: "e",
      urlImagem: null,
    };
    expect(form.passawords.password).toBe("p");
  });

  it("instantiates User and UserLogin classes", () => {
    const user = new User();
    user.nome = "Test User";
    user.userName = "testuser";
    user.email = "u@test.com";
    user.token = "jwt-token";

    const login = new UserLogin();
    login.userName = "u";
    login.password = "secret";

    expect(user.nome).toBe("Test User");
    expect(user.token).toBe("jwt-token");
    expect(login.userName).toBe("u");
  });

  it("defines Titulo interface fields", () => {
    const titulo: Titulo = {
      iconClass: "fa",
      subtitulo: "Sub",
      titulo: "T",
      router: "evento",
      mostrarTitulo: true,
      botaolistar: false,
    };
    expect(titulo.botaolistar).toBe(false);
  });

  it("exposes date format constants", () => {
    expect(Constantes.DATE_FMT).toBe("DD/MM/YYYY");
    expect(Constantes.DATE_TIME_FMT).toBe("DD/MM/YYYY hh:mm");
  });
});
