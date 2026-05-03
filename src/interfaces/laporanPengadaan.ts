export type Status =
  | "DIAJUKAN"
  | "DISETUJUI_KEPSEK"
  | "DISETUJUI_YAYASAN"
  | "DITOLAK"
  | "DIBELI";

export interface LaporanPengadaanDTO {
  waktuPengajuan: string;
  idPengadaan: string;
  namaAset: string;
  merk: string;
  qty: number;
  tanggalPengadaan: string;
  estimasiHarga: number;
  kategoriAset: string;
  unit?: string; // opsional (karena Kepsek & Sarpras ga lihat)
  statusPengadaan: Status;
  buktiPembelian?: string | null;
  alasan?: string | null;
}

export interface BaseResponseDTO<T> {
  data?: T;
  message?: string;
  statusCode?: number;
  success?: boolean;
  error?: any;
}
