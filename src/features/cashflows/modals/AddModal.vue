<template>
  <div
    v-if="show"
    data-testid="add-cash-flow-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
  >
    <div
      class="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
      @click.stop
    >
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Plus :size="18" :stroke-width="2.5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-800">Catat Arus Kas Baru</h3>
            <p class="text-xs text-slate-500">Tambahkan transaksi pemasukan atau pengeluaran</p>
          </div>
        </div>
        <button
          type="button"
          data-testid="close-add-modal-btn"
          @click="onClose"
          class="p-2 rounded-xl text-slate-600 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSave" class="p-6 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">
              Jenis Arus Kas <span class="text-red-500">*</span>
            </label>
            <select aria-label="Jenis arus kas"
              data-testid="add-cash-flow-type-select"
              v-model="type"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
            >
              <option value="inflow">Inflow (Pemasukan)</option>
              <option value="outflow">Outflow (Pengeluaran)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">
              Sumber Dana <span class="text-red-500">*</span>
            </label>
            <select aria-label="Sumber dana"
              data-testid="add-cash-flow-source-select"
              v-model="source"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
            >
              <option value="cash">Tunai</option>
              <option value="savings">Tabungan</option>
              <option value="loans">Pinjaman</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">
              Label Kategori <span class="text-red-500">*</span>
            </label>
            <input aria-label="Label kategori"
              type="text"
              data-testid="add-cash-flow-label-input"
              v-model="label"
              list="add-cash-flow-label-options"
              placeholder="Contoh: gaji, makan, transport"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
              required
            />
            <datalist id="add-cash-flow-label-options">
              <option v-for="item in cashFlowsStore.labels" :key="item" :value="item" />
            </datalist>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5">
              Nominal (Rp) <span class="text-red-500">*</span>
            </label>
            <input aria-label="Nominal dalam rupiah"
              type="number"
              min="0"
              data-testid="add-cash-flow-nominal-input"
              v-model="nominal"
              placeholder="100000"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
              required
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">
            Keterangan <span class="text-red-500">*</span>
          </label>
          <textarea aria-label="Keterangan transaksi"
            data-testid="add-cash-flow-description-input"
            v-model="description"
            rows="4"
            placeholder="Tuliskan keterangan transaksi..."
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-add-modal-btn"
            @click="onClose"
            :disabled="loading"
            class="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-add-modal-btn"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-600/25 rounded-xl shadow-md transition-all disabled:opacity-60"
          >
            <template v-if="loading">
              <Loader2 :size="18" class="animate-spin" />
              <span>Menyimpan...</span>
            </template>
            <template v-else>
              <Plus :size="18" :stroke-width="2.5" />
              <span>Simpan Catatan</span>
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Plus, X, Loader2 } from "lucide-vue-next";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import { showErrorDialog, toNumber } from "../../../helpers/toolsHelper";
import type { CashFlowType, CashFlowSource } from "../api/cashFlowApi";

interface AddModalProps {
  show?: boolean;
}

const props = withDefaults(defineProps<AddModalProps>(), {
  show: false,
});

const emit = defineEmits<{
  (e: "close"): void;
}>();

const cashFlowsStore = useCashFlowsStore();

const loading = ref(false);
const type = ref<CashFlowType>("inflow");
const source = ref<CashFlowSource>("cash");
const label = ref("");
const nominal = ref("");
const description = ref("");

function onClose() {
  emit("close");
}

function resetForm() {
  type.value = "inflow";
  source.value = "cash";
  label.value = "";
  nominal.value = "";
  description.value = "";
}

watch(
  () => props.show,
  (newShow) => {
    if (newShow) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }
);

watch(
  () => [cashFlowsStore.isCashFlowAdd, cashFlowsStore.isCashFlowAdded],
  ([isCashFlowAdd, isCashFlowAdded]) => {
    if (isCashFlowAdd) {
      loading.value = false;
      cashFlowsStore.setIsCashFlowAdd(false);
      if (isCashFlowAdded) {
        cashFlowsStore.setIsCashFlowAdded(false);
        cashFlowsStore.asyncSetCashFlows();
        cashFlowsStore.asyncSetLabels();
        resetForm();
        onClose();
      }
    }
  }
);

function handleSave() {
  if (!label.value.trim()) {
    showErrorDialog("Label tidak boleh kosong");
    return;
  }

  if (!(toNumber(nominal.value) > 0)) {
    showErrorDialog("Nominal harus lebih dari 0");
    return;
  }

  if (!description.value.trim()) {
    showErrorDialog("Keterangan tidak boleh kosong");
    return;
  }

  loading.value = true;
  cashFlowsStore.asyncSetIsCashFlowAdd(
    type.value,
    source.value,
    label.value.trim(),
    toNumber(nominal.value),
    description.value.trim()
  );
}
</script>
