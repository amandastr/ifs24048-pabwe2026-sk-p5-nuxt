import type { SweetAlertResult } from "sweetalert2";

// SweetAlert2 dimuat lazy (hanya saat dialog pertama ditampilkan)
const loadSwal = async () => (await import("sweetalert2")).default;

export async function showErrorDialog(message: string): Promise<SweetAlertResult<any>> {
  const Swal = await loadSwal();
  return Swal.fire({
    title: "Terjadi Kesalahan",
    text: message,
    icon: "error",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#ef4444",
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.close();
    }
    return result;
  });
}

export async function showWarningDialog(message: string): Promise<SweetAlertResult<any>> {
  const Swal = await loadSwal();
  return Swal.fire({
    title: "Peringatan",
    text: message,
    icon: "warning",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#f59e0b",
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.close();
    }
    return result;
  });
}

export async function showSuccessDialog(message: string): Promise<SweetAlertResult<any>> {
  const Swal = await loadSwal();
  return Swal.fire({
    title: "Tindakan Berhasil",
    text: message,
    icon: "success",
    confirmButtonText: "Tutup",
    confirmButtonColor: "#10b981",
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.close();
    }
    return result;
  });
}

export async function showConfirmDialog(message: string): Promise<SweetAlertResult<any>> {
  const Swal = await loadSwal();
  return Swal.fire({
    title: "Konfirmasi",
    text: message,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya",
    cancelButtonText: "Tidak",
    confirmButtonColor: "#6366f1",
    cancelButtonColor: "#94a3b8",
  });
}

export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toNumber(value: unknown): number {
  return Number(value) || 0;
}

export function formatRupiah(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

const sourceLabels: Record<string, string> = {
  cash: "Tunai",
  savings: "Tabungan",
  loans: "Pinjaman",
};

export function formatSource(source: string | null | undefined): string {
  return sourceLabels[source as string] || source || "-";
}
