export interface PeminjamanAsetResponseDTO {
  id_peminjaman: string;
  waktu_pengajuan: string;
  waktu_peminjaman: string;
  waktu_pengembalian: string;
  qty: number;
  tujuan_peminjaman: string;
  status_peminjaman: string;
  id_peminjam: string;
  nama_peminjam: string;
  unit_peminjam: string;
  role_peminjam: string;
  id_aset: string;
  kode_aset: string;
  aset: string;
  merk_aset: string | null;
  kategori_aset: string;
  unit_tujuan: string;
}

export interface PeminjamanPage {
  content: PeminjamanAsetResponseDTO[];
  totalPages: number;
  totalElements: number;
  number: number;
}
