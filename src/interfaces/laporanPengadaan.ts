export type Status =
  | "DIAJUKAN"
  | "DISETUJUI_KEPSEK"
  | "DISETUJUI_YAYASAN"
  | "DITOLAK"
  | "DIBELI";

export interface LaporanPengadaanItemDTO {
  waktu_pengajuan: string;
  nama_pengaju: string;
  nama_aset: string;
  merk: string;
  qty: number;
  tanggal_pengadaan: string;
  estimasi_harga: number;
  harga_aktual: number | null;
  kategori_aset: string;
  unit?: string;
  status_pengajuan: Status;
  bukti_pembelian?: string | null;
  alasan?: string | null;
}

export interface LaporanPengadaanPageDTO {
  content: LaporanPengadaanItemDTO[];
  total_elements: number;
  total_pages: number;
  current_page: number;
  page_size: number;
}

export type DateField = 'waktu_pengajuan' | 'tanggal_pengadaan';

export interface LaporanFilterParams {
  search?: string | null;
  status?: string | null;
  kategori?: string | null;
  unit?: string | null;
  bulan?: number | null;
  tahun?: number | null;
  from?: string | null;
  to?: string | null;
  dateField?: DateField | null;
  sortBy?: string;
  direction?: string;
  page?: number;
  size?: number;
}

export interface BaseResponseDTO<T> {
  data?: T;
  message?: string;
  statusCode?: number;
  success?: boolean;
  error?: any;
}
