import { describe, it, expect, vi, beforeEach } from "vitest";
import cashFlowApi, {
  calculateStats,
  emptyStats,
  normalizeStats,
  type CashFlow,
  type CashFlowPayload,
} from "./cashFlowApi";
import apiHelper from "../../../helpers/apiHelper";

function mockResponse(body: any) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
    json: async () => body,
  } as Response);
}

const payload: CashFlowPayload = {
  type: "inflow",
  source: "cash",
  label: "gaji",
  nominal: 1000,
  description: "Gaji bulanan",
};

describe("cashFlowApi helpers", () => {
  it("emptyStats should return zeroed stats", () => {
    expect(emptyStats()).toEqual({
      total_inflow: 0,
      total_outflow: 0,
      balance: 0,
      cash: 0,
      savings: 0,
      loans: 0,
    });
  });

  it("calculateStats should sum inflow, outflow, and per-source balances", () => {
    const list: CashFlow[] = [
      { id: 1, type: "inflow", source: "cash", label: "a", nominal: 1000 },
      { id: 2, type: "outflow", source: "cash", label: "b", nominal: 300 },
      { id: 3, type: "inflow", source: "savings", label: "c", nominal: "500" as any },
      { id: 4, type: "inflow", source: "loans", label: "d", nominal: 200 },
      { id: 5, type: "outflow", source: "savings", label: "e", nominal: 100 },
      { id: 6, type: "inflow", source: "other" as any, label: "f", nominal: 50 },
    ];

    expect(calculateStats(list)).toEqual({
      total_inflow: 1750,
      total_outflow: 400,
      balance: 1350,
      cash: 700,
      savings: 400,
      loans: 200,
    });
  });

  it("calculateStats should return zero stats for empty list", () => {
    expect(calculateStats([])).toEqual(emptyStats());
  });

  it("normalizeStats should map raw values and fallback invalid ones to zero", () => {
    expect(
      normalizeStats({
        total_inflow: "1000",
        total_outflow: 400,
        cash: 300,
        savings: "x",
        loans: undefined,
      })
    ).toEqual({
      total_inflow: 1000,
      total_outflow: 400,
      balance: 600,
      cash: 300,
      savings: 0,
      loans: 0,
    });
  });
});

describe("cashFlowApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCashFlows", () => {
    it("should fetch without filters and use API stats", async () => {
      const spy = mockResponse({
        success: true,
        data: {
          cash_flows: [{ id: 1, type: "inflow", source: "cash", label: "a", nominal: 10 }],
          stats: { total_inflow: 10, total_outflow: 0, cash: 10, savings: 0, loans: 0 },
        },
      });

      const res = await cashFlowApi.getCashFlows();

      expect(res.cashFlows).toHaveLength(1);
      expect(res.stats.balance).toBe(10);
      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows\/$/);
      expect(spy.mock.calls[0][1]).toEqual({ method: "GET" });
    });

    it("should calculate stats locally when API has no stats", async () => {
      mockResponse({
        status: "success",
        data: {
          cash_flows: [
            { id: 1, type: "inflow", source: "cash", label: "a", nominal: 100 },
            { id: 2, type: "outflow", source: "cash", label: "b", nominal: 40 },
          ],
        },
      });

      const res = await cashFlowApi.getCashFlows();

      expect(res.stats.total_inflow).toBe(100);
      expect(res.stats.total_outflow).toBe(40);
      expect(res.stats.cash).toBe(60);
    });

    it("should return empty list and zero stats when data is missing", async () => {
      mockResponse({ success: true });

      const res = await cashFlowApi.getCashFlows();

      expect(res.cashFlows).toEqual([]);
      expect(res.stats).toEqual(emptyStats());
    });

    it("should send only non-empty query params", async () => {
      const spy = mockResponse({ success: true, data: { cash_flows: [] } });

      await cashFlowApi.getCashFlows({
        type: "outflow",
        source: "savings",
        label: "makan",
        start_date: "2026-01-01",
        end_date: "2026-01-31",
      });

      const url = spy.mock.calls[0][0] as string;
      expect(url).toContain("type=outflow");
      expect(url).toContain("source=savings");
      expect(url).toContain("label=makan");
      expect(url).toContain("start_date=2026-01-01");
      expect(url).toContain("end_date=2026-01-31");
    });

    it("should skip empty, null, and undefined params", async () => {
      const spy = mockResponse({ success: true, data: { cash_flows: [] } });

      await cashFlowApi.getCashFlows({
        type: "",
        source: undefined,
        label: null as any,
        start_date: "",
      });

      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows\/$/);
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Tidak diizinkan" });
      await expect(cashFlowApi.getCashFlows()).rejects.toThrow("Tidak diizinkan");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(cashFlowApi.getCashFlows()).rejects.toThrow(
        "Gagal mengambil data arus kas"
      );
    });
  });

  describe("getCashFlowById", () => {
    it("should return cash flow detail", async () => {
      const spy = mockResponse({
        success: true,
        data: { cash_flow: { id: 5, label: "gaji" } },
      });

      expect(await cashFlowApi.getCashFlowById(5)).toEqual({ id: 5, label: "gaji" });
      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows\/5$/);
    });

    it("should return undefined when data is missing", async () => {
      mockResponse({ success: true });
      expect(await cashFlowApi.getCashFlowById(5)).toBeUndefined();
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Tidak ada" });
      await expect(cashFlowApi.getCashFlowById(5)).rejects.toThrow("Tidak ada");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(cashFlowApi.getCashFlowById(5)).rejects.toThrow(
        "Gagal mengambil detail arus kas"
      );
    });
  });

  describe("postCashFlow", () => {
    it("should create cash flow and return data", async () => {
      const spy = mockResponse({ success: true, data: { cash_flow_id: 9 } });

      expect(await cashFlowApi.postCashFlow(payload)).toEqual({ cash_flow_id: 9 });
      expect(spy.mock.calls[0][1]).toEqual({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Data tidak valid" });
      await expect(cashFlowApi.postCashFlow(payload)).rejects.toThrow("Data tidak valid");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(cashFlowApi.postCashFlow(payload)).rejects.toThrow(
        "Gagal menambahkan arus kas"
      );
    });
  });

  describe("putCashFlow", () => {
    it("should update cash flow and return message", async () => {
      const spy = mockResponse({ success: true, message: "Diubah" });

      expect(await cashFlowApi.putCashFlow(3, payload)).toBe("Diubah");
      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows\/3$/);
      expect(spy.mock.calls[0][1]).toMatchObject({ method: "PUT" });
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Gagal total" });
      await expect(cashFlowApi.putCashFlow(3, payload)).rejects.toThrow("Gagal total");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(cashFlowApi.putCashFlow(3, payload)).rejects.toThrow(
        "Gagal mengubah arus kas"
      );
    });
  });

  describe("deleteCashFlow", () => {
    it("should delete cash flow", async () => {
      const spy = mockResponse({ success: true, message: "Terhapus" });

      expect(await cashFlowApi.deleteCashFlow(4)).toBe("Terhapus");
      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows\/4$/);
      expect(spy.mock.calls[0][1]).toEqual({ method: "DELETE" });
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Ditolak" });
      await expect(cashFlowApi.deleteCashFlow(4)).rejects.toThrow("Ditolak");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(cashFlowApi.deleteCashFlow(4)).rejects.toThrow(
        "Gagal menghapus arus kas"
      );
    });
  });

  describe("getLabels", () => {
    it("should return labels", async () => {
      const spy = mockResponse({ success: true, data: { labels: ["gaji", "makan"] } });

      expect(await cashFlowApi.getLabels()).toEqual(["gaji", "makan"]);
      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows\/labels$/);
    });

    it("should return empty array when data is missing", async () => {
      mockResponse({ success: true });
      expect(await cashFlowApi.getLabels()).toEqual([]);
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Err" });
      await expect(cashFlowApi.getLabels()).rejects.toThrow("Err");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(cashFlowApi.getLabels()).rejects.toThrow(
        "Gagal mengambil label arus kas"
      );
    });
  });

  describe("getDailyStats", () => {
    it("should return daily stats", async () => {
      const spy = mockResponse({ success: true, data: { stats: [{ date: "2026-01-01" }] } });

      expect(await cashFlowApi.getDailyStats()).toEqual([{ date: "2026-01-01" }]);
      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows\/stats\/daily$/);
    });

    it("should return empty array when data is missing", async () => {
      mockResponse({ success: true });
      expect(await cashFlowApi.getDailyStats()).toEqual([]);
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Err" });
      await expect(cashFlowApi.getDailyStats()).rejects.toThrow("Err");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(cashFlowApi.getDailyStats()).rejects.toThrow(
        "Gagal mengambil statistik harian"
      );
    });
  });

  describe("getMonthlyStats", () => {
    it("should return monthly stats", async () => {
      const spy = mockResponse({ success: true, data: { stats: [{ month: "2026-01" }] } });

      expect(await cashFlowApi.getMonthlyStats()).toEqual([{ month: "2026-01" }]);
      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows\/stats\/monthly$/);
    });

    it("should return empty array when data is missing", async () => {
      mockResponse({ success: true });
      expect(await cashFlowApi.getMonthlyStats()).toEqual([]);
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Err" });
      await expect(cashFlowApi.getMonthlyStats()).rejects.toThrow("Err");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(cashFlowApi.getMonthlyStats()).rejects.toThrow(
        "Gagal mengambil statistik bulanan"
      );
    });
  });

  describe("deleteAllCashFlows", () => {
    it("should delete all cash flows", async () => {
      const spy = mockResponse({ success: true, message: "Semua terhapus" });

      expect(await cashFlowApi.deleteAllCashFlows()).toBe("Semua terhapus");
      expect(spy.mock.calls[0][0]).toMatch(/\/cash-flows\/$/);
      expect(spy.mock.calls[0][1]).toEqual({ method: "DELETE" });
    });

    it("should throw API message on failure", async () => {
      mockResponse({ success: false, message: "Ditolak" });
      await expect(cashFlowApi.deleteAllCashFlows()).rejects.toThrow("Ditolak");
    });

    it("should throw fallback message on failure", async () => {
      mockResponse({ success: false });
      await expect(cashFlowApi.deleteAllCashFlows()).rejects.toThrow(
        "Gagal menghapus seluruh arus kas"
      );
    });
  });
});
