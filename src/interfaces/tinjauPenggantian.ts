export type Status =
  | "DIAJUKAN"
  | "DISETUJUI"
  | "DITOLAK";

export interface TinjauPenggantianRequestDTO {
  statusPenggantian: Status;
  alasan: string;
}

export interface TinjauPenggantianResponseDTO {
  id: string;
  idPenggantian: string;

  namaAset: string;
  linkGambar: string;
  kategori: string;
  merk: string;
  qty: number;
  estimasiHarga: number;
  waktuPenggantian: string;
  namaPengaju: string;
  unitPengaju: string;
  rolePengaju: string;

  statusPenggantian?: Status;
  alasan?: string;

  createdAt?: string | null;
  updatedAt?: string | null;
  reviewerRole?: string | null;
  namaReviewer?: string | null;

  userId?: string | number | null;
  unit?: string | null;
}

export interface BaseResponseDTO<T> {
  data?: T;
  message?: string;
  statusCode?: number;
  success?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}
