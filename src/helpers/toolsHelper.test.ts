import { describe, it, expect, vi } from "vitest";
import Swal from "sweetalert2";
import {
  showErrorDialog,
  showWarningDialog,
  showSuccessDialog,
  showConfirmDialog,
  formatDate,
  formatRupiah,
  formatSource,
  toNumber,
} from "./toolsHelper";

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
    close: vi.fn(),
  },
}));

describe("toolsHelper", () => {
  it("should call Swal.fire for showErrorDialog and handle confirmation", async () => {
    (Swal.fire as any).mockResolvedValue({ isConfirmed: true });
    await showErrorDialog("Error test");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Terjadi Kesalahan",
        text: "Error test",
        icon: "error",
      })
    );
    expect(Swal.close).toHaveBeenCalled();

    // Not confirmed branch
    (Swal.fire as any).mockResolvedValue({ isConfirmed: false });
    await showErrorDialog("Error test");
  });

  it("should call Swal.fire for showWarningDialog and handle confirmation", async () => {
    (Swal.fire as any).mockResolvedValue({ isConfirmed: true });
    await showWarningDialog("Warning test");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Peringatan",
        text: "Warning test",
        icon: "warning",
      })
    );
    expect(Swal.close).toHaveBeenCalled();

    // Not confirmed branch
    (Swal.fire as any).mockResolvedValue({ isConfirmed: false });
    await showWarningDialog("Warning test");
  });

  it("should call Swal.fire for showSuccessDialog and handle confirmation", async () => {
    (Swal.fire as any).mockResolvedValue({ isConfirmed: true });
    await showSuccessDialog("Success test");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Tindakan Berhasil",
        text: "Success test",
        icon: "success",
      })
    );
    expect(Swal.close).toHaveBeenCalled();

    // Not confirmed branch
    (Swal.fire as any).mockResolvedValue({ isConfirmed: false });
    await showSuccessDialog("Success test");
  });

  it("should call Swal.fire for showConfirmDialog", async () => {
    (Swal.fire as any).mockResolvedValue({ isConfirmed: true });
    const res = await showConfirmDialog("Confirm test?");
    expect(Swal.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Konfirmasi",
        text: "Confirm test?",
        icon: "question",
      })
    );
    expect(res.isConfirmed).toBe(true);
  });

  it("should format date correctly or return fallback for empty date", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    const formatted = formatDate("2024-02-26T02:34:26.000000Z");
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe("string");
  });
});

describe("toolsHelper - cash flow helpers", () => {
  it("toNumber should convert values and fallback to zero", () => {
    expect(toNumber("1500")).toBe(1500);
    expect(toNumber(25)).toBe(25);
    expect(toNumber("abc")).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber(null)).toBe(0);
  });

  it("formatRupiah should format number to Indonesian rupiah", () => {
    expect(formatRupiah(1500000)).toContain("Rp");
    expect(formatRupiah(1500000)).toContain("1.500.000");
    expect(formatRupiah("2500")).toContain("2.500");
    expect(formatRupiah("abc")).toContain("0");
    expect(formatRupiah(null)).toContain("0");
    expect(formatRupiah(undefined)).toContain("0");
  });

  it("formatSource should translate known sources and fallback otherwise", () => {
    expect(formatSource("cash")).toBe("Tunai");
    expect(formatSource("savings")).toBe("Tabungan");
    expect(formatSource("loans")).toBe("Pinjaman");
    expect(formatSource("crypto")).toBe("crypto");
    expect(formatSource("")).toBe("-");
    expect(formatSource(null)).toBe("-");
    expect(formatSource(undefined)).toBe("-");
  });
});
