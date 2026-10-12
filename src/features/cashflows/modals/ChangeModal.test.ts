import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const val = (wrapper: any, id: string) =>
  (wrapper.find(`[data-testid="${id}"]`).element as HTMLInputElement).value;

describe("ChangeModal", () => {
  const mockCashFlow = {
    id: 1,
    type: "outflow",
    source: "savings",
    label: "makan",
    nominal: 25000,
    description: "Makan siang",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: false, cashFlowId: 1 },
    });
    expect(wrapper.find('[data-testid="edit-cash-flow-modal"]').exists()).toBe(false);
  });

  it("should populate inputs with cash flow data", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 1 },
      preloadedState: { cashFlow: mockCashFlow },
    });

    expect(val(wrapper, "edit-cash-flow-type-select")).toBe("outflow");
    expect(val(wrapper, "edit-cash-flow-source-select")).toBe("savings");
    expect(val(wrapper, "edit-cash-flow-label-input")).toBe("makan");
    expect(val(wrapper, "edit-cash-flow-nominal-input")).toBe("25000");
    expect(val(wrapper, "edit-cash-flow-description-input")).toBe("Makan siang");
  });

  it("should render label suggestions from store", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 1 },
      preloadedState: { cashFlow: mockCashFlow, labels: ["gaji", "makan"] },
    });
    expect(wrapper.findAll("datalist option").length).toBe(2);
  });

  it("should handle empty fields in cash flow object", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 1 },
      preloadedState: {
        cashFlow: {
          id: 1,
          type: "inflow",
          source: "cash",
          label: null,
          nominal: null,
          description: null,
        },
      },
    });

    expect(val(wrapper, "edit-cash-flow-label-input")).toBe("");
    expect(val(wrapper, "edit-cash-flow-nominal-input")).toBe("");
    expect(val(wrapper, "edit-cash-flow-description-input")).toBe("");
  });

  it("should fetch cash flow when cashFlowId or show changes", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(ChangeModal, {
      props: { show: false, cashFlowId: null },
    });
    const fetchSpy = vi
      .spyOn(cashFlowsStore, "asyncSetCashFlow")
      .mockReturnValue(Promise.resolve());

    await wrapper.setProps({ show: true });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("hidden");

    await wrapper.setProps({ cashFlowId: 5 });
    expect(fetchSpy).toHaveBeenCalledWith(5);

    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should validate label, nominal, and description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 1 },
      preloadedState: { cashFlow: mockCashFlow },
    });
    const form = wrapper.find("form");
    const label = wrapper.find('[data-testid="edit-cash-flow-label-input"]');
    const nominal = wrapper.find('[data-testid="edit-cash-flow-nominal-input"]');
    const desc = wrapper.find('[data-testid="edit-cash-flow-description-input"]');

    await label.setValue("   ");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Label tidak boleh kosong");

    await label.setValue("gaji");
    await nominal.setValue("0");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Nominal harus lebih dari 0");

    await nominal.setValue("2000");
    await desc.setValue("  ");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Keterangan tidak boleh kosong");
  });

  it("should dispatch asyncSetIsCashFlowChange and close on success", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 1 },
      preloadedState: { cashFlow: mockCashFlow },
    });
    const changeSpy = vi
      .spyOn(cashFlowsStore, "asyncSetIsCashFlowChange")
      .mockReturnValue(Promise.resolve());
    const listSpy = vi
      .spyOn(cashFlowsStore, "asyncSetCashFlows")
      .mockReturnValue(Promise.resolve());
    const labelsSpy = vi
      .spyOn(cashFlowsStore, "asyncSetLabels")
      .mockReturnValue(Promise.resolve());

    await wrapper.find("form").trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(1, "outflow", "savings", "makan", 25000, "Makan siang");

    cashFlowsStore.setIsCashFlowChange(true);
    cashFlowsStore.setIsCashFlowChanged(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(listSpy).toHaveBeenCalled();
    expect(labelsSpy).toHaveBeenCalled();
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("should submit changed type and source", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 1 },
      preloadedState: { cashFlow: mockCashFlow },
    });
    const changeSpy = vi
      .spyOn(cashFlowsStore, "asyncSetIsCashFlowChange")
      .mockReturnValue(Promise.resolve());

    await wrapper.find('[data-testid="edit-cash-flow-type-select"]').setValue("inflow");
    await wrapper.find('[data-testid="edit-cash-flow-source-select"]').setValue("loans");
    await wrapper.find("form").trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(1, "inflow", "loans", "makan", 25000, "Makan siang");
  });

  it("should keep modal open when change failed", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 1 },
      preloadedState: { cashFlow: mockCashFlow },
    });

    cashFlowsStore.setIsCashFlowChange(true);
    cashFlowsStore.setIsCashFlowChanged(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.emitted("close")).toBeFalsy();
  });

  it("should trigger onClose on cancel or close button click", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, cashFlowId: 1 },
      preloadedState: { cashFlow: mockCashFlow },
    });

    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(1);

    await wrapper.find('[data-testid="cancel-edit-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(2);
  });
});
