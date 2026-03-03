export type Status =
  | "DIAJUKAN"
  | "DISETUJUI_KEPSEK"
  | "DISETUJUI_YAYASAN"
  | "DITOLAK"
  | "DIBELI";

export interface TinjauPengadaanRequestDTO {
  statusPengadaan: Status;
  alasan: string;
}

export interface PembelianRequestDTO {
  harga: number;
  buktiPembelian: File;
}

export interface TinjauPengadaanResponseDTO {
  id: number;
  idPengadaan: string;

  namaAset: string;
  linkGambar: string;
  kategori: string;
  merk: string;
  qty: number;
  estimasiHarga: number;
  waktuPengadaan: string;
  namaPengaju: string;

  statusPengadaan?: Status;
  alasan?: string;

  kepsekFirstReviewedAt?: string | null;
  yayasanFirstReviewedAt?: string | null;
  updatedAt?: string | null;
  reviewerRole?: string | null;
  namaReviewer?: string | null;

  userId?: string | number | null;
  harga?: number | null;
  buktiPembelian?: string | null;
}

export interface BaseResponseDTO<T> {
  data?: T;
  message?: string;
  statusCode?: number;
  success?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}
