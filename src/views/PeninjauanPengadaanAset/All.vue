<template>
  <main class="page">
    <h1 class="title">
      Peninjauan Pengajuan Pengadaan Aset
    </h1>

    <!-- FILTER -->
    <div class="filter-wrapper">
      <div class="search-box">
        <SearchIcon class="search-icon" />

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

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th @click="sortBy('kode')" class="sortable">
                <div class="th-inner">
                  <span class="th-text">Kode</span>
                  <i class="sort-icon pi" :class="getSortIcon('kode')"></i>
                </div>
              </th>
              <th>Nama Pengaju</th>
              <th>Gambar</th>
              <th @click="sortBy('nama')" class="sortable">
              <div class="th-inner">
                <span class="th-text">Nama</span>
                <i class="sort-icon pi" :class="getSortIcon('nama')"></i>
              </div>
            </th>
              <th>Merk</th>
              <th>Qty</th>
              <th @click="sortBy('tanggal')" class="sortable">
                <div class="th-inner">
                  <span class="th-text">Tanggal Pengadaan</span>
                  <i class="sort-icon pi" :class="getSortIcon('tanggal')"></i>
                </div>
              </th>
              <th @click="sortBy('harga')" class="sortable">
                <div class="th-inner">
                  <span class="th-text">Harga</span>
                  <i class="sort-icon pi" :class="getSortIcon('harga')"></i>
                </div>
              </th>
              <th>Alasan</th>
              <th @click="sortBy('status')">Status</th>
              <th>Aksi</th>
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
              <td class="center">
                <span :class="['badge', getStatusClass(row.status)]">
                  {{ formatStatus(row.status) }}
                </span>
              </td>
                <td class="center">
                  <div class="action-buttons">

                    <button
                      v-if="row.status === 'DIAJUKAN'"
                      class="btn-circle review-btn"
                    >
                      <i class="pi pi-comments"></i>
                    </button>

                    <button
                      v-else
                      class="btn-circle edit-btn"
                    >
                      <EditIcon />
                    </button>

                  </div>
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
  </main>
</template>

<script setup>
import { ref, computed } from "vue";
import SearchIcon from "@/components/icons/SearchIcon.vue";
import EditIcon from "@/components/icons/EditIcon.vue";
import 'primeicons/primeicons.css';
const q = ref("");
const statusFilter = ref("ALL");

const sortKey = ref("");
const sortOrder = ref("asc");

// Dummy data, nanti ambil dari API
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
    qty: 2,
    tanggal: "2026-03-22",
    harga: 75000,
    alasan: "Keterangan teks",
    status: "DIAJUKAN",
  },
]);

function getStatusClass(status) {
  const map = {
    DIAJUKAN: "status-diajukan",
    DISETUJUI_KEPSEK: "status-kepsek",
    DISETUJUI_YAYASAN: "status-yayasan",
    TIDAK_DISETUJUI: "status-ditolak",
  };

  return map[status] || "";
}

function formatStatus(status) {
  return status.replaceAll("_", " ");
}

function getSortIcon(column) {
  if (sortKey.value !== column) {
    return "pi-sort-alt unsorted";
  }

  return sortOrder.value === "asc"
    ? "pi-sort-amount-up-alt active-sort"
    : "pi-sort-amount-down active-sort";
}

function sortBy(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
}

const filteredRows = computed(() => {
  let data = rows.value.filter((row) => {
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

  if (sortKey.value) {
    data.sort((a, b) => {
      let aVal = a[sortKey.value];
      let bVal = b[sortKey.value];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder.value === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder.value === "asc" ? 1 : -1;
      return 0;
    });
  }

  return data;
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
  background: #00588F;
  color: white;
}

th {
  font-weight: 500;
  font-size: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  text-align: center;
}

td {
  font-weight: 400;
  font-size: 12px;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.6px;
}

.badge-lg {
  padding: 18px 26px;
  font-size: 26px;
  line-height: 1.15;
  white-space: normal;
  max-width: 260px;
}

.status-diajukan {
  background: #EFEFEF;
  color: #333437;
}

.status-kepsek {
  background: #ECF8FD;
  color: #1FA2FF;
}

.status-yayasan {
  background: #FFEED9;
  color: #AA5B00;
}

.status-ditolak {
  background: #FBE5E6;
  color: #DC3545;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #777;
}

th {
  cursor: pointer;
}

.th-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-circle {
  width: 30px;
  height: 30px;

  min-width: 30px;
  min-height: 30px;

  border-radius: 50%;
  border: none;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0;
  box-sizing: border-box;
}

.edit-btn {
  background: #00588F;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.edit-btn:hover {
  background: #244d7a;
  transform: translateY(-1px);
}

.review-btn {
  background: #198754;
  color: white;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sort-icon {
  flex: 0 0 auto;
  font-size: 12px;
  transition: 0.2s ease;
}

.unsorted {
  color: #cbd5e1;
}

.active-sort {
  color: #ffffff;
}

th:nth-child(1),
td:nth-child(1) { width: 70px; }   /* Kode */ 

th:nth-child(2),
td:nth-child(2) { width: 120px; }  /* Nama Pengaju */

th:nth-child(3),
td:nth-child(3) { width: 90px; }   /* Gambar */

th:nth-child(4),
td:nth-child(4) { width: 130px; }  /* Nama */

th:nth-child(5),
td:nth-child(5) { width: 60px; }   /* Merk */

th:nth-child(6),
td:nth-child(6) { width: 30px; }   /* Qty */

th:nth-child(7),
td:nth-child(7) { width: 10px; }  /* Tanggal */

th:nth-child(8),
td:nth-child(8) { width: 70px; }  /* Harga */

th:nth-child(9),
td:nth-child(9) { width: 160px; }  /* Alasan */

th:nth-child(10),
td:nth-child(10) { width: 80px; } /* Status */

th:nth-child(11),
td:nth-child(11) { width: 30px; }  /* Aksi */
</style>
