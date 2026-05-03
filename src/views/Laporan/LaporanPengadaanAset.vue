<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronDown, FileText } from 'lucide-vue-next'
import SearchIcon from '@/components/icons/SearchIcon.vue'
import 'primeicons/primeicons.css'
import { useAuthStore } from '@/stores/auth'

import { useLaporanPengadaanStore } from '@/stores/laporanPengadaan'

const store = useLaporanPengadaanStore()
const auth = useAuthStore()
const role = computed(() => auth.userRole)
/* ================= STATE & CONSTANTS ================= */
const q = ref('')
const statusFilter = ref('ALL')
const unitFilter = ref('Semua Unit')
const bulanFilter = ref('Bulan')
const tahunFilter = ref('Tahun')
const dateFrom = ref('')
const dateTo = ref('')
const kategoriFilter = ref('Kategori')

const sortKey = ref('')
const sortOrder = ref('asc')

const statuses = [
  { label: 'Status', value: 'ALL' },
  { label: 'DISETUJUI OLEH YAYASAN', value: 'DISETUJUI_YAYASAN' },
  { label: 'TIDAK DISETUJUI', value: 'DITOLAK' },
  { label: 'SUDAH DIBELI', value: 'DIBELI' },
  { label: 'DISETUJUI OLEH KEPSEK', value: 'DISETUJUI_KEPSEK' },
]


/* ================= DATA MAPPING & SORTING ================= */
const tableRows = computed(() => {
  let data = store.laporan.map((it) => ({
    waktuPengajuan: it.waktuPengajuan ?? '-',
    kode: it.idPengadaan
      ? `P${it.idPengadaan.toString().replace(/-/g, '').slice(0, 4).toUpperCase()}`
      : '-',
    nama: it.namaAset ?? '-',
    merk: it.merk ?? '-',
    qty: it.qty ?? 0,
    waktuPengadaan: it.waktuPengadaan ?? '',
    estimasiHarga: it.estimasiHarga ?? 0,
    kategori: it.kategoriAset ?? '-',
    unit: it.unit ?? '-',
    status: it.statusPengadaan ?? 'DIAJUKAN',
    bukti: it.buktiPembelian ?? '-',
    alasan: it.alasan ?? '-',
  }))

  if (sortKey.value) {
    data.sort((a, b) => {
      let aVal = (a as any)[sortKey.value]
      let bVal = (b as any)[sortKey.value]
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()

      if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })
  }
  return data
})

function formatDateTime(iso: string | null) {
  if (!iso) return '-'

  const d = new Date(iso)

  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
function formatRupiah(n: number | string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0))
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatStatus(s: string) {
  return s.replace(/_/g, ' ')
}

function formatKategori(k: string) {
  if (!k) return '-'
  return k.replace(/_/g, ' ')
}

function getSortIcon(column: string) {
  if (sortKey.value !== column) return 'pi-sort-alt unsorted'
  return sortOrder.value === 'asc' ? 'pi-sort-amount-up-alt active-sort' : 'pi-sort-amount-down active-sort'
}

/* ================= ACTIONS ================= */
function sortBy(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

function handleApplyFilter() {
  store.fetchLaporan({
    status: statusFilter.value === 'ALL' ? null : statusFilter.value,
    search: q.value,
    unit: unitFilter.value === 'Semua Unit' ? null : unitFilter.value
  })
}

function handleReset() {
  q.value = ''
  statusFilter.value = 'ALL'
  unitFilter.value = 'Semua Unit'
  bulanFilter.value = 'Bulan'
  tahunFilter.value = 'Tahun'
  dateFrom.value = ''
  dateTo.value = ''
  kategoriFilter.value = 'Kategori'
  handleApplyFilter()
}

onMounted(() => {
  store.fetchLaporan()
})


</script>

<template>
  <main class="page">
    <header class="header-section">
      <h1 class="title">Laporan Pengadaan Aset</h1>
      <p class="subtitle">Riwayat Pengadaan Aset</p>
    </header>

    <!-- Filter Card -->
    <section class="filter-card">
      <h3 class="filter-title">Filter Laporan</h3>
      <div class="filter-grid">
        <!-- Row 1 Filter -->
        <div class="filter-item">
          <label class="filter-label">Unit</label>
          <div class="custom-select">
            <select v-model="unitFilter">
              <option>Semua Unit</option>
            </select>
            <ChevronDown class="select-icon" />
          </div>
        </div>

        <div class="filter-item">
          <label class="filter-label">Periode</label>
          <div class="flex-row gap-8">
            <div class="custom-select flex-1">
              <select v-model="bulanFilter"><option>Bulan</option></select>
              <ChevronDown class="select-icon" />
            </div>
            <div class="custom-select flex-1">
              <select v-model="tahunFilter"><option>Tahun</option></select>
              <ChevronDown class="select-icon" />
            </div>
          </div>
        </div>

        <div class="filter-item">
          <label class="filter-label">From</label>
          <input type="date" v-model="dateFrom" class="custom-input" />
        </div>

        <div class="filter-item">
          <label class="filter-label">To</label>
          <input type="date" v-model="dateTo" class="custom-input" />
        </div>

        <div class="filter-item">
          <label class="filter-label">Kategori Aset</label>
          <div class="custom-select">
            <select v-model="kategoriFilter"><option>Kategori</option></select>
            <ChevronDown class="select-icon" />
          </div>
        </div>

        <div class="filter-item">
          <label class="filter-label">Status</label>
          <div class="custom-select">
            <select v-model="statusFilter">
              <option v-for="st in statuses" :key="st.value" :value="st.value">{{ st.label }}</option>
            </select>
            <ChevronDown class="select-icon" />
          </div>
        </div>

        <!-- Row 2 Filter (Search) -->
        <div class="filter-item search-wide">
          <label class="filter-label">Cari Aset</label>
          <div class="search-box">
            <SearchIcon class="search-icon" />
            <input
              v-model="q"
              type="text"
              placeholder="Kode, Nama, Merk, Alasan"
              @keyup.enter="handleApplyFilter"
            />
          </div>
        </div>
      </div>

      <div class="filter-actions">
        <button @click="handleApplyFilter" class="btn-apply">Terapkan Filter</button>
        <button @click="handleReset" class="btn-reset">Reset</button>
      </div>
    </section>

    <!-- Content Header -->
    <div class="table-header-row">
      <h2 class="table-section-title">Daftar Riwayat Pengajuan Pengadaan</h2>
      <button class="btn-export">
        <i class="pi pi-file-pdf"></i>
        Export PDF
      </button>
    </div>

    <!-- Table Section -->
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="w-100">Waktu Pengajuan</th>
            <th class="w-80">Kode</th>
            <th @click="sortBy('nama')" class="sortable w-120">
              <div class="th-inner">
                <span>Nama</span>
                <i class="sort-icon pi" :class="getSortIcon('nama')"></i>
              </div>
            </th>
            <th class="w-100">Merk</th>
            <th class="w-50">Qty</th>
            <th class="w-100">Tanggal Pengadaan</th>
            <th @click="sortBy('estimasiHarga')" class="sortable w-130">
              <div class="th-inner">
                <span>Estimasi Harga</span>
                <i class="sort-icon pi" :class="getSortIcon('estimasiHarga')"></i>
              </div>
            </th>
            <th class="w-120">Kategori</th>
            <th v-if="role === 'YAYASAN' || role === 'ADMIN'" class="w-80">
              Unit
            </th>
            <th class="w-130">Status</th>
            <th class="w-100">Bukti Pembelian</th>
            <th class="w-150">Alasan</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="store.loading">
            <td colspan="12" class="empty">Memuat data...</td>
          </tr>
          <tr v-else-if="tableRows.length === 0">
            <td colspan="12" class="empty">Belum ada data pengadaan</td>
          </tr>
          <tr v-for="row in tableRows" :key="row.kode" v-else>
            <td class="text-xs color-subtle">
              {{ formatDateTime(row.waktuPengajuan) }}
            </td>
            <td class="bold">{{ row.kode }}</td>
            <td>{{ row.nama }}</td>
            <td>{{ row.merk }}</td>
            <td class="center">{{ row.qty }}</td>
            <td>{{ formatDate(row.waktuPengadaan) }}</td>
            <td class="bold">{{ formatRupiah(row.estimasiHarga) }}</td>
            <td>{{ formatKategori(row.kategori) }}</td>
            <td v-if="role === 'YAYASAN' || role === 'ADMIN'">
              {{ row.unit }}
            </td>
            <td class="center">
              <span :class="['status-pill', row.status]">
                <span v-for="(word, i) in formatStatus(row.status).split(' ')" :key="i">
                  {{ word }}
                </span>
              </span>
            </td>
            <td class="center">
              <div v-if="row.bukti && row.bukti !== '-'" class="img-box">
                <img :src="`http://localhost:8080/uploads/bukti-pembelian/${row.bukti}`" />
              </div>
              <span v-else class="color-subtle">-</span>
            </td>
            <td class="text-xs">{{ row.alasan }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
.page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f8fafc;
  min-height: 100vh;
}

.header-section { margin-bottom: 2rem; }
.title { font-size: 1.875rem; font-weight: 800; color: #1e293b; margin-bottom: 0.25rem; }
.subtitle { color: #64748b; font-size: 1rem; }

/* ── Filter Card ── */
.filter-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  margin-bottom: 2rem;
}

.filter-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 1.25rem; }

.filter-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 160px;
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


/* search agak panjang */
.search-wide {
  flex: 2;
  min-width: 250px;
}
.filter-label { font-size: 0.75rem; font-weight: 600; color: #475569; }

/* Inputs & Selects */
.custom-select { position: relative; }
.custom-select select, .custom-input, .search-box input {
  width: 100%;
  padding: 0.625rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  outline: none;
  background: white;
  transition: all 0.2s;
}

.custom-select select { appearance: none; cursor: pointer; padding-right: 2.5rem; }
.select-icon { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); width: 1rem; color: #64748b; pointer-events: none; }

.search-box { position: relative; }
.search-box input { padding-left: 2.5rem; }
.search-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }

/* Buttons */
.filter-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
.btn-apply { background: #00588f; color: white; padding: 0.625rem 1.5rem; border-radius: 2rem; font-weight: 600; border: none; cursor: pointer; }
.btn-reset { background: white; color: #475569; padding: 0.625rem 1.5rem; border-radius: 2rem; border: 1px solid #d1d5db; font-weight: 600; cursor: pointer; }

/* ── Table Header ── */
.table-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.table-section-title { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
.btn-export { background: #e11d48; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }

/* ── Table Styling ── */
.table-wrapper { background: white; border-radius: 0.75rem; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
table { width: 100%; border-collapse: collapse; table-layout: auto; }
thead { background: #00588f; color: white; }
th { font-size: 0.7rem; font-weight: 600; padding: 1rem; text-align: center; text-transform: uppercase; letter-spacing: 0.025em; }
td { padding: 1rem; font-size: 0.75rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; word-wrap: break-word; }

.status-pill {
  padding: 0.375rem 0.75rem;
  border-radius: 1.25rem;
  font-size: 0.65rem;
  font-weight: 800;
  display: inline-flex;
  flex-direction: column; /* ini kuncinya */
  align-items: center;
  line-height: 1.1;
}

/* Status Colors (Pastel matching the image) */
.DISETUJUI_YAYASAN { background: #FFF4E5; color: #D97706; }
.DITOLAK { background: #FFE4E6; color: #E11D48; }
.DIBELI { background: #DCFCE7; color: #16A34A; }
.DISETUJUI_KEPSEK { background: #E0F2FE; color: #0284C7; }

.img-preview { width: 60px; height: 45px; border-radius: 0.375rem; overflow: hidden; border: 1px solid #e2e8f0; margin: 0 auto; }
.img-preview img { width: 100%; height: 100%; object-fit: cover; }

/* Utils */
.bold { font-weight: 700; }
.center { text-align: center; }
.color-subtle { color: #64748b; }
.text-xs { font-size: 0.7rem; }
.flex-row { display: flex; }
.gap-8 { gap: 0.5rem; }
.flex-1 { flex: 1; }
.empty { text-align: center; padding: 3rem; color: #94a3b8; }

/* Width Helpers */
.w-50 { width: 50px; }
.w-80 { width: 80px; }
.w-100 { width: 100px; }
.w-120 { width: 120px; }
.w-130 { width: 130px; }
.w-150 { width: 150px; }

.th-inner { display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; }
.sort-icon { font-size: 0.75rem; }
.unsorted { opacity: 0.3; }
</style>
