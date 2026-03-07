<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from "vue";
import { useRouter } from "vue-router";
import SearchIcon from "@/components/icons/SearchIcon.vue";
import EditIcon from "@/components/icons/EditIcon.vue";
import "primeicons/primeicons.css";

import { useTinjauPengadaanStore } from "@/stores/tinjauPengadaanStore";
import { useAuthStore } from "@/stores/auth";
const auth = useAuthStore();
const role = computed(() => auth.userRole);

const store = useTinjauPengadaanStore();
const router = useRouter();

const q = ref("");
const statusFilter = ref("ALL");
const sortKey = ref("");
const sortOrder = ref("asc");


const statusOpen = ref(false);

function onDocClickFilter(e) {
  if (!e.target.closest(".status-dd")) statusOpen.value = false;
}
onMounted(() => document.addEventListener("click", onDocClickFilter));
onBeforeUnmount(() => document.removeEventListener("click", onDocClickFilter));

const statusFilterLabel = computed(() => {
  const map = {
    ALL: "Semua Status",
    DIAJUKAN: "Diajukan",
    DISETUJUI_KEPSEK: "Disetujui oleh Kepsek",
    DISETUJUI_YAYASAN: "Disetujui oleh Yayasan",
    DITOLAK: "Tidak Disetujui",
    DIBELI: "Dibeli",
  };
  return map[statusFilter.value] || "Semua Status";
});

function getStatusClass(statusPengadaan) {
  const map = {
    DIAJUKAN: "status-diajukan",
    DISETUJUI_KEPSEK: "status-kepsek",
    DISETUJUI_YAYASAN: "status-yayasan",
    DITOLAK: "status-ditolak",
    DIBELI: "status-yayasan",
  };
  return map[statusPengadaan] || "";
}

function formatStatus(statusPengadaan) {
  return String(statusPengadaan || "").replaceAll("_", " ");
}

function getSortIcon(column) {
  if (sortKey.value !== column) return "pi-sort-alt unsorted";
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

function pickStatus(v) {
  statusFilter.value = v;
  statusOpen.value = false;
}

function formatRole(role) {
  if (!role) return "";
  const r = String(role).toLowerCase();
  if (r === 'kepsek') return 'Kepsek';
  if (r === 'yayasan') return 'Yayasan';
  return role;
}

function formatDate(isoOrDate) {
  if (!isoOrDate) return "-";
  const d = String(isoOrDate).slice(0, 10);
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
}

async function fetchAll() {
  try {
    await store.fetchAll();
  } catch (e) {
    console.error(e);
  }
}

onMounted(fetchAll);

const tableRows = computed(() => {
  return store.items.map((it) => ({
    idPengadaan: it.idPengadaan ?? 0,

    namaPengaju: it.namaPengaju ?? "-",
    rolePengaju: it.unit ?? "-",
    gambar: it.linkGambar ?? "",
    nama: it.namaAset ?? "",
    merk: it.merk ?? "",
    qty: it.qty ?? 0,
    tanggal: it.waktuPengadaan ?? "",
    harga: it.estimasiHarga ?? 0,
    alasan: it.alasan ?? "-",
    namaReviewer: it.namaReviewer ?? "-",
    reviewerRole: it.reviewerRole ?? "-",
    tanggalReview: it.updatedAt ?? null,
    statusPengadaan: it.statusPengadaan ?? "DIAJUKAN",
    kepsekFirstReviewedAt: it.kepsekFirstReviewedAt ?? null,
    yayasanFirstReviewedAt: it.yayasanFirstReviewedAt ?? null,
  }));
});

const filteredRows = computed(() => {
  let data = tableRows.value.filter((row) => {
    const search = (q.value ?? "").toLowerCase();

    const nama = String(row.nama ?? "").toLowerCase();
    const kode = String(row.kode ?? "").toLowerCase();
    const merk = String(row.merk ?? "").toLowerCase();
    const namaPengaju = String(row.namaPengaju ?? "").toLowerCase();

    const matchSearch =
      nama.includes(search) ||
      kode.includes(search) ||
      merk.includes(search) ||
      namaPengaju.includes(search);

    const matchStatus =
      statusFilter.value === "ALL" ||
      String(row.statusPengadaan ?? "") === statusFilter.value;

    return matchSearch && matchStatus;
  });

  if (sortKey.value) {
    data.sort((a, b) => {
      let aVal = a[sortKey.value];
      let bVal = b[sortKey.value];

      aVal = aVal ?? "";
      bVal = bVal ?? "";

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder.value === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder.value === "asc" ? 1 : -1;
      return 0;
    });
  }

  return data;
});
function withinDays(fromISO, days = 2) {
  if (!fromISO) return false;
  const from = new Date(fromISO).getTime();
  const now = Date.now();
  const diffDays = (now - from) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

function firstTs(role, row) {
  if (role === "KEPSEK") return row.kepsekFirstReviewedAt || row.createdAt || null;
  if (role === "YAYASAN") return row.yayasanFirstReviewedAt || row.createdAt || null;
  return null;
}


function selectAndGoCreate(row) {
  const id = row.idPengadaan;
  if (!id) return;
  store.selectPengadaan(id);
  router.push(`/pengadaan/pengajuan/tinjau/${id}`);
}

function selectAndGoEdit(row) {
  const id = row.idPengadaan;
  if (!id) return;
  store.selectPengadaan(id);
  router.push(`/pengadaan/pengajuan/tinjau/update/${id}`);
}

function selectAndGoBeli(row) {
  const id = row.idPengadaan;
  if (!id) return;
  store.selectPengadaan(id);
  router.push(`/pengadaan/pengajuan/tinjau/bukti/${id}`);
}
function getActionType(row) {
  const r = role.value;
  const status = row.statusPengadaan;
  const yayasanSudahReview = !!row.yayasanFirstReviewedAt;
  const kepsekSudahReview = !!row.kepsekFirstReviewedAt;

  // Logika khusus Yayasan
  if (r === "YAYASAN") {
    const actions = [];

    // Jika status disetujui kepsek & yayasan belum sentuh -> Muncul tombol Review (Create)
    if (status === "DISETUJUI_KEPSEK" && !yayasanSudahReview) {
      actions.push("CREATE");
    }

    // Jika sudah disetujui yayasan -> Muncul tombol Beli
    if (status === "DISETUJUI_YAYASAN") {
      actions.push("BELI");
    }

    // Jika sudah pernah direview, bukan status DIBELI, dan masih < 2 hari -> Muncul tombol Edit
    if (yayasanSudahReview && status !== "DIBELI") {
      if (withinDays(row.yayasanFirstReviewedAt, 2)) {
        actions.push("EDIT");
      }
    }

    return actions.length > 0 ? actions : ["NONE"];
  }

  if (r === "KEPSEK") {
    if (status === "DIAJUKAN" && !kepsekSudahReview) return ["CREATE"];
    if (!yayasanSudahReview && kepsekSudahReview) {
      if ((status === "DITOLAK" || status === "DISETUJUI_KEPSEK") && withinDays(row.kepsekFirstReviewedAt, 2)) {
        return ["EDIT"];
      }
    }
  }

  return ["NONE"];
}
</script>

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
          placeholder="Cari nama pengaju, nama aset, atau merk"
        />
      </div>

      <!-- CUSTOM STATUS DROPDOWN -->
      <div class="status-dd" :class="{ open: statusOpen }">
        <button type="button" class="status-dd-btn" @click="statusOpen = !statusOpen">
          <span :class="{ placeholder: statusFilter === 'ALL' }">
            {{ statusFilterLabel }}
          </span>

          <svg class="status-dd-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6.7 9.3a1 1 0 0 1 1.4 0L12 13.2l3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4z"
            />
          </svg>
        </button>

        <div v-if="statusOpen" class="status-dd-menu">
          <button type="button" class="status-dd-item" @click="pickStatus('ALL')">
            Semua Status
          </button>
          <button type="button" class="status-dd-item" @click="pickStatus('DIAJUKAN')">
            Diajukan
          </button>
          <button type="button" class="status-dd-item" @click="pickStatus('DISETUJUI_KEPSEK')">
            Disetujui oleh Kepsek
          </button>
          <button type="button" class="status-dd-item" @click="pickStatus('DISETUJUI_YAYASAN')">
            Disetujui oleh Yayasan
          </button>
          <button type="button" class="status-dd-item" @click="pickStatus('DITOLAK')">
            Ditolak
          </button>
        </div>
      </div>
    </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
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
                  <span class="th-text">Tanggal</span>
                  <i class="sort-icon pi" :class="getSortIcon('tanggal')"></i>
                </div>
              </th>
              <th @click="sortBy('harga')" class="sortable">
                <div class="th-inner">
                  <span class="th-text">Harga</span>
                  <i class="sort-icon pi" :class="getSortIcon('harga')"></i>
                </div>
              </th>
              <th>Alasan & Riwayat Review</th>
              <th @click="sortBy('statusPengadaan')">Status</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in filteredRows" :key="row.idPengadaan">
              <td>
                <div class="pengaju-wrapper">
                  <div class="bold">{{ row.namaPengaju }}</div>
                  <div class="role-text">{{ row.rolePengaju }}</div>
                </div>
              </td>
              <td>
                <div class="img-box">
                  <img :src="row.gambar" />
                </div>
              </td>
              <td class="bold">{{ row.nama }}</td>
              <td>{{ row.merk }}</td>
              <td class="center">{{ row.qty }}</td>
              <td class="date-column">
                <span>{{ formatDate(row.tanggal) }}</span>
              </td>
              <td>{{ formatRupiah(row.harga) }}</td>

              <td>
                <div class="alasan-wrapper">
                  <div class="alasan-main">{{ row.alasan }}</div>

                  <div v-if="row.namaReviewer && row.namaReviewer !== '-'" class="reviewer-info">
                    Terakhir direview oleh <span class="highlight">{{ row.namaReviewer }}</span>
                    ({{ formatRole(row.reviewerRole) }})
                    pada <span class="highlight">{{ formatDate(row.tanggalReview) }}</span>
                  </div>
                </div>
              </td>

              <td class="center">
                <span :class="['badge', getStatusClass(row.statusPengadaan)]">
                  {{ formatStatus(row.statusPengadaan) }}
                </span>
              </td>

              <td class="center">
                <div class="action-buttons">
                  <button
                    v-if="getActionType(row).includes('CREATE')"
                    type="button"
                    class="btn-circle review-btn"
                    @click.stop="selectAndGoCreate(row)"
                    title="Berikan Peninjauan"
                  >
                    <i class="pi pi-comments"></i>
                  </button>

                  <button
                    v-if="getActionType(row).includes('BELI')"
                    type="button"
                    class="btn-circle buy-btn"
                    @click.stop="selectAndGoBeli(row)"
                    title="Proses Pembelian"
                  >
                    <i class="pi pi-shopping-cart"></i>
                  </button>

                  <button
                    v-if="getActionType(row).includes('EDIT')"
                    type="button"
                    class="btn-circle edit-btn"
                    @click.stop="selectAndGoEdit(row)"
                    title="Ubah Peninjauan"
                  >
                    <EditIcon />
                  </button>

                  <span v-if="getActionType(row).includes('NONE')" class="no-action-text">
                    Tidak ada aksi
                  </span>
                </div>
              </td>
            </tr>

            <tr v-if="filteredRows.length === 0">
              <td colspan="10" class="empty">Tidak ada data ditemukan</td>
            </tr>
          </tbody>
        </table>
      </div>
  </main>
</template>

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

.status-dd {
  position: relative;
  width: 260px;
  flex: 0 0 auto;
}

.status-dd-btn {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  cursor: pointer;
  font-size: 13px;
}

.status-dd-btn:focus {
  outline: none;
  border-color: rgba(0, 88, 143, 0.45);
  box-shadow: 0 0 0 4px rgba(0, 88, 143, 0.12);
}

.status-dd-btn .placeholder {
  color: #6b7280;
}

.status-dd-icon {
  width: 18px;
  height: 18px;
  fill: #6b7280;
  flex: 0 0 auto;
}

.status-dd-menu {
  position: absolute;
  left: 0;
  right: 0;
  margin-top: 10px;

  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);

  overflow: hidden;
  z-index: 100;
}

.status-dd-item {
  width: 100%;
  text-align: left;
  padding: 12px 14px;
  background: #fff;
  border: 0;
  cursor: pointer;
  font-size: 13px;
}

.status-dd-item:hover {
  background: rgba(0, 88, 143, 0.08);
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
  table-layout: fixed;
}

.input::placeholder {
  color: #9ca3af;
  opacity: 1;
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
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.5;
  vertical-align: middle;
}

tbody tr:hover {
  background-color: #f0f7ff !important;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

tbody tr:hover td {
  color: #000;
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

.buy-btn {
  background: #FF9800;
  color: white;
  box-shadow: 0 2px 6px rgba(255, 152, 0, 0.3);
  margin-right: 4px;
}

.buy-btn:hover {
  background: #e68a00;
  transform: translateY(-1px);
}

.buy-btn i {
  font-size: 14px;
}

.no-action-text {
  color: #9ca3af;
  font-size: 11px;
  font-style: italic;
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

.alasan-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 40px;
}

.alasan-main {
  margin-bottom: 16px;
  word-break: normal;
}

.date-column span {
  display: block;
  max-width: 100%;
  word-break: normal;
}

.reviewer-info {
  font-size: 10px;
  color: #64748b;
  font-style: italic;
  border-top: 1px dashed #e2e8f0;
  padding-top: 4px;
  line-height: 1.4;
}

.highlight {
  font-weight: 600;
  color: #00588f;
}


.pengaju-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.role-text {
  font-size: 10px;
  color: #94a3b8; /* Warna abu-abu (slate-400) */
  font-weight: 400;
  text-transform: uppercase; /* Opsional: agar terlihat lebih rapi */
}


th:nth-child(1),
td:nth-child(1) { width: 110px; }  /* Nama Pengaju */

th:nth-child(2),
td:nth-child(2) { width: 90px; }   /* Gambar */

th:nth-child(3),
td:nth-child(3) { width: 140px; }  /* Nama */

th:nth-child(4),
td:nth-child(4) { width: 80px; }   /* Merk */

th:nth-child(5),
td:nth-child(5) { width: 45px; }   /* Qty */

th:nth-child(6),
td:nth-child(6) { width: 90px; }  /* Tanggal */

th:nth-child(7),
td:nth-child(7) { width: 110px; }  /* Harga */

th:nth-child(8),
td:nth-child(8) { width: 220px; }  /* Alasan */

th:nth-child(9),
td:nth-child(9) { width: 110px; } /* Status */

th:nth-child(10),
td:nth-child(10) { width: 70px; }  /* Aksi */

</style>
