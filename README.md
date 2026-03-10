# INVENTRA DD - Inventory and Resource Asset System Sekolah Islam Dian Didaktika

Aplikasi frontend berbasis Vue.js untuk manajemen aset sekolah, mencakup:

  - **TPS**: Kelola profil, kelola aset, peminjaman aset, pengadaan aset, persetujuan peminjaman, persetujuan pengadaan aset, pengantian barang rusak

  - **MIS**: laporan utilisasi aset & pengadaan

  - **EIS**: dashboard pengadaan & peminjaman

Ringkasan kebutuhan fitur & role akses mengacu pada dokumen README pada tiap branch anggota.


## Tech Stack

- VS Code
- Node.js
- npm
- Git
- Backend yang sudah dijalankan

## Instalasi dan Menjalankan Aplikasi

Jalankan beberapa komando berikut ini melalui aplikasi
terminal seperti Command Prompt, PowerShell, Windows Terminal, Bash, Zsh, atau aplikasi
sejenis.

**1. Clone Repository**

```sh
git clone https://gitlab.cs.ui.ac.id/propensi-2025-2026-genap/kelas-a/ibuprofen/ibuprofen-frontend.git
```

**2. Masuk ke folder project**
```
cd ibuprofen-frontend
```

**3. Install dependencies**
```
npm install
```

Install tambahan package icon:

```
npm install lucide-vue-next
```

**4. Jalankan Aplikasi**

Pastikan backend sudah dijalankan. Lalu jalankan command ini:

```sh
npm run dev
```

**5. Mengakses aplikasi di browser**

Setelah menjalankan perintah di atas, aplikasi dapat diakses melalui:

http://localhost:5173/


## Struktur Direktori

```sh
└───ibuprofen-frontend
    ├───.vscode
    ├───public
    └───src
        ├───assets
        ├───components
        │   └───icons
        ├───router
        ├───stores
        └───views
```

### Penjelasan Singkat

- **.vscode/**  
  Berisi konfigurasi khusus untuk Visual Studio Code.

- **public/**  
  Berisi file statis yang dapat diakses langsung oleh browser.

- **src/**  
  Folder utama pengembangan aplikasi.

  - **assets/** : Menyimpan gambar, file CSS, dan aset lainnya.  
  - **components/** : Komponen Vue yang dapat digunakan kembali.  
    - **icons/** : Komponen ikon yang digunakan dalam aplikasi.  
  - **router/** : Konfigurasi routing aplikasi.  
  - **stores/** : Manajemen state aplikasi.  
  - **views/** : Halaman utama yang ditampilkan kepada pengguna.


## Penjelasan Fitur Raysha Reifika Ryzki - 2306208426

### 1. Persetujuan Pengadaan Aset (EPIC06):
**Tujuan Fitur:**
- Mengatur proses review dan persetujuan pengadaan aset agar:
- Tidak ada pengajuan pengadaan tanpa approval
- Proses terdokumentasi dengan baik
- Biaya pengadaan dapat dikontrol
- Bukti pembelian tersimpan dalam sistem

**Alur Proses:**
- Guru/Sarpras mengajukan pengadaan aset
- Status awal: DIAJUKAN
- Kepala Sekolah dan Yayasan melakukan review
- Jika disetujui → Yayasan melakukan pembelian
- Yayasan mengunggah bukti pembelian
- Status berubah menjadi TELAH DIBELI dan jumlah aset di manajemen aset berubah.

### 2. Penggantian Barang Rusak (EPIC07):
**Tujuan Fitur:**
- Mempermudah dan mendokumentasikan penggantian barang rusak akibat peminjaman agar operasional sekolah tetap berjalan dengan baik.

**Alur Proses:**
- Guru/Siswa mengajukan penggantian barang rusak
- Status awal: DIAJUKAN
- Sarana Prasarana melakukan review

### 3. Dashboard Pengadaan Aset (EPIC10):
**Tujuan Fitur:**
Memberikan gambaran visual dan analisis terkait pengadaan aset untuk membantu pengambilan keputusan.

**Komponen Dashboard:**
- Summary Card:
    Menampilkan total pengadaan, total biaya, perbandingan antar unit (Khusus yayasan)

- Grafik Pengadaan per Tahun:
    Menampilkan total biaya pengadaan dan jumlah aset pengadaan tiap tahun

- Top 5 Aset Paling Cepat Habis
    Menampilkan aset yang paling cepat habis / paling sering dibeli ulang.

- Top 5 Pengadaan dengan Biaya Terbesar
    Menampilkan 5 transaksi pengadaan dengan nilai tertinggi.


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


## Penjelasan Fitur Indah Cahya Puspitahati - 2306245453

### 1. EPIC01 – Modul Manajemen Akun & Profil Pengguna

Modul Manajemen Akun & Profil Pengguna merupakan bagian dari sistem **INVENTRA DD (Inventory and Resource Asset System Sekolah Islam Dian Didaktika)** yang berfokus pada pengelolaan data akun pengguna secara terpusat dan aman dengan penerapan **Role-Based Access Control (RBAC)**.

Modul ini memastikan setiap pengguna memiliki akses sesuai peran dan unitnya, serta mendukung proses administrasi akun oleh pihak Sarpras.

---

## Role yang Terlibat
- **Sarpras** (Administrator)
- **Guru**
- **Siswa**
- **Kepala Sekolah (Kepsek)**
- **Yayasan**

> Catatan: Sebagian besar endpoint administrasi hanya dapat diakses oleh role **Sarpras**.

---

## Fitur Utama

### 1. Menambahkan Akun Pengguna
- **Endpoint:** `POST /api/users`
- **Aktor:** Sarpras
- **Deskripsi:**  
  Mendaftarkan akun pengguna baru ke dalam sistem sesuai dengan peran dan unit yang ditentukan.

- **Aturan & Validasi:**
  - Email wajib unik dan berformat valid.
  - Field wajib: Nama Lengkap, Email, Role, Password.
  - Untuk role **Siswa**, wajib mengisi Unit dan Kelas.
  - Unit akun otomatis mengikuti unit Sarpras yang membuat akun.
  - Password dienkripsi sebelum disimpan ke database.

- **Respons:**
  - Berhasil → akun tersimpan dan notifikasi sukses ditampilkan.
  - Gagal → pesan error ditampilkan sesuai jenis validasi.

---

### 2. Melihat Daftar Akun Pengguna dalam Satu Unit
- **Endpoint:** `GET /api/users/per-unit`
- **Aktor:** Sarpras
- **Deskripsi:**  
  Menampilkan daftar akun pengguna yang terdaftar dalam unit yang sama dengan Sarpras yang sedang login.

- **Fitur Pendukung:**
  - Pencarian berdasarkan nama.
  - Filter berdasarkan role.
  - Pagination (page & limit).

- **Keamanan:**
  - Data dibatasi hanya pada satu unit sesuai akun Sarpras.

---

### 3. Melihat Daftar Akun Sarpras Lintas Unit
- **Endpoint:** `GET /api/users/lintas-unit`
- **Aktor:** Sarpras
- **Deskripsi:**  
  Menampilkan daftar akun Sarpras dari seluruh unit untuk kebutuhan koordinasi lintas unit.

- **Fitur Pendukung:**
  - Pencarian berdasarkan nama, email, atau nomor telepon.
  - Filter berdasarkan unit.
  - Pagination.

- **Aturan Bisnis:**
  - Hanya akun dengan role **Sarpras** yang ditampilkan.

---

### 4. Melihat Detail Akun Pengguna
- **Endpoint:** `GET /api/users/{id}`
- **Aktor:** Sarpras
- **Deskripsi:**  
  Menampilkan detail lengkap informasi akun pengguna berdasarkan ID.

- **Perilaku Sistem:**
  - Data ditampilkan dalam mode **read-only**.
  - Jika ID tidak ditemukan, sistem mengembalikan error **404 Not Found**.

- **UI Pendukung:**
  - Tombol **Edit** untuk mengubah data akun.
  - Tombol **Kembali** untuk kembali ke daftar akun tanpa reload halaman.

---

### 5. Menghapus Akun Pengguna
- **Endpoint:** `DELETE /api/users/{id}`
- **Aktor:** Sarpras
- **Deskripsi:**  
  Menghapus akun pengguna yang sudah tidak diperlukan atau tidak aktif.

- **Aturan & Keamanan:**
  - Konfirmasi penghapusan wajib ditampilkan.
  - Sistem memverifikasi keberadaan akun sebelum penghapusan.
  - Penghapusan menggunakan mekanisme **soft delete**.

- **Respons:**
  - Berhasil → daftar akun diperbarui secara otomatis.
  - Gagal → pesan error ditampilkan.

---

## Keamanan
- Seluruh endpoint dilindungi dengan autentikasi berbasis token.
- Implementasi **RBAC** untuk membatasi akses berdasarkan role.
- Validasi data dilakukan di sisi client dan server.

---

## Tujuan Modul
- Menjaga konsistensi dan keamanan data akun pengguna.
- Mempermudah administrasi pengguna oleh Sarpras.
- Memastikan setiap pengguna hanya memiliki akses sesuai peran dan unitnya.

---


### 2. Laporan Utilisasi Aset (EPIC08)
**Tujuan Fitur:**
Menyediakan laporan terstruktur mengenai pemanfaatan aset sekolah dalam bentuk tabel dan dokumen PDF, sehingga pihak manajemen dapat memantau riwayat dan frekuensi peminjaman aset secara transparan serta mendukung evaluasi dan pengambilan keputusan berbasis data.

**Alur Proses:**
- Akses Fitur:
    - Fitur laporan hanya dapat diakses oleh pengguna dengan role Yayasan, Kepala Sekolah (Kepsek), dan Sarpras sesuai kebijakan RBAC.
    - Pengguna membuka halaman Laporan Utilisasi Aset dari menu utama sistem.

**Riwayat Peminjaman Aset**
- Sistem menampilkan tabel riwayat peminjaman aset yang berisi informasi:
    - Nama peminjam
    - Nama aset
    - Kategori aset
    - Unit
    - Waktu peminjaman dan pengembalian
    - Tujuan peminjaman
    - Status peminjaman
- Secara default, tab Riwayat Peminjaman ditampilkan sebagai tampilan awal.
- Pengguna dapat melakukan:
    - Filter berdasarkan unit, periode (bulan/tahun/rentang tanggal), kategori aset, dan kata kunci pencarian.
    - Sort dan pencarian untuk mempermudah analisis data.
- Sistem mendukung pagination untuk menampilkan data dalam jumlah besar secara efisien.
- Jika data kosong, sistem menampilkan empty state dengan pesan informatif.

**Riwayat Frekuensi Peminjaman Aset**
- Pengguna dapat berpindah ke tab Riwayat Frekuensi Peminjaman.
- Sistem menampilkan ringkasan pemanfaatan aset dalam periode tertentu, meliputi:
    - Frekuensi peminjaman per aset
    - Total durasi peminjaman
    - Status aset (Tersedia, Dipinjam, Rusak)
- Data dapat difilter berdasarkan:
    - Unit
    - Periode
    - Kategori aset
    - Status aset
- Informasi ini membantu mengidentifikasi aset yang paling sering digunakan, jarang digunakan, atau berpotensi mengalami kerusakan.

**Riwayat Frekuensi Peminjaman Aset**
- Pengguna dapat mengunduh laporan dalam bentuk PDF melalui tombol Unduh / Export PDF.
- File PDF dihasilkan berdasarkan filter aktif yang sedang diterapkan pada tabel.
- Sistem menampilkan loading state selama proses pembuatan file.
- Jika data tidak tersedia, sistem tetap menampilkan PDF dengan keterangan bahwa data tidak ditemukan.
- Riwayat unduhan dicatat oleh sistem untuk kebutuhan audit dan pelacakan.


## Penjelasan Fitur Nadira Aliya Nashwa - 2306165692

### 1. Mengajukan Pengadaan Aset (EPIC04)
**Tujuan Fitur:**
Mengatur proses pengajuan pengadaan aset agar:
- Setiap kebutuhan aset terdokumentasi dengan jelas.
- Pengadaan dilakukan berdasarkan kebutuhan yang terverifikasi.
- Memudahkan proses review dan persetujuan pengadaan.
- Mendukung perencanaan dan kontrol anggaran.
- Mengurangi risiko pengadaan yang tidak diperlukan.

**Alur Proses:**
- Guru/Sarpras mengajukan pengadaan aset.
- Status awal: DIAJUKAN.
- Kepala Sekolah melakukan review.
- Jika disetujui → Status berubah menjadi DISETUJUI OLEH KEPALA SEKOLAH.
- Jika ditolak → Status berubah menjadi DITOLAK.
- Jika disetujui oleh Kepsek → diteruskan ke Yayasan untuk review akhir.
- Jika disetujui oleh Yayasan → Status berubah menjadi DISETUJUI OLEH YAYASAN.
- Jika ditolak oleh Yayasan → Status berubah menjadi DITOLAK.

### 2. Mengelola Persetujuan Peminjaman Aset (EPIC05)
**Tujuan Fitur:**
Mengatur proses review dan persetujuan peminjaman aset agar:
- Tidak ada pengajuan peminjaman tanpa approval
- Proses terdokumentasi dengan baik
- Mengurangi risiko bentrok penggunaan aset.
- Menjaga kontrol dan ketersediaan aset di setiap unit.
Meningkatkan transparansi proses peminjaman.

**Alur Proses:**
- Guru/Sarpras (lintas unit)/Siswa mengajukan peminjaman aset
- Status awal: DIAJUKAN
- Sarpras melakukan review
- Jika disetujui → Status pengajuan berubah menjadi DISETUJUI
- Jika ditolak → Status pengajuan berubah menjadi DITOLAK

### 3. Dashboard Pengadaan Aset (EPIC10):
**Tujuan Fitur:**
Memberikan gambaran visual dan analisis terkait pengadaan aset untuk membantu pengambilan keputusan.

**Komponen Dashboard:**
- Summary Card:
    Menampilkan total pengadaan, total biaya, perbandingan antar unit (Khusus yayasan)

- Grafik Pengadaan per Tahun:
    Menampilkan total biaya pengadaan dan jumlah aset pengadaan tiap tahun

- Top 5 Aset Paling Cepat Habis
    Menampilkan aset yang paling cepat habis / paling sering dibeli ulang.

- Top 5 Pengadaan dengan Biaya Terbesar
    Menampilkan 5 transaksi pengadaan dengan nilai tertinggi.


## Penjelasan Fitur Patricia Gloria Sujatmoko Silaban - 2306275172

### 1. Manajemen Akun Pengguna (User Profile)
Fitur ini mencakup tampilan untuk melihat dan mengelola data profil pengguna sesuai dengan role masing-masing.

* **[SELF] Melihat Akun Pengguna**
    * Menampilkan informasi profil lengkap (Nama, Email, No HP, Password, dan field wajib lainnya sesuai role).
    * Format tampilan yang mudah dibaca untuk verifikasi data mandiri.
* **[SELF] Mengedit Akun Pengguna**
    * Formulir yang terisi otomatis (*pre-filled*) dengan data profil saat ini.
    * Field `Role`, `Unit`, dan `Email` disetel sebagai *read-only* (disabled) untuk menjaga konsistensi data.
    * Fitur *toggle* (ikon mata) pada input password untuk melihat/menyembunyikan teks.
    * Notifikasi sukses menggunakan *Pop-up Message* atau *Toast Notification* setelah data berhasil disimpan.
* **[ADM] Mengedit Akun Pengguna (Role Sarpras)**
    * Formulir khusus untuk admin Sarpras guna mengubah informasi atau hak akses akun pengguna lain.
    * Tersedia tombol "Batal" untuk kembali ke halaman daftar tanpa menyimpan perubahan.

### 2. Laporan Pengadaan Aset (Reporting)
Fitur ini mencakup visualisasi data laporan pengadaan dalam bentuk tabel dinamis dan fungsi ekspor.

* **Tabel Laporan Pengadaan**
    * **Kontrol Periode Dinamis:** Dropdown untuk memilih tipe periode (Harian, Bulanan, Tahunan)
    * **Filter & Pencarian:** Filter berdasarkan Unit (TK/SD/SMP/SMA/All), Kategori, dan Status. Serta fitur search berdasarkan Nama/Merk Aset.
    * **Sort & Pagination:** Fitur pengurutan (asc/desc) pada kolom Estimasi Harga dan navigasi halaman (pagination).
    * **Empty State:** Tampilan khusus jika data tidak ditemukan.
* **Ekspor Laporan PDF**
    * Tombol "Unduh PDF" yang mengirimkan filter aktif ke backend.
    * Status *loading* pada tombol selama proses unduhan berlangsung.
    * Penanganan error jika API gagal men-generate file.