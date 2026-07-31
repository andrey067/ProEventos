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
});
