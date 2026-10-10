import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.vue";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

type Fields = {
  type?: string;
  source?: string;
  label?: string;
  nominal?: string;
  desc?: string;
};

async function fillForm(wrapper: any, f: Fields) {
  if (f.type !== undefined)
    await wrapper.find('[data-testid="add-cash-flow-type-select"]').setValue(f.type);
  if (f.source !== undefined)
    await wrapper.find('[data-testid="add-cash-flow-source-select"]').setValue(f.source);
  if (f.label !== undefined)
    await wrapper.find('[data-testid="add-cash-flow-label-input"]').setValue(f.label);
  if (f.nominal !== undefined)
    await wrapper.find('[data-testid="add-cash-flow-nominal-input"]').setValue(f.nominal);
  if (f.desc !== undefined)
    await wrapper.find('[data-testid="add-cash-flow-description-input"]').setValue(f.desc);
}

describe("AddModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    expect(wrapper.find('[data-testid="add-cash-flow-modal"]').exists()).toBe(false);
  });

  it("should render label suggestions from store", () => {
    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: true },
      preloadedState: { labels: ["gaji", "makan"] },
    });
    expect(wrapper.findAll("datalist option").length).toBe(2);
  });

  it("should lock and unlock body scroll when show changes", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });

    await wrapper.setProps({ show: true });
    expect(document.body.style.overflow).toBe("hidden");

    await wrapper.setProps({ show: false });
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should validate label, nominal, and description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
    const { wrapper, cashFlowsStore } = renderWithProviders(AddModal, { props: { show: true } });
    const addSpy = vi.spyOn(cashFlowsStore, "asyncSetIsCashFlowAdd");
    const form = wrapper.find("form");

    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Label tidak boleh kosong");

    await fillForm(wrapper, { label: "gaji", nominal: "0" });
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Nominal harus lebih dari 0");

    await fillForm(wrapper, { nominal: "1000", desc: "   " });
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Keterangan tidak boleh kosong");

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should dispatch asyncSetIsCashFlowAdd and close on success", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(AddModal, { props: { show: true } });
    const addSpy = vi
      .spyOn(cashFlowsStore, "asyncSetIsCashFlowAdd")
      .mockReturnValue(Promise.resolve());
    const listSpy = vi
      .spyOn(cashFlowsStore, "asyncSetCashFlows")
      .mockReturnValue(Promise.resolve());
    const labelsSpy = vi
      .spyOn(cashFlowsStore, "asyncSetLabels")
      .mockReturnValue(Promise.resolve());

    await fillForm(wrapper, {
      type: "outflow",
      source: "savings",
      label: "  makan  ",
      nominal: "25000",
      desc: "  Makan siang  ",
    });
    await wrapper.find("form").trigger("submit");

    expect(addSpy).toHaveBeenCalledWith("outflow", "savings", "makan", 25000, "Makan siang");

    cashFlowsStore.setIsCashFlowAdd(true);
    cashFlowsStore.setIsCashFlowAdded(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(listSpy).toHaveBeenCalled();
    expect(labelsSpy).toHaveBeenCalled();
    expect(wrapper.emitted("close")).toBeTruthy();
    expect(
      (wrapper.find('[data-testid="add-cash-flow-label-input"]').element as HTMLInputElement).value
    ).toBe("");
    expect(
      (wrapper.find('[data-testid="add-cash-flow-type-select"]').element as HTMLSelectElement).value
    ).toBe("inflow");
  });

  it("should keep modal open when add failed", async () => {
    const { wrapper, cashFlowsStore } = renderWithProviders(AddModal, { props: { show: true } });

    cashFlowsStore.setIsCashFlowAdd(true);
    cashFlowsStore.setIsCashFlowAdded(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.emitted("close")).toBeFalsy();
    expect(wrapper.find('[data-testid="add-cash-flow-modal"]').exists()).toBe(true);
  });

  it("should close modal when close or cancel button clicked", async () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });

    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(1);

    await wrapper.find('[data-testid="cancel-add-modal-btn"]').trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(2);
  });
});
