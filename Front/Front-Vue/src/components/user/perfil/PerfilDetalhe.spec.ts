import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import PerfilDetalhe from "./PerfilDetalhe.vue";
import accountService from "../../../services/accountService";

vi.mock("../../../services/accountService", () => ({
  default: {
    updateProfile: vi.fn(),
  },
}));

const baseProfile = {
  nome: "Ana Silva",
  userName: "ana",
  email: "ana@test.com",
  primeiroNome: "Ana",
  ultimoNome: "Silva",
  titulo: "NaoInformado" as const,
  funcao: "Participante" as const,
  telefone: "11988887777",
  descricao: "Bio da Ana",
  imagemURL: null,
  eventosMinistrados: 0,
  eventosParticipados: 0,
};

describe("PerfilDetalhe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits formPreview on mount with profile values", async () => {
    const wrapper = mount(PerfilDetalhe, {
      props: { profile: baseProfile },
    });
    await flushPromises();

    const previews = wrapper.emitted("formPreview");
    expect(previews).toBeTruthy();
    expect(previews![0][0]).toEqual({
      primeiroNome: "Ana",
      ultimoNome: "Silva",
      descricao: "Bio da Ana",
      funcao: "Participante",
    });
  });

  it("calls updateProfile and emits saved on submit", async () => {
    (accountService.updateProfile as any).mockResolvedValue({
      ...baseProfile,
      ultimoNome: "Atualizada",
      nome: "Ana Atualizada",
    });

    const wrapper = mount(PerfilDetalhe, {
      props: { profile: baseProfile },
    });
    await flushPromises();

    const vm = wrapper.vm as any;
    vm.ultimoNome = "Atualizada";
    await vm.submitForm();
    await flushPromises();

    expect(accountService.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        primeiroNome: "Ana",
        ultimoNome: "Atualizada",
        userName: "ana",
      }),
    );
    expect(wrapper.emitted("saved")).toBeTruthy();
  });

  it("emits cancelled on cancelEdit", async () => {
    const wrapper = mount(PerfilDetalhe, {
      props: { profile: baseProfile },
    });
    await flushPromises();

    const vm = wrapper.vm as any;
    vm.ultimoNome = "Alterado";
    vm.cancelEdit();

    expect(vm.ultimoNome).toBe("Silva");
    expect(wrapper.emitted("cancelled")).toBeTruthy();
  });
});
