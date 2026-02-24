<template>
  <main class="page">
    <h1 class="title">
      Peninjauan Pengajuan Pengadaan Aset
    </h1>

    <!-- FILTER -->
    <div class="filter-wrapper">
      <div class="search-box">
        <span class="search-icon">🔎</span>
        <input
          v-model="q"
          type="text"
          placeholder="Cari nama aset, kode, atau merk"
        />
      </div>

      <select v-model="statusFilter" class="status-select">
        <option value="ALL">Semua Status</option>
        <option value="DIAJUKAN">Diajukan</option>
        <option value="DISETUJUI_KEPSEK">Disetujui oleh Kepsek</option>
        <option value="DISETUJUI_YAYASAN">Disetujui oleh Yayasan</option>
        <option value="TIDAK_DISETUJUI">Tidak Disetujui</option>
      </select>
    </div>

    <!-- TABLE CARD -->
    <div class="table-card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Nama Pengaju</th>
              <th>Gambar</th>
              <th>Nama</th>
              <th>Merk</th>
              <th>Qty</th>
              <th>Tanggal</th>
              <th>Harga</th>
              <th>Alasan</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in filteredRows" :key="row.kode">
              <td>{{ row.kode }}</td>
              <td>{{ row.namaPengaju }}</td>
              <td>
                <div class="img-box">
                  <img :src="row.gambar" />
                </div>
              </td>
              <td class="bold">{{ row.nama }}</td>
              <td>{{ row.merk }}</td>
              <td class="center">{{ row.qty }}</td>
              <td>{{ formatDate(row.tanggal) }}</td>
              <td>{{ formatRupiah(row.harga) }}</td>
              <td>{{ row.alasan }}</td>
              <td>
                <span :class="['badge', row.status]">
                  {{ row.status }}
                </span>
              </td>
            </tr>

            <tr v-if="filteredRows.length === 0">
              <td colspan="10" class="empty">
                Tidak ada data ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from "vue";

const q = ref("");
const statusFilter = ref("ALL");

const rows = ref([
  {
    kode: "PG0001",
    namaPengaju: "Indah",
    gambar: "https://via.placeholder.com/120x80",
    nama: "Kertas",
    merk: "Sidu",
    qty: 1,
    tanggal: "2026-02-17",
    harga: 50000,
    alasan: "Keterangan teks",
    status: "DISETUJUI_YAYASAN",
  },
  {
    kode: "PG0002",
    namaPengaju: "Cia",
    gambar: "https://via.placeholder.com/120x80",
    nama: "Microphone",
    merk: "JBL",
    qty: 1,
    tanggal: "2026-03-22",
    harga: 50000,
    alasan: "Keterangan teks",
    status: "DIAJUKAN",
  },
  {
    kode: "PG0003",
    namaPengaju: "Ridya",
    gambar: "https://via.placeholder.com/120x80",
    nama: "Speaker",
    merk: "JBL",
    qty: 1,
    tanggal: "2026-03-22",
    harga: 50000,
    alasan: "Keterangan teks",
    status: "TIDAK_DISETUJUI",
  },
]);

const filteredRows = computed(() => {
  return rows.value.filter((row) => {
    const search = q.value.toLowerCase();

    const matchSearch =
      row.nama.toLowerCase().includes(search) ||
      row.kode.toLowerCase().includes(search) ||
      row.merk.toLowerCase().includes(search) ||
      row.namaPengaju.toLowerCase().includes(search);

    const matchStatus =
      statusFilter.value === "ALL" ||
      row.status === statusFilter.value;

    return matchSearch && matchStatus;
  });
});

function formatDate(d) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}
</script>

<style scoped>
.page {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 24px;
}

.title {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 24px;
}

.filter-wrapper {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.search-box {
  flex: 1;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
}

.status-select {
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.table-card {
  background: #fff;
  border: 2px solid #eaecf0;
  border-radius: 16px;
  padding: 20px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1000px;
  border-collapse: separate;
  border-spacing: 0;
}

thead {
  background: #2e5f9e;
  color: white;
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
}

tbody tr:hover {
  background: #f9fafb;
}

.img-box {
  width: 80px;
  height: 60px;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid #eee;
}

.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bold {
  font-weight: 600;
}

.center {
  text-align: center;
}

.badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.DIAJUKAN {
  background: #f1f5f9;
  color: #334155;
}

.DISETUJUI_KEPSEK {
  background: #e0f2fe;
  color: #0369a1;
}

.DISETUJUI_YAYASAN {
  background: #fef3c7;
  color: #b45309;
}

.TIDAK_DISETUJUI {
  background: #fee2e2;
  color: #b91c1c;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #777;
}
</style>
