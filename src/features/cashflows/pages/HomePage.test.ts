import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./HomePage.vue";
import { renderWithProviders, createMockPinia } from "../../../test-utils";
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

describe("HomePage", () => {
  const mockProfile = { id: 1, name: "Abdullah", email: "abdul@del.org" };
  const mockCashFlows = [
    {
      id: 1,
      type: "inflow",
      source: "cash",
      label: "gaji",
      nominal: 5000000,
      description: "Gaji bulanan",
      created_at: "2026-01-01T00:00:00.000000Z",
    },
    {
      id: 2,
      type: "outflow",
      source: "savings",
      label: "makan",
      nominal: 50000,
      description: null,
      created_at: "2026-01-02T00:00:00.000000Z",
    },
  ];
  const mockStats = {
    total_inflow: 5000000,
    total_outflow: 50000,
    balance: 4950000,
    cash: 5000000,
    savings: -50000,
    loans: 0,
  };

  function setup(state: Record<string, any> = {}) {
    const { pinia, cashFlowsStore } = createMockPinia({
      profile: mockProfile,
      cashFlows: mockCashFlows,
      stats: mockStats,
      labels: ["gaji", "makan"],
      ...state,
    });
    const listSpy = vi.spyOn(cashFlowsStore, "asyncSetCashFlows").mockResolvedValue();
    const labelsSpy = vi.spyOn(cashFlowsStore, "asyncSetLabels").mockResolvedValue();
    const result = renderWithProviders(HomePage, { pinia });
    return { ...result, cashFlowsStore, listSpy, labelsSpy };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    mockRouter.push.mockClear();
  });

  it("should render nothing if profile is not present", () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile: null },
    });
    expect(wrapper.find('[data-testid="add-cash-flow-btn"]').exists()).toBe(false);
  });

  it("should load cash flows and labels on mount", async () => {
    const { listSpy, labelsSpy } = setup();
    await flush();

    expect(listSpy).toHaveBeenCalledWith({
      type: "",
      source: "",
      label: "",
      start_date: "",
      end_date: "",
    });
    expect(labelsSpy).toHaveBeenCalled();
  });

  it("should render summary cards and transaction rows", async () => {
    const { wrapper } = setup();
    await flush();

    expect(wrapper.find('[data-testid="stat-balance"]').text()).toContain("4.950.000");
    expect(wrapper.find('[data-testid="stat-inflow"]').text()).toContain("5.000.000");
    expect(wrapper.find('[data-testid="stat-outflow"]').text()).toContain("50.000");
    expect(wrapper.find('[data-testid="stat-cash"]').text()).toContain("5.000.000");
    expect(wrapper.find('[data-testid="stat-savings"]').text()).toContain("50.000");
    expect(wrapper.find('[data-testid="stat-loans"]').text()).toContain("0");

    expect(wrapper.find('[data-testid="cash-flow-row-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="cash-flow-row-2"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="cash-flow-type-1"]').text()).toContain("Pemasukan");
    expect(wrapper.find('[data-testid="cash-flow-type-2"]').text()).toContain("Pengeluaran");
    expect(wrapper.find('[data-testid="cash-flow-row-1"]').text()).toContain("Tunai");
    expect(wrapper.find('[data-testid="cash-flow-row-2"]').text()).toContain("Tabungan");
  });

  it("should show loading state and then empty state", async () => {
    let resolveFn: (v?: unknown) => void = () => {};
    const { pinia, cashFlowsStore } = createMockPinia({ profile: mockProfile, cashFlows: [] });
    vi.spyOn(cashFlowsStore, "asyncSetCashFlows").mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve;
      }) as Promise<void>
    );
    vi.spyOn(cashFlowsStore, "asyncSetLabels").mockResolvedValue();
    const { wrapper } = renderWithProviders(HomePage, { pinia });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="cash-flows-loading"]').exists()).toBe(true);

    resolveFn();
    await flush();

    expect(wrapper.find('[data-testid="cash-flows-loading"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="cash-flows-empty"]').exists()).toBe(true);
  });

  it("should handle null cash flows in store", async () => {
    const { wrapper } = setup({ cashFlows: null });
    await flush();

    expect(wrapper.find('[data-testid="cash-flows-empty"]').exists()).toBe(true);
  });

  it("should reload with filters when any filter changes and reset them", async () => {
    const { wrapper, listSpy } = setup();
    await flush();

    await wrapper.find('[data-testid="filter-type-select"]').setValue("outflow");
    expect(listSpy).toHaveBeenLastCalledWith(expect.objectContaining({ type: "outflow" }));

    await wrapper.find('[data-testid="filter-source-select"]').setValue("loans");
    expect(listSpy).toHaveBeenLastCalledWith(expect.objectContaining({ source: "loans" }));

    await wrapper.find('[data-testid="filter-label-select"]').setValue("gaji");
    expect(listSpy).toHaveBeenLastCalledWith(expect.objectContaining({ label: "gaji" }));

    await wrapper.find('[data-testid="filter-start-date-input"]').setValue("2026-01-01");
    expect(listSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ start_date: "2026-01-01" })
    );

    await wrapper.find('[data-testid="filter-end-date-input"]').setValue("2026-01-31");
    expect(listSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({ end_date: "2026-01-31" })
    );

    await wrapper.find('[data-testid="reset-filter-btn"]').trigger("click");
    await flush();
    expect(listSpy).toHaveBeenLastCalledWith({
      type: "",
      source: "",
      label: "",
      start_date: "",
      end_date: "",
    });
  });

  it("should navigate to detail page when view button clicked", async () => {
    const { wrapper } = setup();
    await flush();

    await wrapper.find('[data-testid="view-cash-flow-1"]').trigger("click");
    expect(mockRouter.push).toHaveBeenCalledWith("/cash-flows/1");
  });

  it("should open and close add modal and change modal", async () => {
    const { wrapper } = setup();
    await flush();

    await wrapper.find('[data-testid="add-cash-flow-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-cash-flow-modal"]').exists()).toBe(true);
    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-cash-flow-modal"]').exists()).toBe(false);

    await wrapper.find('[data-testid="edit-cash-flow-1"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-cash-flow-modal"]').exists()).toBe(true);
    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-cash-flow-modal"]').exists()).toBe(false);
  });

  it("should delete a cash flow after confirmation only", async () => {
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper, cashFlowsStore } = setup();
    const deleteSpy = vi.spyOn(cashFlowsStore, "asyncSetIsCashFlowDelete").mockResolvedValue();
    await flush();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
    await wrapper.find('[data-testid="delete-cash-flow-1"]').trigger("click");
    await flush();
    expect(deleteSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
    await wrapper.find('[data-testid="delete-cash-flow-1"]').trigger("click");
    await flush();
    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it("should reset all cash flows after confirmation only", async () => {
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");
    const { wrapper, cashFlowsStore } = setup();
    const resetSpy = vi.spyOn(cashFlowsStore, "asyncSetIsCashFlowDeleteAll").mockResolvedValue();
    await flush();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
    await wrapper.find('[data-testid="reset-cash-flows-btn"]').trigger("click");
    await flush();
    expect(resetSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
    await wrapper.find('[data-testid="reset-cash-flows-btn"]').trigger("click");
    await flush();
    expect(resetSpy).toHaveBeenCalled();
  });

  it("should reload data after a cash flow is deleted", async () => {
    const { cashFlowsStore, listSpy, labelsSpy } = setup();
    await flush();
    listSpy.mockClear();
    labelsSpy.mockClear();

    cashFlowsStore.setIsCashFlowDeleted(true);
    await flush();
    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(labelsSpy).toHaveBeenCalledTimes(1);
    expect(cashFlowsStore.isCashFlowDeleted).toBe(false);

    cashFlowsStore.setIsCashFlowDeleted(false);
    await flush();
    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it("should reload data after all cash flows are reset", async () => {
    const { cashFlowsStore, listSpy, labelsSpy } = setup();
    await flush();
    listSpy.mockClear();
    labelsSpy.mockClear();

    cashFlowsStore.setIsCashFlowDeletedAll(true);
    await flush();
    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(labelsSpy).toHaveBeenCalledTimes(1);
    expect(cashFlowsStore.isCashFlowDeletedAll).toBe(false);

    cashFlowsStore.setIsCashFlowDeletedAll(false);
    await flush();
    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it("should not update loading state after unmount", async () => {
    let resolveFn: (v?: unknown) => void = () => {};
    const { pinia, cashFlowsStore } = createMockPinia({ profile: mockProfile });
    vi.spyOn(cashFlowsStore, "asyncSetCashFlows").mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve;
      }) as Promise<void>
    );
    vi.spyOn(cashFlowsStore, "asyncSetLabels").mockResolvedValue();
    const { wrapper } = renderWithProviders(HomePage, { pinia });
    wrapper.unmount();

    resolveFn();
    await flush();

    expect(wrapper.exists()).toBe(false);
  });
});
