<template>
  <div v-if="!profile || !cashFlow" class="flex flex-col items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>

  <div v-else class="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <RouterLink
        to="/"
        data-testid="back-to-cash-flows-link"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700 transition-colors"
      >
        <ArrowLeft :size="18" />
        Kembali ke Ringkasan
      </RouterLink>

      <div class="flex items-center gap-2">
        <button
          type="button"
          data-testid="edit-detail-cash-flow-btn"
          @click="showEditModal = true"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
        >
          <Edit3 :size="16" />
          Ubah
        </button>
        <button
          type="button"
          data-testid="delete-detail-cash-flow-btn"
          @click="handleDelete"
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
        >
          <Trash2 :size="16" />
          Hapus
        </button>
      </div>
    </div>

    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="p-6 sm:p-8 space-y-6">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-slate-600">#{{ cashFlow.id }}</span>
            <span
              v-if="cashFlow.type === 'inflow'"
              data-testid="detail-type"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
            >
              <ArrowDownLeft :size="14" /> Pemasukan (Inflow)
            </span>
            <span
              v-else
              data-testid="detail-type"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200"
            >
              <ArrowUpRight :size="14" /> Pengeluaran (Outflow)
            </span>
          </div>

          <h1 data-testid="detail-label" class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {{ cashFlow.label }}
          </h1>

          <p
            data-testid="detail-nominal"
            class="text-3xl font-black"
            :class="cashFlow.type === 'inflow' ? 'text-emerald-700' : 'text-red-700'"
          >
            {{ formatRupiah(cashFlow.nominal) }}
          </p>
        </div>

        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Sumber Dana</dt>
            <dd data-testid="detail-source" class="mt-1 font-bold text-slate-800">
              {{ formatSource(cashFlow.source) }}
            </dd>
          </div>
          <div class="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Kategori / Label</dt>
            <dd class="mt-1 font-bold text-slate-800">{{ cashFlow.label }}</dd>
          </div>
          <div class="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Dibuat</dt>
            <dd data-testid="detail-created-at" class="mt-1 font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar :size="14" /> {{ formatDate(cashFlow.created_at) }}
            </dd>
          </div>
          <div class="rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <dt class="text-xs font-semibold uppercase tracking-wider text-slate-600">Diperbarui</dt>
            <dd data-testid="detail-updated-at" class="mt-1 font-semibold text-slate-800 flex items-center gap-1.5">
              <Calendar :size="14" /> {{ formatDate(cashFlow.updated_at) }}
            </dd>
          </div>
        </dl>

        <div class="rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
          <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Deskripsi Catatan</h2>
          <p v-if="cashFlow.description" data-testid="detail-description" class="text-slate-700 leading-relaxed whitespace-pre-line">
            {{ cashFlow.description }}
          </p>
          <p v-else data-testid="detail-description-empty" class="italic text-slate-600">
            Tidak ada deskripsi untuk transaksi ini.
          </p>
        </div>
      </div>
    </div>

    <ChangeModal
      :show="showEditModal"
      :cash-flow-id="cashFlow.id"
      @close="showEditModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import ChangeModal from "../modals/ChangeModal.vue";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { useUsersStore } from "../../users/states/usersStore";
import {
  formatDate,
  formatRupiah,
  formatSource,
  showConfirmDialog,
} from "../../../helpers/toolsHelper";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const cashFlowsStore = useCashFlowsStore();
const usersStore = useUsersStore();

const cashFlowId = computed(() => route.params.cashFlowId as string);
const profile = computed(() => usersStore.profile);
const cashFlow = computed(() => cashFlowsStore.cashFlow);
const isCashFlow = computed(() => cashFlowsStore.isCashFlow);
const isCashFlowDeleted = computed(() => cashFlowsStore.isCashFlowDeleted);

const showEditModal = ref(false);

onMounted(() => {
  cashFlowsStore.asyncSetCashFlow(cashFlowId.value);
});

watch(cashFlowId, (newId) => {
  cashFlowsStore.asyncSetCashFlow(newId);
});

watch(
  () => [isCashFlow.value, cashFlow.value],
  ([isLoaded, loaded]) => {
    if (isLoaded) {
      cashFlowsStore.setIsCashFlow(false);
      if (!loaded) {
        router.push("/");
      }
    }
  }
);

watch(isCashFlowDeleted, (isDel) => {
  if (isDel) {
    cashFlowsStore.setIsCashFlowDeleted(false);
    router.push("/");
  }
});

async function handleDelete() {
  const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus transaksi ini?");
  if (result.isConfirmed) {
    cashFlowsStore.asyncSetIsCashFlowDelete(cashFlow.value!.id);
  }
}
</script>
