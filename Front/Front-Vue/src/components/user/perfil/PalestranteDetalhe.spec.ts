import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosError } from "axios";
import PalestranteDetalhe from "./PalestranteDetalhe.vue";
import palestranteService from "../../../services/palestranteService";

vi.mock("../../../services/palestranteService", () => ({
  default: {
    getMe: vi.fn(),
    update: vi.fn(),
  },
}));

describe("PalestranteDetalhe", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls getMe and fills fields", async () => {
    (palestranteService.getMe as any).mockResolvedValue({
      data: {
        id: 7,
        nome: "Speaker",
        email: "s@x.com",
        telefone: "11",
        imagemURL: "",
        miniCurriculo: "Mini",
      },
    });
    const wrapper = mount(PalestranteDetalhe);
    await flushPromises();
    expect(palestranteService.getMe).toHaveBeenCalled();
    expect((wrapper.find('input[name="nome"]').element as HTMLInputElement).value).toBe(
      "Speaker",
    );
  });

  it("shows 404 warning", async () => {
    const err = new AxiosError("missing");
    (err as any).response = { status: 404 };
    (palestranteService.getMe as any).mockRejectedValue(err);
    const wrapper = mount(PalestranteDetalhe);
    await flushPromises();
    expect(wrapper.text()).toContain("Salve o perfil com função Palestrante primeiro");
  });

  it("saves via update with getMe id", async () => {
    (palestranteService.getMe as any).mockResolvedValue({
      data: { id: 7, nome: "Speaker", email: "", telefone: "", imagemURL: "", miniCurriculo: "" },
    });
    (palestranteService.update as any).mockResolvedValue({ data: { id: 7, nome: "Novo" } });
    const wrapper = mount(PalestranteDetalhe);
    await flushPromises();
    const vm = wrapper.vm as { nome: string; onSubmit: () => Promise<void> };
    vm.nome = "Novo";
    await vm.onSubmit();
    await flushPromises();
    expect(palestranteService.update).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ nome: "Novo" }),
    );
  });

  it("shows axios load error when getMe fails with non-404", async () => {
    const err = new AxiosError("server");
    (err as any).response = { status: 500, data: { message: "falha servidor" } };
    (palestranteService.getMe as any).mockRejectedValue(err);
    const wrapper = mount(PalestranteDetalhe);
    await flushPromises();
    expect(wrapper.text()).toContain("falha servidor");
  });

  it("shows generic load error for non-axios failures", async () => {
    (palestranteService.getMe as any).mockRejectedValue(new Error("boom"));
    const wrapper = mount(PalestranteDetalhe);
    await flushPromises();
    expect(wrapper.text()).toContain("Erro ao carregar palestrante");
  });

  it("shows axios save error when update fails", async () => {
    (palestranteService.getMe as any).mockResolvedValue({
      data: { id: 7, nome: "Speaker", email: "", telefone: "", imagemURL: "", miniCurriculo: "" },
    });
    const err = new AxiosError("bad");
    (err as any).response = { status: 400, data: { message: "nome inválido" } };
    (palestranteService.update as any).mockRejectedValue(err);
    const wrapper = mount(PalestranteDetalhe);
    await flushPromises();
    const vm = wrapper.vm as { onSubmit: () => Promise<void> };
    await vm.onSubmit();
    await flushPromises();
    expect(wrapper.text()).toContain("nome inválido");
  });

  it("shows generic save error for non-axios failures", async () => {
    (palestranteService.getMe as any).mockResolvedValue({
      data: { id: 7, nome: "Speaker", email: "", telefone: "", imagemURL: "", miniCurriculo: "" },
    });
    (palestranteService.update as any).mockRejectedValue(new Error("boom"));
    const wrapper = mount(PalestranteDetalhe);
    await flushPromises();
    const vm = wrapper.vm as { onSubmit: () => Promise<void> };
    await vm.onSubmit();
    await flushPromises();
    expect(wrapper.text()).toContain("Erro ao salvar palestrante");
  });

  it("coalesces nullish getMe fields into empty strings", async () => {
    (palestranteService.getMe as any).mockResolvedValue({
      data: {
        id: 7,
        nome: null,
        email: null,
        telefone: null,
        imagemURL: null,
        miniCurriculo: null,
      },
    });
    const wrapper = mount(PalestranteDetalhe);
    await flushPromises();
    expect((wrapper.find('input[name="nome"]').element as HTMLInputElement).value).toBe("");
    expect((wrapper.find('input[name="email"]').element as HTMLInputElement).value).toBe("");
  });
});
