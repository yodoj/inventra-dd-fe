<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import SearchIcon from '@/components/icons/SearchIcon.vue'
import EditIcon from '@/components/icons/EditIcon.vue'
import { ChevronDown } from 'lucide-vue-next'
import 'primeicons/primeicons.css'

import { useTinjauPengadaanStore } from '@/stores/tinjauPengadaanStore'
import { useAuthStore } from '@/stores/auth'

type TableRow = {
  idPengadaan: string
  namaPengaju: string
  rolePengaju: string
  unitPengaju: string
  gambar: string
  nama: string
  merk: string
  qty: number
  tanggal: string
  harga: number
  alasan: string
  namaReviewer: string
  reviewerRole: string
  tanggalReview: string | null
  statusPengadaan: string
  kepsekFirstReviewedAt: string | null
  yayasanFirstReviewedAt: string | null
}

const auth = useAuthStore()
const role = computed(() => auth.userRole)

const store = useTinjauPengadaanStore()
const router = useRouter()

const q = ref('')
const statusFilter = ref('ALL')
const sortKey = ref('')
const sortOrder = ref('asc')

const statuses = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Diajukan', value: 'DIAJUKAN' },
  { label: 'Disetujui oleh Kepsek', value: 'DISETUJUI_KEPSEK' },
  { label: 'Disetujui oleh Yayasan', value: 'DISETUJUI_YAYASAN' },
  { label: 'Ditolak', value: 'DITOLAK' },
  { label: 'Dibeli', value: 'DIBELI' },
]

function getSortIcon(column: string) {
  if (sortKey.value !== column) return 'pi-sort-alt unsorted'
  return sortOrder.value === 'asc'
    ? 'pi-sort-amount-up-alt active-sort'
    : 'pi-sort-amount-down active-sort'
}

function sortBy(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

function getStatusClass(statusPengadaan: string) {
  const map: Record<string, string> = {
    DIAJUKAN: 'status-diajukan',
    DISETUJUI_KEPSEK: 'status-kepsek',
    DISETUJUI_YAYASAN: 'status-yayasan',
    DITOLAK: 'status-ditolak',
    DIBELI: 'status-yayasan',
  }
  return map[statusPengadaan] || ''
}

function formatStatus(statusPengadaan: string) {
  return String(statusPengadaan || '').replace(/_/g, ' ')
}

function formatRole(role: string) {
  if (!role) return ''
  const r = String(role).toLowerCase()
  if (r === 'kepsek') return 'Kepsek'
  if (r === 'yayasan') return 'Yayasan'
  return role
}

function formatDate(isoOrDate: string | null) {
  if (!isoOrDate) return '-'
  const d = String(isoOrDate).slice(0, 10)
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatRupiah(n: number | string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0))
}

async function fetchAll() {
  try {
    await store.fetchAll({
      status_pengadaan: statusFilter.value === 'ALL' ? null : statusFilter.value,
      search: q.value || null,
    })
  } catch (e) {
    console.error(e)
  }
}

const handleApplyFilter = () => {
  fetchAll()
}

const handleReset = () => {
  q.value = ''
  statusFilter.value = 'ALL'
  fetchAll()
}

onMounted(fetchAll)

const tableRows = computed(() => {
  const data = store.items.map((it) => ({
    idPengadaan: it.idPengadaan ?? 0,
    namaPengaju: it.namaPengaju ?? '-',
    unitPengaju: it.unitPengaju ?? '-',
    rolePengaju: it.rolePengaju ?? '-',
    gambar: it.linkGambar ?? '',
    nama: it.namaAset ?? '',
    merk: it.merk ?? '',
    qty: it.qty ?? 0,
    tanggal: it.waktuPengadaan ?? '',
    harga: it.estimasiHarga ?? 0,
    alasan: it.alasan ?? '-',
    namaReviewer: it.namaReviewer ?? '-',
    reviewerRole: it.reviewerRole ?? '-',
    tanggalReview: it.updatedAt ?? null,
    statusPengadaan: it.statusPengadaan ?? 'DIAJUKAN',
    kepsekFirstReviewedAt: it.kepsekFirstReviewedAt ?? null,
    yayasanFirstReviewedAt: it.yayasanFirstReviewedAt ?? null,
  }))

  if (sortKey.value) {
    data.sort((a, b) => {
      let aVal = (a as Record<string, unknown>)[sortKey.value] ?? ''
      let bVal = (b as Record<string, unknown>)[sortKey.value] ?? ''

      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()

      if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })
  }

  return data
})

function withinDays(fromISO: string | null, days = 2) {
  if (!fromISO) return false
  const from = new Date(fromISO).getTime()
  const now = Date.now()
  const diffDays = (now - from) / (1000 * 60 * 60 * 24)
  return diffDays <= days
}

function selectAndGoCreate(row: TableRow) {
  const id = row.idPengadaan
  if (!id) return
  store.selectPengadaan(Number(id))
  router.push(`/pengadaan/pengajuan/tinjau/${id}`)
}

function selectAndGoEdit(row: TableRow) {
  const id = row.idPengadaan
  if (!id) return
  store.selectPengadaan(Number(id))
  router.push(`/pengadaan/pengajuan/tinjau/update/${id}`)
}

function selectAndGoBeli(row: TableRow) {
  const id = row.idPengadaan
  if (!id) return
  store.selectPengadaan(Number(id))
  router.push(`/pengadaan/pengajuan/tinjau/bukti/${id}`)
}

function getActionType(row: TableRow) {
  const r = role.value
  const status = row.statusPengadaan
  const yayasanSudahReview = !!row.yayasanFirstReviewedAt
  const kepsekSudahReview = !!row.kepsekFirstReviewedAt

  if (r === 'YAYASAN') {
    const actions = []
    if (status === 'DISETUJUI_KEPSEK' && !yayasanSudahReview) actions.push('CREATE')
    if (status === 'DISETUJUI_YAYASAN') actions.push('BELI')
    if (yayasanSudahReview && status !== 'DIBELI') {
      if (withinDays(row.yayasanFirstReviewedAt, 2)) actions.push('EDIT')
    }
    return actions.length > 0 ? actions : ['NONE']
  }

  if (r === 'KEPSEK') {
    if (status === 'DIAJUKAN' && !kepsekSudahReview) return ['CREATE']
    if (!yayasanSudahReview && kepsekSudahReview) {
      if (
        (status === 'DITOLAK' || status === 'DISETUJUI_KEPSEK') &&
        withinDays(row.kepsekFirstReviewedAt, 2)
      ) {
        return ['EDIT']
      }
    }
  }

  return ['NONE']
}
</script>

<template>
  <main class="page">
    <h1 class="title">Peninjauan Pengajuan Pengadaan Aset</h1>

    <!-- FILTER CARD -->
    <div class="filter-card mb-20">
      <h3 class="filter-title">Filter Pengajuan</h3>
      <div class="filter-grid">
        <!-- Status Dropdown -->
        <div class="filter-item">
          <label class="filter-label">Status Pengajuan</label>
          <div class="custom-select">
            <select v-model="statusFilter" :class="{ 'placeholder-color': statusFilter === 'ALL' }">
              <option v-for="st in statuses" :key="st.value" :value="st.value">{{ st.label }}</option>
            </select>
            <ChevronDown class="select-icon" />
          </div>
        </div>

        <!-- Search Input -->
        <div class="filter-item flex-grow">
          <label class="filter-label">Cari Pengajuan</label>
          <div class="search-box">
            <SearchIcon class="search-icon" />
            <input
              v-model="q"
              type="text"
              placeholder="Cari nama pengaju, nama aset, atau merk"
              @keyup.enter="handleApplyFilter"
            />
          </div>
        </div>
      </div>

      <div class="filter-actions">
        <button @click="handleApplyFilter" class="btn-apply">Terapkan Filter</button>
        <button @click="handleReset" class="btn-reset">Reset</button>
      </div>
    </div>

    <!-- TABLE -->
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
            <th>Alasan &amp; Riwayat Review</th>
            <th @click="sortBy('statusPengadaan')">Status</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in tableRows" :key="row.idPengadaan">
            <td>
              <div class="pengaju-wrapper">
                <div class="bold">{{ row.namaPengaju }}</div>
                <div class="role-text">{{ row.rolePengaju }} {{ row.unitPengaju }}</div>
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
                  Terakhir direview oleh <span class="highlight">{{ row.namaReviewer }}</span> ({{
                    formatRole(row.reviewerRole)
                  }}) pada <span class="highlight">{{ formatDate(row.tanggalReview) }}</span>
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

          <tr v-if="tableRows.length === 0">
            <td colspan="10" class="empty">
              {{
                statusFilter !== 'ALL' && tableRows.length === 0
                  ? 'Tidak ada pengajuan dengan status tersebut'
                  : q
                    ? 'Tidak ada pengajuan dengan keyword tersebut'
                    : 'Tidak ada data ditemukan'
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
.page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
}

/* ── Filter Card ── */
.filter-card {
  background: white;
  padding: 24px 28px 20px;
  border-radius: 16px;
  border: 1px solid #eeeeee;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.filter-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #111827;
}

.filter-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-item.flex-grow {
  flex: 1;
  min-width: 240px;
}

.filter-label {
  font-size: 12px;
  color: #374151;
  margin-bottom: 8px;
  font-weight: 500;
}

/* Custom Select */
.custom-select {
  position: relative;
  min-width: 220px;
}

.custom-select select {
  width: 100%;
  padding: 11px 40px 11px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  outline: none;
  appearance: none;
  color: #111827;
  cursor: pointer;
}

.custom-select select:focus {
  border-color: rgba(0, 88, 143, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 88, 143, 0.1);
}

.placeholder-color {
  color: #9ca3af !important;
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  pointer-events: none;
  color: #6b7280;
}

/* Search Box */
.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 11px 16px 11px 40px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  color: #111827;
  box-sizing: border-box;
}

.search-box input:focus {
  border-color: rgba(0, 88, 143, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 88, 143, 0.1);
}

.search-box input::placeholder {
  color: #9ca3af;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

/* Filter Actions */
.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.btn-apply {
  background-color: #00588f;
  color: white;
  padding: 10px 28px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 88, 143, 0.2);
  transition: background 0.2s;
}

.btn-apply:hover {
  background-color: #004a78;
}

.btn-reset {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 10px 28px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-reset:hover {
  background-color: #f9fafb;
}

/* ── Table ── */
.table-wrapper {
  background: white;
  border-radius: 12px;
  border: 1px solid #eeeeee;
  overflow-x: auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

table {
  width: 100%;
  min-width: 1000px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

thead {
  background: #00588f;
  color: white;
}

th {
  font-weight: 500;
  font-size: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  text-align: center;
  cursor: pointer;
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
  background-color: #f0f7ff;
  cursor: pointer;
  transition: background-color 0.2s ease;
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
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.6px;
}

.status-diajukan { background: #F8FDD0; color: #9C9A23; }
.status-kepsek   { background: #ecf8fd; color: #1fa2ff; }
.status-yayasan  { background: #ffeed9; color: #aa5b00; }
.status-ditolak  { background: #fbe5e6; color: #dc3545; }

.empty {
  text-align: center;
  padding: 20px;
  color: #777;
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
  cursor: pointer;
}

.edit-btn   { background: #00588f; color: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
.review-btn { background: #198754; color: white; }
.buy-btn    { background: #ff9800; color: white; box-shadow: 0 2px 6px rgba(255,152,0,0.3); }

.edit-btn:hover  { background: #244d7a; transform: translateY(-1px); }
.buy-btn:hover   { background: #e68a00; transform: translateY(-1px); }

.no-action-text {
  color: #9ca3af;
  font-size: 11px;
  font-style: italic;
}

.sortable { cursor: pointer; user-select: none; }

.sort-icon { flex: 0 0 auto; font-size: 12px; transition: 0.2s ease; }
.unsorted  { color: #cbd5e1; }
.active-sort { color: #ffffff; }

.alasan-wrapper { display: flex; flex-direction: column; min-height: 40px; }
.alasan-main    { margin-bottom: 16px; word-break: normal; }
.date-column span { display: block; max-width: 100%; word-break: normal; }

.reviewer-info {
  font-size: 10px;
  color: #64748b;
  font-style: italic;
  border-top: 1px dashed #e2e8f0;
  padding-top: 4px;
  line-height: 1.4;
}

.highlight { font-weight: 600; color: #00588f; }

.pengaju-wrapper { display: flex; flex-direction: column; gap: 2px; }
.role-text { font-size: 10px; color: #94a3b8; font-weight: 400; text-transform: uppercase; }

th:nth-child(1), td:nth-child(1) { width: 110px; }
th:nth-child(2), td:nth-child(2) { width: 90px; }
th:nth-child(3), td:nth-child(3) { width: 140px; }
th:nth-child(4), td:nth-child(4) { width: 80px; }
th:nth-child(5), td:nth-child(5) { width: 45px; }
th:nth-child(6), td:nth-child(6) { width: 90px; }
th:nth-child(7), td:nth-child(7) { width: 110px; }
th:nth-child(8), td:nth-child(8) { width: 220px; }
th:nth-child(9), td:nth-child(9) { width: 110px; }
th:nth-child(10), td:nth-child(10) { width: 70px; }
</style>
