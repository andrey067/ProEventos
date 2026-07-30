import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import AlterarSenha from "./AlterarSenha.vue";
import accountService from "../../../services/accountService";

vi.mock("../../../services/accountService", () => ({
  default: {
    changePassword: vi.fn(),
  },
}));

type AlterarSenhaVm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  submitForm: () => Promise<void>;
};

async function mountComponent() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/user/senha", component: AlterarSenha },
      { path: "/user/perfil", component: { template: "<div />" } },
    ],
  });
  await router.push("/user/senha");
  await router.isReady();
  return mount(AlterarSenha, { global: { plugins: [router] } });
}

describe("AlterarSenha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows mismatch error and does not call changePassword", async () => {
    const wrapper = await mountComponent();
    const vm = wrapper.vm as unknown as AlterarSenhaVm;

    vm.currentPassword = "antiga";
    vm.newPassword = "nova123";
    vm.confirmPassword = "diferente";
    await vm.submitForm();
    await flushPromises();

    expect(wrapper.text()).toContain("As senhas não coincidem");
    expect(accountService.changePassword).not.toHaveBeenCalled();
  });

  it("calls changePassword and shows success when passwords match", async () => {
    (accountService.changePassword as any).mockResolvedValue(undefined);
    const wrapper = await mountComponent();
    const vm = wrapper.vm as unknown as AlterarSenhaVm;

    vm.currentPassword = "antiga";
    vm.newPassword = "nova123";
    vm.confirmPassword = "nova123";
    await vm.submitForm();
    await flushPromises();

    expect(accountService.changePassword).toHaveBeenCalledWith({
      currentPassword: "antiga",
      newPassword: "nova123",
    });
    expect(wrapper.text()).toContain("Senha alterada com sucesso");
  });

  it("shows error when changePassword fails", async () => {
    (accountService.changePassword as any).mockRejectedValue(new Error("fail"));
    const wrapper = await mountComponent();
    const vm = wrapper.vm as unknown as AlterarSenhaVm;

    vm.currentPassword = "antiga";
    vm.newPassword = "nova123";
    vm.confirmPassword = "nova123";
    await vm.submitForm();
    await flushPromises();

    expect(wrapper.text()).toMatch(/não foi possível|erro/i);
  });

  it("shows API error message on axios failure", async () => {
    const { AxiosError } = await import("axios");
    const axiosError = new AxiosError("bad");
    axiosError.response = { data: { description: "Senha atual incorreta" } } as never;
    (accountService.changePassword as any).mockRejectedValue(axiosError);

    const wrapper = await mountComponent();
    const vm = wrapper.vm as unknown as AlterarSenhaVm;
    vm.currentPassword = "antiga";
    vm.newPassword = "nova123";
    vm.confirmPassword = "nova123";
    await vm.submitForm();
    await flushPromises();

    expect(wrapper.text()).toContain("Senha atual incorreta");
  });

  it("shows required field validation errors", async () => {
    const wrapper = await mountComponent();
    const vm = wrapper.vm as unknown as AlterarSenhaVm;
    await vm.submitForm();
    await flushPromises();

    expect(accountService.changePassword).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Senha atual é obrigatória");
  });
});
