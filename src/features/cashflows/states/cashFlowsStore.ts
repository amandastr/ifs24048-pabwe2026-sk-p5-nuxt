import { defineStore } from "pinia";
import cashFlowApi, {
  emptyStats,
  type CashFlow,
  type CashFlowQueryParams,
  type CashFlowStatItem,
  type CashFlowStats,
  type CashFlowType,
  type CashFlowSource,
} from "../api/cashFlowApi";
import {
  getErrorMessage,
  showErrorDialog,
  showSuccessDialog,
} from "../../../helpers/toolsHelper";

export interface CashFlowsState {
  cashFlows: CashFlow[];
  cashFlow: CashFlow | null;
  stats: CashFlowStats;
  labels: string[];
  dailyStats: CashFlowStatItem[];
  monthlyStats: CashFlowStatItem[];
  lastError: string;
  isCashFlow: boolean;
  isCashFlowAdd: boolean;
  isCashFlowAdded: boolean;
  isCashFlowChange: boolean;
  isCashFlowChanged: boolean;
  isCashFlowDelete: boolean;
  isCashFlowDeleted: boolean;
  isCashFlowDeleteAll: boolean;
  isCashFlowDeletedAll: boolean;
}

export const useCashFlowsStore = defineStore("cashFlows", {
  state: (): CashFlowsState => ({
    cashFlows: [],
    cashFlow: null,
    stats: emptyStats(),
    labels: [],
    dailyStats: [],
    monthlyStats: [],
    lastError: "",
    isCashFlow: false,
    isCashFlowAdd: false,
    isCashFlowAdded: false,
    isCashFlowChange: false,
    isCashFlowChanged: false,
    isCashFlowDelete: false,
    isCashFlowDeleted: false,
    isCashFlowDeleteAll: false,
    isCashFlowDeletedAll: false,
  }),
  actions: {
    setLastError(message: string) {
      this.lastError = message;
    },
    setCashFlows(cashFlows: CashFlow[]) {
      this.cashFlows = cashFlows;
    },
    setCashFlow(cashFlow: CashFlow | null) {
      this.cashFlow = cashFlow;
    },
    setStats(stats: CashFlowStats) {
      this.stats = stats;
    },
    setLabels(labels: string[]) {
      this.labels = labels;
    },
    setDailyStats(dailyStats: CashFlowStatItem[]) {
      this.dailyStats = dailyStats;
    },
    setMonthlyStats(monthlyStats: CashFlowStatItem[]) {
      this.monthlyStats = monthlyStats;
    },
    setIsCashFlow(status: boolean) {
      this.isCashFlow = status;
    },
    setIsCashFlowAdd(status: boolean) {
      this.isCashFlowAdd = status;
    },
    setIsCashFlowAdded(status: boolean) {
      this.isCashFlowAdded = status;
    },
    setIsCashFlowChange(status: boolean) {
      this.isCashFlowChange = status;
    },
    setIsCashFlowChanged(status: boolean) {
      this.isCashFlowChanged = status;
    },
    setIsCashFlowDelete(status: boolean) {
      this.isCashFlowDelete = status;
    },
    setIsCashFlowDeleted(status: boolean) {
      this.isCashFlowDeleted = status;
    },
    setIsCashFlowDeleteAll(status: boolean) {
      this.isCashFlowDeleteAll = status;
    },
    setIsCashFlowDeletedAll(status: boolean) {
      this.isCashFlowDeletedAll = status;
    },
    async asyncSetCashFlows(params: CashFlowQueryParams = {}) {
      try {
        const { cashFlows, stats } = await cashFlowApi.getCashFlows(params);
        this.setCashFlows(cashFlows);
        this.setStats(stats);
      } catch (error) {
        this.setLastError(getErrorMessage(error));
        this.setCashFlows([]);
        this.setStats(emptyStats());
      }
    },
    async asyncSetCashFlow(cashFlowId: number | string) {
      try {
        const cashFlow = await cashFlowApi.getCashFlowById(cashFlowId);
        this.setCashFlow(cashFlow || null);
      } catch (error) {
        this.setLastError(getErrorMessage(error));
        this.setCashFlow(null);
      } finally {
        this.setIsCashFlow(true);
      }
    },
    async asyncSetLabels() {
      try {
        this.setLabels(await cashFlowApi.getLabels());
      } catch (error) {
        this.setLastError(getErrorMessage(error));
        this.setLabels([]);
      }
    },
    async asyncSetDailyStats() {
      try {
        this.setDailyStats(await cashFlowApi.getDailyStats());
      } catch (error) {
        this.setLastError(getErrorMessage(error));
        this.setDailyStats([]);
      }
    },
    async asyncSetMonthlyStats() {
      try {
        this.setMonthlyStats(await cashFlowApi.getMonthlyStats());
      } catch (error) {
        this.setLastError(getErrorMessage(error));
        this.setMonthlyStats([]);
      }
    },
    async asyncSetIsCashFlowAdd(
      type: CashFlowType,
      source: CashFlowSource,
      label: string,
      nominal: number,
      description: string
    ) {
      try {
        await cashFlowApi.postCashFlow({ type, source, label, nominal, description });
        showSuccessDialog("Catatan arus kas berhasil ditambahkan!");
        this.setIsCashFlowAdded(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowAdded(false);
      } finally {
        this.setIsCashFlowAdd(true);
      }
    },
    async asyncSetIsCashFlowChange(
      cashFlowId: number | string,
      type: CashFlowType,
      source: CashFlowSource,
      label: string,
      nominal: number,
      description: string
    ) {
      try {
        const message = await cashFlowApi.putCashFlow(cashFlowId, {
          type,
          source,
          label,
          nominal,
          description,
        });
        showSuccessDialog(message || "Catatan arus kas berhasil diperbarui!");
        this.setIsCashFlowChanged(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowChanged(false);
      } finally {
        this.setIsCashFlowChange(true);
      }
    },
    async asyncSetIsCashFlowDelete(cashFlowId: number | string) {
      try {
        const message = await cashFlowApi.deleteCashFlow(cashFlowId);
        showSuccessDialog(message || "Catatan arus kas berhasil dihapus!");
        this.setIsCashFlowDeleted(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowDeleted(false);
      } finally {
        this.setIsCashFlowDelete(true);
      }
    },
    async asyncSetIsCashFlowDeleteAll() {
      try {
        const message = await cashFlowApi.deleteAllCashFlows();
        showSuccessDialog(message || "Seluruh catatan arus kas berhasil direset!");
        this.setIsCashFlowDeletedAll(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsCashFlowDeletedAll(false);
      } finally {
        this.setIsCashFlowDeleteAll(true);
      }
    },
  },
});
