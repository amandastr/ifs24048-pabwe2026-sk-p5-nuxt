import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMemoryHistory } from "vue-router";
import DetailPage from "./DetailPage.vue";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
import { createAppRouter } from "../../../router";
import * as toolsHelper from "../../../helpers/toolsHelper";

const mockRouter = {
  push: vi.fn(),
};

vi.mock("vue-router", async () => {
  const actual = await vi.importActual<typeof import("vue-router")>("vue-router");
  return {
    ...actual,
    useRouter: () => mockRouter,
  };
});

const flush = () => new Promise((r) => setTimeout(r, 10));

describe("DetailPage", () => {
  const profile = { id: 1, name: "Pemilik", email: "owner@del.org" };
  const inflow = {
    id: 5,
    type: "inflow",
    source: "cash",
    label: "gaji",
    nominal: 5000000,
    description: "Gaji bulanan",
    created_at: "2026-01-01T00:00:00.000000Z",
    updated_at: "2026-01-02T00:00:00.000000Z",
  };

  async function setup({ cashFlow = inflow as any, prof = profile as any } = {}) {
    const router = createAppRouter(createMemoryHistory());
    await router.push("/cash-flows/5");
    await router.isReady();

    const { pinia, cashFlowsStore } = createMockPinia({ profile: prof, cashFlow });
    const fetchSpy = vi.spyOn(cashFlowsStore, "asyncSetCashFlow").mockResolvedValue();
    const result = renderWithProviders(DetailPage, { pinia, router });
    await flush();
    return { ...result, cashFlowsStore, fetchSpy, router };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRouter.push.mockClear();
  });

  it("should show loader when profile or cash flow is missing", async () => {
    const { wrapper } = await setup({ cashFlow: null });
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
    expect(wrapper.find('[data-testid="back-to-cash-flows-link"]').exists()).toBe(false);
  });

  it("should fetch cash flow on mount using route param", async () => {
    const { fetchSpy } = await setup();
    expect(fetchSpy).toHaveBeenCalledWith("5");
  });

  it("should render inflow detail", async () => {
    const { wrapper } = await setup();

    expect(wrapper.find('[data-testid="detail-label"]').text()).toBe("gaji");
    expect(wrapper.find('[data-testid="detail-type"]').text()).toContain("Pemasukan");
    expect(wrapper.find('[data-testid="detail-nominal"]').text()).toContain("5.000.000");
    expect(wrapper.find('[data-testid="detail-nominal"]').classes()).toContain("text-emerald-700");
    expect(wrapper.find('[data-testid="detail-source"]').text()).toBe("Tunai");
    expect(wrapper.find('[data-testid="detail-description"]').text()).toBe("Gaji bulanan");
    expect(wrapper.find('[data-testid="detail-created-at"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="detail-updated-at"]').exists()).toBe(true);
  });

  it("should render outflow detail without description", async () => {
    const { wrapper } = await setup({
      cashFlow: { ...inflow, type: "outflow", source: "loans", description: "" },
    });

    expect(wrapper.find('[data-testid="detail-type"]').text()).toContain("Pengeluaran");
    expect(wrapper.find('[data-testid="detail-nominal"]').classes()).toContain("text-red-700");
    expect(wrapper.find('[data-testid="detail-source"]').text()).toBe("Pinjaman");
    expect(wrapper.find('[data-testid="detail-description"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="detail-description-empty"]').exists()).toBe(true);
  });

  it("should open and close the edit modal", async () => {
    const { wrapper } = await setup();

    await wrapper.find('[data-testid="edit-detail-cash-flow-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-cash-flow-modal"]').exists()).toBe(true);

    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-cash-flow-modal"]').exists()).toBe(false);
  });

  it("should delete cash flow only after confirmation", async () => {
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper, cashFlowsStore } = await setup();
    const deleteSpy = vi.spyOn(cashFlowsStore, "asyncSetIsCashFlowDelete").mockResolvedValue();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
    await wrapper.find('[data-testid="delete-detail-cash-flow-btn"]').trigger("click");
    await flush();
    expect(deleteSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
    await wrapper.find('[data-testid="delete-detail-cash-flow-btn"]').trigger("click");
    await flush();
    expect(deleteSpy).toHaveBeenCalledWith(5);
  });

  it("should redirect home when cash flow is not found", async () => {
    const { cashFlowsStore } = await setup();

    cashFlowsStore.setCashFlow(null);
    cashFlowsStore.setIsCashFlow(true);
    await flush();

    expect(mockRouter.push).toHaveBeenCalledWith("/");
    expect(cashFlowsStore.isCashFlow).toBe(false);
  });

  it("should stay when cash flow is found after loading", async () => {
    const { cashFlowsStore } = await setup();

    cashFlowsStore.setIsCashFlow(true);
    await flush();

    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(cashFlowsStore.isCashFlow).toBe(false);
  });

  it("should redirect home after cash flow deleted", async () => {
    const { cashFlowsStore } = await setup();

    cashFlowsStore.setIsCashFlowDeleted(true);
    await flush();
    expect(mockRouter.push).toHaveBeenCalledWith("/");
    expect(cashFlowsStore.isCashFlowDeleted).toBe(false);

    mockRouter.push.mockClear();
    cashFlowsStore.setIsCashFlowDeleted(false);
    await flush();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("should refetch when route param changes", async () => {
    const { router, fetchSpy } = await setup();
    fetchSpy.mockClear();

    await router.push("/cash-flows/8");
    await flush();

    expect(fetchSpy).toHaveBeenCalledWith("8");
  });
});
