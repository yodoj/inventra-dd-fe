# INVENTRA DD - Inventory and Resource Asset System Sekolah Islam Dian Didaktika

## Penjelasan Fitur Ridya Azizah Khayyira Mumtaz - 2306245895
### 1. Mengelola Aset (EPIC02):
**Tujuan Fitur:**
- Memungkinkan pengguna melihat daftar aset pada unit masing-masing untuk meningkatkan transparansi kondisi aset.

**Komponen:**
- Daftar Aset
  - Menampilkan tabel aset (Nama, Kategori, Unit, Status, Jumlah).
  - Data ditampilkan sesuai hak akses role.
  - Search berdasarkan nama aset.
  - Filter berdasarkan Kategori, Status, dan Unit (untuk Sarpras dan Yayasan).
- Tambah Aset untuk Sarpras dan Yayasan
  - Form modal dengan input lengkap (Nama, Kategori, Jumlah, Status, Unit*).
  - Validasi field wajib.
  - Notifikasi sukses/gagal setelah submit.
- Edit Aset untuk Sarpras dan Yayasan
  - Form pre-filled dengan data sebelumnya.
  - Update data melalui API.
  - Refresh otomatis setelah berhasil.
- Hapus Aset untuk Yayasan dan Sarpras
  - Dialog konfirmasi sebelum menghapus.
  - Notifikasi hasil aksi.

### 2. Mengajukan Peminjaman Aset (EPIC03):
**Tujuan Fitur:**
- Memfasilitasi proses pengajuan peminjaman aset baik dalam unit sendiri maupun lintas unit secara terstruktur dan terdokumentasi.

**Komponen:**
- Form Pengajuan
  - Dropdown aset tersedia.
  - Input jumlah, tanggal mulai & kembali.
  - Input tujuan peminjaman.
  - Dropdown unit tujuan (khusus Sarpras).
  - Validasi frontend (field wajib & validasi tanggal).
  - Notifikasi sukses setelah submit.

- Daftar Pengajuan Saya
  - Menampilkan tabel pengajuan milik user.
  - Kolom: Aset, Jumlah, Periode, Status.

- Edit & Delete (Jika status pengajuan masih DIAJUKAN)
  - Tombol aksi hanya muncul jika status masih DIAJUKAN.
  - Notifikasi hasil aksi.

### 3. Dashboard Utilisasi Aset (EPC11):
**Tujuan Fitur:**
- Menyediakan ringkasan dan analisis data utilisasi aset untuk membantu pengambilan keputusan berdasarkan role.

**Komponen Dashboard:**
- Summary Card Inventori Aset
   - Total seluruh aset.
   - Total per kategori.
   - Data sesuai role (Yayasan: semua unit, lainnya: unit sendiri).

- Grafik Utilisasi
  - Bar Chart utilisasi per unit (khusus Yayasan).

- Tren Utilisasi Aset
  - Line Chart tren utilisasi berdasarkan periode.

- Top 5 Aset Paling Sering Dipinjam
  - Menampilkan 5 aset dengan frekuensi peminjaman tertinggi. 

- Top 5 Aset Paling Sering Rusak/Hilang
  - Menampilkan 5 aset dengan tingkat kerusakan atau kehilangan tertinggi.

- Filter Dashboard
  - Komponen: 
    - Periode (bulan/tahun)
    - Kategori aset
    - Unit (khusus Yayasan)
  - Data diperbarui secara dinamis sesuai filter.