<template>
  <div v-if="profile" class="space-y-8 animate-in fade-in duration-300">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Ringkasan Arus Kas
        </h1>
        <p class="text-sm text-slate-600 mt-1">
          Pantau pemasukan, pengeluaran, dan saldo keuangan Anda secara real-time.
        </p>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          data-testid="reset-cash-flows-btn"
          @click="handleResetAll"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-all"
        >
          <RotateCcw :size="18" />
          <span>Reset Semua</span>
        </button>
        <button
          type="button"
          data-testid="add-cash-flow-btn"
          @click="showAddModal = true"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all"
        >
          <Plus :size="18" :stroke-width="2.5" />
          <span>Tambah Transaksi</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="card in summaryCards"
        :key="card.testId"
        class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between"
      >
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {{ card.title }}
          </p>
          <h3
            :data-testid="card.testId"
            class="text-2xl font-black mt-1"
            :class="card.valueClass"
          >
            {{ formatRupiah(card.value) }}
          </h3>
        </div>
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center" :class="card.iconClass">
          <component :is="card.icon" :size="26" :stroke-width="2" />
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
          <Filter :size="16" /> Filter Transaksi
        </h2>
        <button
          type="button"
          data-testid="reset-filter-btn"
          @click="resetFilters"
          class="text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
        >
          Atur Ulang Filter
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label for="filter-type" class="block text-xs font-semibold text-slate-600 mb-1">Jenis</label>
          <select
            id="filter-type"
            data-testid="filter-type-select"
            v-model="filterType"
            class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="">Semua</option>
            <option value="inflow">Inflow (Pemasukan)</option>
            <option value="outflow">Outflow (Pengeluaran)</option>
          </select>
        </div>

        <div>
          <label for="filter-source" class="block text-xs font-semibold text-slate-600 mb-1">Sumber Dana</label>
          <select
            id="filter-source"
            data-testid="filter-source-select"
            v-model="filterSource"
            class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="">Semua</option>
            <option value="cash">Tunai</option>
            <option value="savings">Tabungan</option>
            <option value="loans">Pinjaman</option>
          </select>
        </div>

        <div>
          <label for="filter-label" class="block text-xs font-semibold text-slate-600 mb-1">Label</label>
          <select
            id="filter-label"
            data-testid="filter-label-select"
            v-model="filterLabel"
            class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          >
            <option value="">Semua</option>
            <option v-for="item in cashFlowsStore.labels" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>

        <div>
          <label for="filter-start" class="block text-xs font-semibold text-slate-600 mb-1">Tanggal Awal</label>
          <input
            id="filter-start"
            type="date"
            data-testid="filter-start-date-input"
            v-model="filterStartDate"
            class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div>
          <label for="filter-end" class="block text-xs font-semibold text-slate-600 mb-1">Tanggal Akhir</label>
          <input
            id="filter-end"
            type="date"
            data-testid="filter-end-date-input"
            v-model="filterEndDate"
            class="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
      </div>
    </div>

    <!-- Transactions -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-700">
          <caption class="sr-only">Daftar transaksi arus kas</caption>
          <thead class="bg-slate-50/80 text-xs uppercase tracking-wider font-semibold text-slate-600 border-b border-slate-100">
            <tr>
              <th scope="col" class="px-5 py-3.5 text-center w-16">ID</th>
              <th scope="col" class="px-5 py-3.5">Label</th>
              <th scope="col" class="px-5 py-3.5 hidden md:table-cell">Sumber</th>
              <th scope="col" class="px-5 py-3.5">Jenis</th>
              <th scope="col" class="px-5 py-3.5 text-right">Nominal</th>
              <th scope="col" class="px-5 py-3.5 hidden lg:table-cell">Dibuat</th>
              <th scope="col" class="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="loadingCashFlows && cashFlows.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-600" data-testid="cash-flows-loading">
                <Loader2 :size="36" class="mx-auto text-indigo-600 animate-spin mb-2" />
                <p class="font-medium">Memuat catatan arus kas...</p>
              </td>
            </tr>
            <tr v-else-if="cashFlows.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-600" data-testid="cash-flows-empty">
                <Wallet :size="40" class="mx-auto text-slate-400 mb-2" />
                <p class="font-medium">Belum ada transaksi yang cocok.</p>
              </td>
            </tr>
            <tr
              v-else
              v-for="cashFlow in cashFlows"
              :key="`cash-flow-${cashFlow.id}`"
              :data-testid="`cash-flow-row-${cashFlow.id}`"
              class="hover:bg-slate-50/70 transition-colors"
            >
              <td class="px-5 py-4 text-center font-mono text-xs font-bold text-slate-600">
                #{{ cashFlow.id }}
              </td>
              <td class="px-5 py-4">
                <p class="font-semibold text-slate-800 leading-snug">{{ cashFlow.label }}</p>
                <p v-if="cashFlow.description" class="text-xs text-slate-600 line-clamp-1 mt-0.5">
                  {{ cashFlow.description }}
                </p>
              </td>
              <td class="px-5 py-4 hidden md:table-cell text-xs text-slate-600">
                {{ formatSource(cashFlow.source) }}
              </td>
              <td class="px-5 py-4">
                <span
                  v-if="cashFlow.type === 'inflow'"
                  :data-testid="`cash-flow-type-${cashFlow.id}`"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                >
                  <ArrowDownLeft :size="14" /> Pemasukan
                </span>
                <span
                  v-else
                  :data-testid="`cash-flow-type-${cashFlow.id}`"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200/60"
                >
                  <ArrowUpRight :size="14" /> Pengeluaran
                </span>
              </td>
              <td
                class="px-5 py-4 text-right font-bold"
                :class="cashFlow.type === 'inflow' ? 'text-emerald-700' : 'text-red-700'"
              >
                {{ formatRupiah(cashFlow.nominal) }}
              </td>
              <td class="px-5 py-4 hidden lg:table-cell text-xs text-slate-600">
                {{ formatDate(cashFlow.created_at) }}
              </td>
              <td class="px-5 py-4 text-right">
                <div class="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    :data-testid="`view-cash-flow-${cashFlow.id}`"
                    @click="router.push(`/cash-flows/${cashFlow.id}`)"
                    class="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    aria-label="Lihat detail transaksi"
                    title="Lihat Detail"
                  >
                    <Eye :size="18" />
                  </button>
                  <button
                    type="button"
                    :data-testid="`edit-cash-flow-${cashFlow.id}`"
                    @click="handleEdit(cashFlow.id)"
                    class="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                    aria-label="Ubah transaksi"
                    title="Ubah Transaksi"
                  >
                    <Pencil :size="18" />
                  </button>
                  <button
                    type="button"
                    :data-testid="`delete-cash-flow-${cashFlow.id}`"
                    @click="handleDelete(cashFlow.id)"
                    class="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Hapus transaksi"
                    title="Hapus Transaksi"
                  >
                    <Trash2 :size="18" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <AddModal :show="showAddModal" @close="showAddModal = false" />
    <ChangeModal
      :show="showChangeModal"
      :cash-flow-id="selectedCashFlowId"
      @close="showChangeModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import AddModal from "../modals/AddModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { useUsersStore } from "../../users/states/usersStore";
import {
  formatDate,
  formatRupiah,
  formatSource,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";
import type { CashFlowQueryParams } from "../api/cashFlowApi";
import {
  Plus,
  Wallet,
  PiggyBank,
  Landmark,
  TrendingUp,
  TrendingDown,
  Banknote,
  Eye,
  Pencil,
  Trash2,
  Filter,
  Loader2,
  RotateCcw,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-vue-next";

const router = useRouter();
const cashFlowsStore = useCashFlowsStore();
const usersStore = useUsersStore();

const profile = computed(() => usersStore.profile);
const cashFlows = computed(() => cashFlowsStore.cashFlows || []);
const stats = computed(() => cashFlowsStore.stats);
const isCashFlowDeleted = computed(() => cashFlowsStore.isCashFlowDeleted);
const isCashFlowDeletedAll = computed(() => cashFlowsStore.isCashFlowDeletedAll);

const loadingCashFlows = ref(false);
const filterType = ref("");
const filterSource = ref("");
const filterLabel = ref("");
const filterStartDate = ref("");
const filterEndDate = ref("");
const showAddModal = ref(false);
const showChangeModal = ref(false);
const selectedCashFlowId = ref<number | null>(null);

let isMounted = true;

const summaryCards = computed(() => [
  {
    testId: "stat-balance",
    title: "Total Saldo Kas Bersih",
    value: stats.value.balance,
    valueClass: "text-indigo-700",
    iconClass: "bg-indigo-50 text-indigo-700",
    icon: Wallet,
  },
  {
    testId: "stat-inflow",
    title: "Total Pemasukan (Inflow)",
    value: stats.value.total_inflow,
    valueClass: "text-emerald-700",
    iconClass: "bg-emerald-50 text-emerald-700",
    icon: TrendingUp,
  },
  {
    testId: "stat-outflow",
    title: "Total Pengeluaran (Outflow)",
    value: stats.value.total_outflow,
    valueClass: "text-red-700",
    iconClass: "bg-red-50 text-red-700",
    icon: TrendingDown,
  },
  {
    testId: "stat-cash",
    title: "Saldo Kas Tunai",
    value: stats.value.cash,
    valueClass: "text-slate-800",
    iconClass: "bg-slate-100 text-slate-700",
    icon: Banknote,
  },
  {
    testId: "stat-savings",
    title: "Saldo Rekening Tabungan",
    value: stats.value.savings,
    valueClass: "text-slate-800",
    iconClass: "bg-sky-50 text-sky-700",
    icon: PiggyBank,
  },
  {
    testId: "stat-loans",
    title: "Saldo Pinjaman",
    value: stats.value.loans,
    valueClass: "text-slate-800",
    iconClass: "bg-amber-50 text-amber-700",
    icon: Landmark,
  },
]);

function buildParams(): CashFlowQueryParams {
  return {
    type: filterType.value as CashFlowQueryParams["type"],
    source: filterSource.value as CashFlowQueryParams["source"],
    label: filterLabel.value,
    start_date: filterStartDate.value,
    end_date: filterEndDate.value,
  };
}

function loadCashFlows() {
  loadingCashFlows.value = true;
  Promise.resolve(cashFlowsStore.asyncSetCashFlows(buildParams())).finally(() => {
    if (isMounted) loadingCashFlows.value = false;
  });
}

onMounted(() => {
  isMounted = true;
  loadCashFlows();
  cashFlowsStore.asyncSetLabels();
});

onBeforeUnmount(() => {
  isMounted = false;
});

watch(
  [filterType, filterSource, filterLabel, filterStartDate, filterEndDate],
  () => {
    loadCashFlows();
  }
);

watch(isCashFlowDeleted, (deleted) => {
  if (deleted) {
    cashFlowsStore.setIsCashFlowDeleted(false);
    loadCashFlows();
    cashFlowsStore.asyncSetLabels();
  }
});

watch(isCashFlowDeletedAll, (deleted) => {
  if (deleted) {
    cashFlowsStore.setIsCashFlowDeletedAll(false);
    loadCashFlows();
    cashFlowsStore.asyncSetLabels();
  }
});

function resetFilters() {
  filterType.value = "";
  filterSource.value = "";
  filterLabel.value = "";
  filterStartDate.value = "";
  filterEndDate.value = "";
}

function handleEdit(cashFlowId: number) {
  selectedCashFlowId.value = cashFlowId;
  showChangeModal.value = true;
}

async function handleDelete(cashFlowId: number) {
  const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus transaksi ini?");
  if (result.isConfirmed) {
    cashFlowsStore.asyncSetIsCashFlowDelete(cashFlowId);
  }
}

async function handleResetAll() {
  const result = await showConfirmDialog(
    "Apakah Anda yakin ingin mereset SELURUH catatan arus kas? Tindakan ini tidak dapat dibatalkan."
  );
  if (result.isConfirmed) {
    cashFlowsStore.asyncSetIsCashFlowDeleteAll();
  }
}
</script>
