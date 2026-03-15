export interface PenggantianBarangRusakResponseDTO {
  idPenggantian: string
  namaBarang: string
  waktuPenggantian: string
  quantity: number
  merk: string
  contohBarang: string
  status: string
  keterangan: string

  namaPengaju: string
  unitPengaju: string
  rolePengaju: string
}

export interface PenggantianBarangRusakRequestDTO {
  namaBarang: string
  merk: string
  quantity: number
  waktuPenggantian: string
  contohBarang: File
  unitPengaju: string
  keterangan?: string
}

export interface UpdatePenggantianBarangRusakRequestDTO {
  namaBarang: string
  merk: string
  quantity: number
  waktuPenggantian: string
  contohBarang?: File
  unitPengaju: string
  keterangan?: string
}

export interface PenggantianBarangRusakFilter {
  search?: string
  status?: string
}

export interface BaseResponseDTO<T> {
  data?: T;
  message?: string;
  statusCode?: number;
  success?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: any;
}
