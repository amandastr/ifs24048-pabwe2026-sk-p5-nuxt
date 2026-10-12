import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useCashFlowsStore } from "./cashFlowsStore";
import cashFlowApi, { emptyStats, type CashFlow } from "../api/cashFlowApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("cashFlowsStore", () => {
  let successSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  const dummy: CashFlow = {
    id: 1,
    type: "inflow",
    source: "cash",
    label: "gaji",
    nominal: 1000,
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    successSpy = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => ({}) as any);
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => ({}) as any);
  });

  it("should have correct default state", () => {
    const store = useCashFlowsStore();
    expect(store.cashFlows).toEqual([]);
    expect(store.cashFlow).toBeNull();
    expect(store.stats).toEqual(emptyStats());
    expect(store.labels).toEqual([]);
    expect(store.dailyStats).toEqual([]);
    expect(store.monthlyStats).toEqual([]);
    [
      "isCashFlow",
      "isCashFlowAdd",
      "isCashFlowAdded",
      "isCashFlowChange",
      "isCashFlowChanged",
      "isCashFlowDelete",
      "isCashFlowDeleted",
      "isCashFlowDeleteAll",
      "isCashFlowDeletedAll",
    ].forEach((key) => expect((store as any)[key]).toBe(false));
  });

  it("should update state with setters", () => {
    const store = useCashFlowsStore();

    store.setCashFlows([dummy]);
    expect(store.cashFlows).toEqual([dummy]);
    store.setCashFlow(dummy);
    expect(store.cashFlow).toEqual(dummy);
    const stats = { ...emptyStats(), cash: 5 };
    store.setStats(stats);
    expect(store.stats).toEqual(stats);
    store.setLabels(["a"]);
    expect(store.labels).toEqual(["a"]);
    store.setDailyStats([{ d: 1 }]);
    expect(store.dailyStats).toEqual([{ d: 1 }]);
    store.setMonthlyStats([{ m: 1 }]);
    expect(store.monthlyStats).toEqual([{ m: 1 }]);

    const setters: Record<string, string> = {
      setIsCashFlow: "isCashFlow",
      setIsCashFlowAdd: "isCashFlowAdd",
      setIsCashFlowAdded: "isCashFlowAdded",
      setIsCashFlowChange: "isCashFlowChange",
      setIsCashFlowChanged: "isCashFlowChanged",
      setIsCashFlowDelete: "isCashFlowDelete",
      setIsCashFlowDeleted: "isCashFlowDeleted",
      setIsCashFlowDeleteAll: "isCashFlowDeleteAll",
      setIsCashFlowDeletedAll: "isCashFlowDeletedAll",
    };
    Object.entries(setters).forEach(([setter, key]) => {
      (store as any)[setter](true);
      expect((store as any)[key]).toBe(true);
    });
  });

  describe("asyncSetCashFlows", () => {
    it("should set cash flows and stats on success", async () => {
      const store = useCashFlowsStore();
      const stats = { ...emptyStats(), balance: 10 };
      const spy = vi
        .spyOn(cashFlowApi, "getCashFlows")
        .mockResolvedValue({ cashFlows: [dummy], stats });

      await store.asyncSetCashFlows({ type: "inflow" });

      expect(spy).toHaveBeenCalledWith({ type: "inflow" });
      expect(store.cashFlows).toEqual([dummy]);
      expect(store.stats).toEqual(stats);
    });

    it("should use empty params by default and reset on error", async () => {
      const store = useCashFlowsStore();
      store.setCashFlows([dummy]);
      const spy = vi.spyOn(cashFlowApi, "getCashFlows").mockRejectedValue(new Error("x"));

      await store.asyncSetCashFlows();

      expect(spy).toHaveBeenCalledWith({});
      expect(store.cashFlows).toEqual([]);
      expect(store.stats).toEqual(emptyStats());
    });
  });

  describe("asyncSetCashFlow", () => {
    it("should set cash flow on success", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "getCashFlowById").mockResolvedValue(dummy);

      await store.asyncSetCashFlow(1);

      expect(store.cashFlow).toEqual(dummy);
      expect(store.isCashFlow).toBe(true);
    });

    it("should set null when API returns undefined", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "getCashFlowById").mockResolvedValue(undefined);

      await store.asyncSetCashFlow(1);

      expect(store.cashFlow).toBeNull();
      expect(store.isCashFlow).toBe(true);
    });

    it("should set null on error", async () => {
      const store = useCashFlowsStore();
      store.setCashFlow(dummy);
      vi.spyOn(cashFlowApi, "getCashFlowById").mockRejectedValue(new Error("x"));

      await store.asyncSetCashFlow(1);

      expect(store.cashFlow).toBeNull();
      expect(store.isCashFlow).toBe(true);
    });
  });

  describe("labels and stats", () => {
    it("asyncSetLabels should set labels or empty on error", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "getLabels").mockResolvedValueOnce(["a", "b"]);
      await store.asyncSetLabels();
      expect(store.labels).toEqual(["a", "b"]);

      vi.spyOn(cashFlowApi, "getLabels").mockRejectedValueOnce(new Error("x"));
      await store.asyncSetLabels();
      expect(store.labels).toEqual([]);
    });

    it("asyncSetDailyStats should set stats or empty on error", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "getDailyStats").mockResolvedValueOnce([{ d: 1 }]);
      await store.asyncSetDailyStats();
      expect(store.dailyStats).toEqual([{ d: 1 }]);

      vi.spyOn(cashFlowApi, "getDailyStats").mockRejectedValueOnce(new Error("x"));
      await store.asyncSetDailyStats();
      expect(store.dailyStats).toEqual([]);
    });

    it("asyncSetMonthlyStats should set stats or empty on error", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "getMonthlyStats").mockResolvedValueOnce([{ m: 1 }]);
      await store.asyncSetMonthlyStats();
      expect(store.monthlyStats).toEqual([{ m: 1 }]);

      vi.spyOn(cashFlowApi, "getMonthlyStats").mockRejectedValueOnce(new Error("x"));
      await store.asyncSetMonthlyStats();
      expect(store.monthlyStats).toEqual([]);
    });
  });

  describe("asyncSetIsCashFlowAdd", () => {
    it("should flag added on success", async () => {
      const store = useCashFlowsStore();
      const spy = vi.spyOn(cashFlowApi, "postCashFlow").mockResolvedValue({});

      await store.asyncSetIsCashFlowAdd("inflow", "cash", "gaji", 1000, "Gaji");

      expect(spy).toHaveBeenCalledWith({
        type: "inflow",
        source: "cash",
        label: "gaji",
        nominal: 1000,
        description: "Gaji",
      });
      expect(successSpy).toHaveBeenCalledWith("Catatan arus kas berhasil ditambahkan!");
      expect(store.isCashFlowAdded).toBe(true);
      expect(store.isCashFlowAdd).toBe(true);
    });

    it("should show error on failure", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "postCashFlow").mockRejectedValue(new Error("Gagal"));

      await store.asyncSetIsCashFlowAdd("outflow", "loans", "x", 1, "y");

      expect(errorSpy).toHaveBeenCalledWith("Gagal");
      expect(store.isCashFlowAdded).toBe(false);
      expect(store.isCashFlowAdd).toBe(true);
    });
  });

  describe("asyncSetIsCashFlowChange", () => {
    it("should use API message on success", async () => {
      const store = useCashFlowsStore();
      const spy = vi.spyOn(cashFlowApi, "putCashFlow").mockResolvedValue("Diubah");

      await store.asyncSetIsCashFlowChange(1, "inflow", "cash", "gaji", 1000, "Gaji");

      expect(spy).toHaveBeenCalledWith(1, {
        type: "inflow",
        source: "cash",
        label: "gaji",
        nominal: 1000,
        description: "Gaji",
      });
      expect(successSpy).toHaveBeenCalledWith("Diubah");
      expect(store.isCashFlowChanged).toBe(true);
      expect(store.isCashFlowChange).toBe(true);
    });

    it("should use fallback message when API returns none", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "putCashFlow").mockResolvedValue("");

      await store.asyncSetIsCashFlowChange(1, "inflow", "cash", "a", 1, "b");

      expect(successSpy).toHaveBeenCalledWith("Catatan arus kas berhasil diperbarui!");
    });

    it("should show error on failure", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "putCashFlow").mockRejectedValue(new Error("Err"));

      await store.asyncSetIsCashFlowChange(1, "inflow", "cash", "a", 1, "b");

      expect(errorSpy).toHaveBeenCalledWith("Err");
      expect(store.isCashFlowChanged).toBe(false);
      expect(store.isCashFlowChange).toBe(true);
    });
  });

  describe("asyncSetIsCashFlowDelete", () => {
    it("should use API message on success", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteCashFlow").mockResolvedValue("Dihapus");

      await store.asyncSetIsCashFlowDelete(1);

      expect(successSpy).toHaveBeenCalledWith("Dihapus");
      expect(store.isCashFlowDeleted).toBe(true);
      expect(store.isCashFlowDelete).toBe(true);
    });

    it("should use fallback message when API returns none", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteCashFlow").mockResolvedValue("");

      await store.asyncSetIsCashFlowDelete(1);

      expect(successSpy).toHaveBeenCalledWith("Catatan arus kas berhasil dihapus!");
    });

    it("should show error on failure", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteCashFlow").mockRejectedValue(new Error("Err"));

      await store.asyncSetIsCashFlowDelete(1);

      expect(errorSpy).toHaveBeenCalledWith("Err");
      expect(store.isCashFlowDeleted).toBe(false);
      expect(store.isCashFlowDelete).toBe(true);
    });
  });

  describe("asyncSetIsCashFlowDeleteAll", () => {
    it("should use API message on success", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteAllCashFlows").mockResolvedValue("Semua direset");

      await store.asyncSetIsCashFlowDeleteAll();

      expect(successSpy).toHaveBeenCalledWith("Semua direset");
      expect(store.isCashFlowDeletedAll).toBe(true);
      expect(store.isCashFlowDeleteAll).toBe(true);
    });

    it("should use fallback message when API returns none", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteAllCashFlows").mockResolvedValue("");

      await store.asyncSetIsCashFlowDeleteAll();

      expect(successSpy).toHaveBeenCalledWith("Seluruh catatan arus kas berhasil direset!");
    });

    it("should show error on failure", async () => {
      const store = useCashFlowsStore();
      vi.spyOn(cashFlowApi, "deleteAllCashFlows").mockRejectedValue(new Error("Err"));

      await store.asyncSetIsCashFlowDeleteAll();

      expect(errorSpy).toHaveBeenCalledWith("Err");
      expect(store.isCashFlowDeletedAll).toBe(false);
      expect(store.isCashFlowDeleteAll).toBe(true);
    });
  });
});

describe("cashFlowsStore - lastError", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it("should store the last error message with setLastError", () => {
    const store = useCashFlowsStore();
    expect(store.lastError).toBe("");
    store.setLastError("Oops");
    expect(store.lastError).toBe("Oops");
  });

  it("should record the error message when each loader fails", async () => {
    const store = useCashFlowsStore();

    vi.spyOn(cashFlowApi, "getCashFlows").mockRejectedValue(new Error("e1"));
    await store.asyncSetCashFlows();
    expect(store.lastError).toBe("e1");

    vi.spyOn(cashFlowApi, "getCashFlowById").mockRejectedValue(new Error("e2"));
    await store.asyncSetCashFlow(1);
    expect(store.lastError).toBe("e2");

    vi.spyOn(cashFlowApi, "getLabels").mockRejectedValue(new Error("e3"));
    await store.asyncSetLabels();
    expect(store.lastError).toBe("e3");

    vi.spyOn(cashFlowApi, "getDailyStats").mockRejectedValue(new Error("e4"));
    await store.asyncSetDailyStats();
    expect(store.lastError).toBe("e4");

    vi.spyOn(cashFlowApi, "getMonthlyStats").mockRejectedValue("plain text");
    await store.asyncSetMonthlyStats();
    expect(store.lastError).toBe("plain text");
  });
});
