# INVENTRA DD - Inventory and Resource Asset System Sekolah Islam Dian Didaktika

## Penjelasan Fitur Raysha Reifika Ryzki
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


    
# inventra-dd-fe

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
