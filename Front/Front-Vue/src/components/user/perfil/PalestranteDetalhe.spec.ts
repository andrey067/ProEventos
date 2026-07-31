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
});
