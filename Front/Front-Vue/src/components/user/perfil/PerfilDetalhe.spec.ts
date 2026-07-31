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

  it("shows validation errors for required fields", async () => {
    const wrapper = mount(PerfilDetalhe, {
      props: { profile: baseProfile },
    });
    await flushPromises();

    const vm = wrapper.vm as any;
    vm.primeiroNome = "";
    vm.ultimoNome = "";
    await vm.submitForm();
    await flushPromises();

    expect(accountService.updateProfile).not.toHaveBeenCalled();
    expect(wrapper.text()).toMatch(/primeiro|último|obrigat/i);
  });

  it("shows axios error message when update fails", async () => {
    const { AxiosError } = await import("axios");
    const err = new AxiosError("conflict");
    (err as any).response = { status: 409, data: { message: "email em uso" } };
    (accountService.updateProfile as any).mockRejectedValue(err);

    const wrapper = mount(PerfilDetalhe, {
      props: { profile: baseProfile },
    });
    await flushPromises();
    const vm = wrapper.vm as any;
    await vm.submitForm();
    await flushPromises();

    expect(wrapper.text()).toContain("email em uso");
  });

  it("shows generic error for non-axios failures", async () => {
    (accountService.updateProfile as any).mockRejectedValue(new Error("boom"));
    const wrapper = mount(PerfilDetalhe, {
      props: { profile: baseProfile },
    });
    await flushPromises();
    const vm = wrapper.vm as any;
    await vm.submitForm();
    await flushPromises();

    expect(wrapper.text()).toContain("Não foi possível atualizar o perfil");
  });

  it("includes password in payload when provided", async () => {
    (accountService.updateProfile as any).mockResolvedValue(baseProfile);
    const wrapper = mount(PerfilDetalhe, {
      props: { profile: baseProfile },
    });
    await flushPromises();
    const vm = wrapper.vm as any;
    vm.password = "Senha@123";
    vm.confirmePassword = "Senha@123";
    await vm.submitForm();
    await flushPromises();

    expect(accountService.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ password: "Senha@123" }),
    );
  });

  it("maps nullish profile fields to empty form defaults", async () => {
    const wrapper = mount(PerfilDetalhe, {
      props: {
        profile: {
          userName: "ana",
          email: "ana@test.com",
          nome: "",
          primeiroNome: null as unknown as string,
          ultimoNome: null as unknown as string,
          titulo: undefined as unknown as typeof baseProfile.titulo,
          funcao: undefined as unknown as typeof baseProfile.funcao,
          telefone: null as unknown as string,
          descricao: null as unknown as string,
          imagemURL: null,
          eventosMinistrados: 0,
          eventosParticipados: 0,
        },
      },
    });
    await flushPromises();
    const previews = wrapper.emitted("formPreview");
    expect(previews![previews!.length - 1][0]).toEqual({
      primeiroNome: "",
      ultimoNome: "",
      descricao: "",
      funcao: "Participante",
    });
  });
});
