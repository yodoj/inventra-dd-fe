# Ibuprofen Front-End - Fitur & Panduan Pengembangan

Readme ini merangkum daftar fitur Front-End yang dikerjakan oleh **Patricia Gloria Sujatmoko Silaban** berdasarkan Product Backlog proyek Sistem Informasi Manajemen Aset, Pinjaman, dan Pengadaan Sekolah Islam Dian Didaktika.

## 🚀 Fitur yang Dikerjakan (Front-End)

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

# INVENTRA DD - Inventory and Resource Asset System Sekolah Islam Dian Didaktika

Aplikasi frontend berbasis Vue.js untuk manajemen aset sekolah, mencakup:

  - **TPS**: Kelola profil, kelola aset, peminjaman aset, pengadaan aset, persetujuan peminjaman, persetujuan pengadaan aset, pengantian barang rusak

  - **MIS**: laporan utilisasi aset & pengadaan

  - **EIS**: dashboard pengadaan & peminjaman

Ringkasan kebutuhan fitur & role akses mengacu pada dokumen README pada tiap branch anggota.


## Tech Stack

- VS Code
- Node.js
- Git

## Instalasi dan Menjalankan Aplikasi

Jalankan beberapa komando berikut ini melalui aplikasi
terminal seperti Command Prompt, PowerShell, Windows Terminal, Bash, Zsh, atau aplikasi
sejenis. 

### Clone Repository 

```sh
git clone https://gitlab.cs.ui.ac.id/propensi-2025-2026-genap/kelas-a/ibuprofen/ibuprofen-frontend.git
```

### Masuk ke folder project

```sh
cd ibuprofen-frontend
```

### Install dependencies

```sh
npm install
```

### Jalankan project

```sh
cd npm run dev
```

### Mengakses aplikasi di browser

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
