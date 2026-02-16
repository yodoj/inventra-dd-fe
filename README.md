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