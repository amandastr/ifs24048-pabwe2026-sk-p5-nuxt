import apiHelper from "../../../helpers/apiHelper";
import { toNumber } from "../../../helpers/toolsHelper";

export type CashFlowType = "inflow" | "outflow";
export type CashFlowSource = "cash" | "savings" | "loans";

export interface CashFlow {
  id: number;
  user_id?: number;
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  nominal: number;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CashFlowStats {
  total_inflow: number;
  total_outflow: number;
  balance: number;
  cash: number;
  savings: number;
  loans: number;
}

export interface CashFlowQueryParams {
  type?: CashFlowType | "";
  source?: CashFlowSource | "";
  label?: string;
  start_date?: string;
  end_date?: string;
}

export interface CashFlowPayload {
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  nominal: number;
  description: string;
}

export interface CashFlowStatItem {
  [key: string]: any;
}

export interface CashFlowsResult {
  cashFlows: CashFlow[];
  stats: CashFlowStats;
}

export function emptyStats(): CashFlowStats {
  return {
    total_inflow: 0,
    total_outflow: 0,
    balance: 0,
    cash: 0,
    savings: 0,
    loans: 0,
  };
}

export function calculateStats(cashFlows: CashFlow[]): CashFlowStats {
  const stats = emptyStats();
  cashFlows.forEach((cashFlow) => {
    const nominal = toNumber(cashFlow.nominal);
    const signed = cashFlow.type === "inflow" ? nominal : -nominal;
    if (cashFlow.type === "inflow") {
      stats.total_inflow += nominal;
    } else {
      stats.total_outflow += nominal;
    }
    if (cashFlow.source in stats) {
      stats[cashFlow.source] += signed;
    }
  });
  stats.balance = stats.total_inflow - stats.total_outflow;
  return stats;
}

function pick(value: unknown, fallback: number): number {
  return value === undefined || value === null ? fallback : toNumber(value);
}

export function normalizeStats(
  raw: Record<string, any>,
  fallback: CashFlowStats
): CashFlowStats {
  const totalInflow = pick(raw.total_inflow, fallback.total_inflow);
  const totalOutflow = pick(raw.total_outflow, fallback.total_outflow);
  return {
    total_inflow: totalInflow,
    total_outflow: totalOutflow,
    balance: totalInflow - totalOutflow,
    cash: pick(raw.cash, fallback.cash),
    savings: pick(raw.savings, fallback.savings),
    loans: pick(raw.loans, fallback.loans),
  };
}

const cashFlowApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/cash-flows`;

  function _url(path: string): string {
    return BASE_URL + path;
  }

  async function _request(
    path: string,
    options: RequestInit,
    fallbackMessage: string
  ): Promise<any> {
    const response = await apiHelper.fetchData(_url(path), options);
    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || fallbackMessage);
    }
    return result;
  }

  function _jsonOptions(method: string, payload: unknown): RequestInit {
    return {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };
  }

  function _query(params: CashFlowQueryParams): string {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        search.append(key, String(value));
      }
    });
    const query = search.toString();
    return query ? `?${query}` : "";
  }

  async function getCashFlows(
    params: CashFlowQueryParams = {}
  ): Promise<CashFlowsResult> {
    const result = await _request(
      `/${_query(params)}`,
      { method: "GET" },
      "Gagal mengambil data arus kas"
    );
    const cashFlows: CashFlow[] = result.data?.cash_flows || [];
    const calculated = calculateStats(cashFlows);
    const stats = result.data?.stats
      ? normalizeStats(result.data.stats, calculated)
      : calculated;
    return { cashFlows, stats };
  }

  async function getCashFlowById(
    cashFlowId: number | string
  ): Promise<CashFlow | undefined> {
    const result = await _request(
      `/${cashFlowId}`,
      { method: "GET" },
      "Gagal mengambil detail arus kas"
    );
    return result.data?.cash_flow;
  }

  async function postCashFlow(payload: CashFlowPayload): Promise<any> {
    const result = await _request(
      "/",
      _jsonOptions("POST", payload),
      "Gagal menambahkan arus kas"
    );
    return result.data;
  }

  async function putCashFlow(
    cashFlowId: number | string,
    payload: CashFlowPayload
  ): Promise<string> {
    const result = await _request(
      `/${cashFlowId}`,
      _jsonOptions("PUT", payload),
      "Gagal mengubah arus kas"
    );
    return result.message;
  }

  async function deleteCashFlow(cashFlowId: number | string): Promise<string> {
    const result = await _request(
      `/${cashFlowId}`,
      { method: "DELETE" },
      "Gagal menghapus arus kas"
    );
    return result.message;
  }

  async function getLabels(): Promise<string[]> {
    const result = await _request(
      "/labels",
      { method: "GET" },
      "Gagal mengambil label arus kas"
    );
    return result.data?.labels || [];
  }

  async function getDailyStats(): Promise<CashFlowStatItem[]> {
    const result = await _request(
      "/stats/daily",
      { method: "GET" },
      "Gagal mengambil statistik harian"
    );
    return result.data?.stats || [];
  }

  async function getMonthlyStats(): Promise<CashFlowStatItem[]> {
    const result = await _request(
      "/stats/monthly",
      { method: "GET" },
      "Gagal mengambil statistik bulanan"
    );
    return result.data?.stats || [];
  }

  async function deleteAllCashFlows(): Promise<string> {
    const result = await _request(
      "/",
      { method: "DELETE" },
      "Gagal menghapus seluruh arus kas"
    );
    return result.message;
  }

  return {
    getCashFlows,
    getCashFlowById,
    postCashFlow,
    putCashFlow,
    deleteCashFlow,
    getLabels,
    getDailyStats,
    getMonthlyStats,
    deleteAllCashFlows,
  };
})();

export default cashFlowApi;
