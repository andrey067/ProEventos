import { mount, flushPromises } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RedesSociais from "./RedesSociais.vue";
import redeSocialService from "../../../services/redeSocialService";

vi.mock("../../../services/redeSocialService", () => ({
  default: {
    listMine: vi.fn(),
    saveMine: vi.fn(),
    removeMine: vi.fn(),
  },
}));

type RedesSociaisVm = {
  redes: { id?: number; nome: string; url: string }[];
  saveRedes: () => Promise<void>;
  askDeleteRede: (index: number) => void;
  confirmDeleteRede: () => Promise<void>;
};

describe("RedesSociais", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads redes on mount", async () => {
    (redeSocialService.listMine as any).mockResolvedValue({
      data: [{ id: 1, nome: "GitHub", url: "https://github.com/me" }],
    });
    const wrapper = mount(RedesSociais);
    await flushPromises();

    expect(redeSocialService.listMine).toHaveBeenCalled();
    const vm = wrapper.vm as unknown as RedesSociaisVm;
    expect(vm.redes).toHaveLength(1);
    expect(vm.redes[0].nome).toBe("GitHub");
  });

  it("loads and saves redes", async () => {
    (redeSocialService.listMine as any).mockResolvedValue({
      data: [{ id: 1, nome: "GitHub", url: "https://github.com/me" }],
    });
    (redeSocialService.saveMine as any).mockResolvedValue({
      data: [{ id: 1, nome: "GitHub", url: "https://github.com/updated" }],
    });

    const wrapper = mount(RedesSociais);
    await flushPromises();

    const vm = wrapper.vm as unknown as RedesSociaisVm;
    vm.redes[0].url = "https://github.com/updated";
    await vm.saveRedes();
    await flushPromises();

    expect(redeSocialService.saveMine).toHaveBeenCalledWith([
      expect.objectContaining({
        nome: "GitHub",
        url: "https://github.com/updated",
      }),
    ]);
    expect(wrapper.text()).toContain("Redes sociais salvas com sucesso");
  });

  it("deletes persisted rede after confirmation", async () => {
    (redeSocialService.listMine as any).mockResolvedValue({
      data: [{ id: 7, nome: "LinkedIn", url: "https://linkedin.com/in/me" }],
    });
    (redeSocialService.removeMine as any).mockResolvedValue({ status: 200 });

    const wrapper = mount(RedesSociais);
    await flushPromises();

    const vm = wrapper.vm as unknown as RedesSociaisVm;
    vm.askDeleteRede(0);
    await vm.confirmDeleteRede();
    await flushPromises();

    expect(redeSocialService.removeMine).toHaveBeenCalledWith(7);
    expect(vm.redes).toHaveLength(0);
    expect(wrapper.text()).toContain("Rede social excluída");
  });

  it("shows error when load fails", async () => {
    (redeSocialService.listMine as any).mockRejectedValue(new Error("fail"));
    const wrapper = mount(RedesSociais);
    await flushPromises();
    expect(wrapper.text()).toContain("Não foi possível carregar redes sociais");
  });

  it("blocks save when nome/url are empty", async () => {
    (redeSocialService.listMine as any).mockResolvedValue({ data: [] });
    const wrapper = mount(RedesSociais);
    await flushPromises();

    const vm = wrapper.vm as unknown as RedesSociaisVm & {
      addRede: () => void;
      redesError: string | null;
    };
    vm.addRede();
    await vm.saveRedes();
    await flushPromises();

    expect(redeSocialService.saveMine).not.toHaveBeenCalled();
    expect(vm.redesError).toBe("Preencha nome e URL de todas as redes.");
  });

  it("shows axios message when save fails", async () => {
    const { AxiosError } = await import("axios");
    (redeSocialService.listMine as any).mockResolvedValue({
      data: [{ id: 1, nome: "GitHub", url: "https://github.com/me" }],
    });
    const err = new AxiosError("bad");
    (err as any).response = { status: 400, data: { message: "url inválida" } };
    (redeSocialService.saveMine as any).mockRejectedValue(err);

    const wrapper = mount(RedesSociais);
    await flushPromises();
    const vm = wrapper.vm as unknown as RedesSociaisVm;
    await vm.saveRedes();
    await flushPromises();

    expect(wrapper.text()).toContain("url inválida");
  });

  it("shows generic save error for non-axios failures", async () => {
    (redeSocialService.listMine as any).mockResolvedValue({
      data: [{ id: 1, nome: "GitHub", url: "https://github.com/me" }],
    });
    (redeSocialService.saveMine as any).mockRejectedValue(new Error("boom"));

    const wrapper = mount(RedesSociais);
    await flushPromises();
    const vm = wrapper.vm as unknown as RedesSociaisVm;
    await vm.saveRedes();
    await flushPromises();

    expect(wrapper.text()).toContain("Erro ao salvar redes sociais");
  });

  it("removes unpersisted rede without API and reports delete error", async () => {
    (redeSocialService.listMine as any).mockResolvedValue({ data: [] });
    const wrapper = mount(RedesSociais);
    await flushPromises();

    const vm = wrapper.vm as unknown as RedesSociaisVm & { addRede: () => void };
    vm.addRede();
    vm.redes[0] = { id: 0, nome: "Temp", url: "https://temp.dev" };
    vm.askDeleteRede(0);
    await vm.confirmDeleteRede();
    await flushPromises();
    expect(redeSocialService.removeMine).not.toHaveBeenCalled();
    expect(vm.redes).toHaveLength(0);

    (redeSocialService.listMine as any).mockResolvedValue({
      data: [{ id: 9, nome: "X", url: "https://x.com" }],
    });
    (redeSocialService.removeMine as any).mockRejectedValue(new Error("fail"));
    const wrapper2 = mount(RedesSociais);
    await flushPromises();
    const vm2 = wrapper2.vm as unknown as RedesSociaisVm;
    vm2.askDeleteRede(0);
    await vm2.confirmDeleteRede();
    await flushPromises();
    expect(wrapper2.text()).toContain("Erro ao excluir rede social");
  });

  it("uses fallback delete message when nome is empty", async () => {
    (redeSocialService.listMine as any).mockResolvedValue({
      data: [{ id: 1, nome: "", url: "https://x.com" }],
    });
    const wrapper = mount(RedesSociais);
    await flushPromises();
    const vm = wrapper.vm as unknown as RedesSociaisVm & {
      deleteRedeMessage: string;
      pendingRedeDelete: number | null;
    };
    vm.askDeleteRede(0);
    expect(vm.deleteRedeMessage).toContain("esta rede");
    vm.pendingRedeDelete = null;
    expect(vm.deleteRedeMessage).toBe("");
  });
});
