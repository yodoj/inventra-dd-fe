<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, X } from 'lucide-vue-next'
import SearchIcon from '@/components/icons/SearchIcon.vue'
import 'primeicons/primeicons.css'
import { useAuthStore } from '@/stores/auth'
import { useLaporanPengadaanStore } from '@/stores/laporanPengadaan'
import { laporanPengadaanService } from '@/services/laporanPengadaanService'
import type { LaporanFilterParams } from '@/interfaces/laporanPengadaan'

const store = useLaporanPengadaanStore()
const auth = useAuthStore()
const role = computed(() => auth.userRole?.toUpperCase())
const isAdminOrYayasan = computed(() => role.value === 'YAYASAN' || role.value === 'ADMIN' || role.value === 'SUPERADMIN')

/* ── Filter State ── */
const q = ref('')
const statusFilter = ref('')
const unitFilter = ref('')
const bulanFilter = ref<number | ''>('')
const tahunFilter = ref<number | ''>('')
const dateFrom = ref('')
const dateTo = ref('')
const kategoriFilter = ref('')

/* ── Preview modal ── */
const previewUrl = ref<string | null>(null)

/* ── Constants ── */
const now = new Date()
const currentYear = now.getFullYear()
const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i)

const bulanNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const statuses = [
  { label: 'Semua Status', value: '' },
  { label: 'Diajukan', value: 'DIAJUKAN' },
  { label: 'Disetujui oleh Kepsek', value: 'DISETUJUI_KEPSEK' },
  { label: 'Disetujui oleh Yayasan', value: 'DISETUJUI_YAYASAN' },
  { label: 'Tidak Disetujui', value: 'DITOLAK' },
  { label: 'Sudah Dibeli', value: 'DIBELI' },
]

const kategoriList = [
  { label: 'Semua Kategori', value: '' },
  { label: 'Ruang Kelas', value: 'RUANG_KELAS' },
  { label: 'Ruang Non Kelas', value: 'RUANG_NON_KELAS' },
  { label: 'Barang Habis Pakai', value: 'BARANG_HABIS_PAKAI' },
  { label: 'Barang Tidak Habis Pakai', value: 'BARANG_TIDAK_HABIS_PAKAI' },
]

const unitList = ['KB-TK', 'SD', 'SMP', 'SMA']

const pad = (n: number) => String(n).padStart(2, '0')

/* ── Auto-set From/To saat Bulan+Tahun keduanya dipilih ── */
watch([bulanFilter, tahunFilter], ([bulan, tahun]) => {
  if (bulan && tahun) {
    const y = Number(tahun)
    const m = Number(bulan)
    // Gunakan string formatting agar tidak terkena UTC shift di timezone +7
    const lastDay = new Date(y, m, 0).getDate()
    dateFrom.value = `${y}-${pad(m)}-01`
    dateTo.value = `${y}-${pad(m)}-${pad(lastDay)}`
  } else if (tahun && !bulan) {
    dateFrom.value = `${tahun}-01-01`
    dateTo.value = `${tahun}-12-31`
  } else {
    // hanya bulan (tanpa tahun) → kosongkan from/to, kirim bulan ke BE langsung
    dateFrom.value = ''
    dateTo.value = ''
  }
})

/* ── Saat From/To diisi manual, kosongkan bulan/tahun ── */
function onFromToChange() {
  bulanFilter.value = ''
  tahunFilter.value = ''
}

/* ── Active filter check (untuk empty state message) ── */
const hasActiveFilters = computed(() =>
  !!(q.value || statusFilter.value || kategoriFilter.value || unitFilter.value
     || bulanFilter.value || tahunFilter.value || dateFrom.value || dateTo.value),
)

/* ── Build filter params ── */
function buildParams(): LaporanFilterParams {
  const hasFromTo = !!(dateFrom.value || dateTo.value)
  return {
    search: q.value.replace(/\s+/g, '').toLowerCase() || null,
    status: statusFilter.value || null,
    kategori: kategoriFilter.value || null,
    unit: isAdminOrYayasan.value ? (unitFilter.value || null) : null,
    // kirim bulan/tahun langsung ke BE hanya jika from/to tidak aktif (hindari double-filter)
    bulan: !hasFromTo && bulanFilter.value !== '' ? Number(bulanFilter.value) : null,
    tahun: !hasFromTo && tahunFilter.value !== '' ? Number(tahunFilter.value) : null,
    from: dateFrom.value || null,
    to: dateTo.value || null,
    sortBy: store.sortBy,
    direction: store.direction,
  }
}

/* ── Actions ── */
function handleApplyFilter() {
  store.currentPage = 0
  store.fetchLaporan(buildParams())
}

function handleReset() {
  // Reset = clear semua filter → tampil semua data (UX standard)
  q.value = ''
  statusFilter.value = ''
  unitFilter.value = ''
  kategoriFilter.value = ''
  bulanFilter.value = ''
  tahunFilter.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  // Reset sort ke default (PBI-65)
  store.sortBy = 'waktuPengajuan'
  store.direction = 'DESC'
  store.currentPage = 0
  store.fetchLaporan(buildParams())
}

/* ── Sort ── */
// 'harga' comes from the TinjauPengadaan JOIN — can't be used as a Pageable sort field on the
// PengadaanAset entity. Handle it client-side (current-page only).
const CLIENT_SIDE_SORT_FIELDS = ['harga']

function toggleSort(field: string) {
  if (CLIENT_SIDE_SORT_FIELDS.includes(field)) {
    // harga (client-side, current page only): 2-state ASC ↔ DESC
    if (store.sortBy === field) {
      store.direction = store.direction === 'ASC' ? 'DESC' : 'ASC'
    } else {
      store.sortBy = field
      store.direction = 'ASC'
    }
    return
  }
  // Server-side: 3-state cycle default → ASC → DESC → default (PBI-65)
  if (store.sortBy !== field) {
    store.sortBy = field
    store.direction = 'ASC'
  } else if (store.direction === 'ASC') {
    store.direction = 'DESC'
  } else {
    // DESC → default
    store.sortBy = 'waktuPengajuan'
    store.direction = 'DESC'
  }
  store.currentPage = 0
  store.fetchLaporan(buildParams())
}

/* ── Pagination ── */
function prevPage() {
  if (store.currentPage > 0) {
    store.currentPage--
    store.fetchLaporan(buildParams())
  }
}

function nextPage() {
  if (store.currentPage < store.totalPages - 1) {
    store.currentPage++
    store.fetchLaporan(buildParams())
  }
}

watch(() => store.pageSize, () => {
  store.currentPage = 0
  store.fetchLaporan(buildParams())
})

const startItem = computed(() =>
  store.totalElements === 0 ? 0 : store.currentPage * store.pageSize + 1,
)
const endItem = computed(() =>
  Math.min((store.currentPage + 1) * store.pageSize, store.totalElements),
)

/* ── Table rows ── */
const mappedRows = computed(() =>
  store.laporan.map((it) => ({
    waktuPengajuan: it.waktu_pengajuan ?? null,
    namaPengaju: it.nama_pengaju ?? '-',
    nama: it.nama_aset ?? '-',
    merk: it.merk ?? '-',
    qty: it.qty ?? 0,
    waktuPengadaan: it.tanggal_pengadaan ?? null,
    estimasiHarga: it.estimasi_harga ?? 0,
    hargaAktual: it.harga_aktual ?? null,
    kategori: it.kategori_aset ?? '-',
    unit: it.unit ?? '-',
    status: it.status_pengajuan ?? 'DIAJUKAN',
    bukti: it.bukti_pembelian ?? null,
    alasan: it.alasan ?? '-',
  })),
)

const tableRows = computed(() => {
  if (store.sortBy === 'harga') {
    const mult = store.direction === 'ASC' ? 1 : -1
    return [...mappedRows.value].sort((a, b) => {
      const av = a.hargaAktual ?? -Infinity
      const bv = b.hargaAktual ?? -Infinity
      return (av - bv) * mult
    })
  }
  return mappedRows.value
})

/* ── Format helpers ── */
function formatDateTime(iso: string | null) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatRupiah(n: number | null) {
  if (n === null || n === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso: string | null) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatKategori(k: string) {
  if (!k || k === '-') return '-'
  return k.replace(/_/g, ' ')
}

const statusLabel: Record<string, string> = {
  DIAJUKAN: 'Diajukan',
  DISETUJUI_KEPSEK: 'Disetujui Kepsek',
  DISETUJUI_YAYASAN: 'Disetujui Yayasan',
  DITOLAK: 'Tidak Disetujui',
  DIBELI: 'Sudah Dibeli',
}

/* ── Animated search placeholder ── */
const searchPlaceholders = [
  'Cari nama aset...',
  'Cari nama pengaju...',
  'Cari merk...',
  'Cari alasan...',
]
const phIdx = ref(0)
const phFading = ref(false)
const searchPlaceholder = computed(() => searchPlaceholders[phIdx.value])
let phTimer: ReturnType<typeof setInterval>

/* ── Export PDF ── */
const exportLoading = ref(false)
const exportError = ref<string | null>(null)
let exportErrorTimer: ReturnType<typeof setTimeout> | null = null

async function handleExportPDF() {
  exportLoading.value = true
  exportError.value = null
  try {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const data = await laporanPengadaanService.getAllLaporanForExport(buildParams())

    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text('Laporan Pengadaan Aset', 14, 15)
    doc.setFontSize(9)
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 22)

    const head = isAdminOrYayasan.value
      ? [['Waktu Pengajuan', 'Nama Pengaju', 'Nama Aset', 'Merk', 'Qty', 'Tgl Pengadaan', 'Est. Harga', 'Harga Aktual', 'Kategori', 'Unit', 'Status', 'Alasan']]
      : [['Waktu Pengajuan', 'Nama Pengaju', 'Nama Aset', 'Merk', 'Qty', 'Tgl Pengadaan', 'Est. Harga', 'Harga Aktual', 'Kategori', 'Status', 'Alasan']]

    const body = data.map((it) => {
      const base = [
        formatDateTime(it.waktu_pengajuan),
        it.nama_pengaju ?? '-',
        it.nama_aset ?? '-',
        it.merk ?? '-',
        String(it.qty ?? 0),
        formatDate(it.tanggal_pengadaan),
        formatRupiah(it.estimasi_harga),
        formatRupiah(it.harga_aktual),
        formatKategori(it.kategori_aset ?? '-'),
      ]
      if (isAdminOrYayasan.value) base.push(it.unit ?? '-')
      base.push(statusLabel[it.status_pengajuan] ?? it.status_pengajuan, it.alasan ?? '-')
      return base
    })

    autoTable(doc, { head, body, startY: 28, styles: { fontSize: 7 }, headStyles: { fillColor: [0, 88, 143] } })

    // Filename: laporan-pengadaan-YYYYMMDD.pdf (PBI-66)
    const today = new Date()
    const yyyymmdd = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`
    doc.save(`laporan-pengadaan-${yyyymmdd}.pdf`)
  } catch (err: any) {
    console.error('Export PDF gagal:', err)
    exportError.value = `Gagal mengunduh PDF: ${err?.message || 'unknown error'}`
    if (exportErrorTimer) clearTimeout(exportErrorTimer)
    exportErrorTimer = setTimeout(() => { exportError.value = null }, 6000)
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  store.fetchLaporan({})
  phTimer = setInterval(() => {
    phFading.value = true
    setTimeout(() => {
      phIdx.value = (phIdx.value + 1) % searchPlaceholders.length
      phFading.value = false
    }, 250)
  }, 2500)
})

onUnmounted(() => clearInterval(phTimer))
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

        <!-- Unit — hanya YAYASAN/ADMIN -->
        <div v-if="isAdminOrYayasan" class="filter-item">
          <label class="filter-label">Unit</label>
          <div class="custom-select">
            <select v-model="unitFilter">
              <option value="">Semua Unit</option>
              <option v-for="u in unitList" :key="u" :value="u">{{ u }}</option>
            </select>
            <ChevronDown class="select-icon" />
          </div>
        </div>

        <!-- Periode: Bulan + Tahun -->
        <div class="filter-item">
          <label class="filter-label">Periode</label>
          <div class="flex-row gap-8">
            <div class="custom-select flex-1">
              <select v-model="bulanFilter">
                <option value="">Bulan</option>
                <option v-for="(name, idx) in bulanNames" :key="idx + 1" :value="idx + 1">{{ name }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
            <div class="custom-select flex-1">
              <select v-model="tahunFilter">
                <option value="">Tahun</option>
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>
        </div>

        <!-- From -->
        <div class="filter-item">
          <label class="filter-label">From</label>
          <input type="date" v-model="dateFrom" class="custom-input" @change="onFromToChange" />
        </div>

        <!-- To -->
        <div class="filter-item">
          <label class="filter-label">To</label>
          <input type="date" v-model="dateTo" class="custom-input" @change="onFromToChange" />
        </div>

        <!-- Kategori -->
        <div class="filter-item">
          <label class="filter-label">Kategori Aset</label>
          <div class="custom-select">
            <select v-model="kategoriFilter">
              <option v-for="k in kategoriList" :key="k.value" :value="k.value">{{ k.label }}</option>
            </select>
            <ChevronDown class="select-icon" />
          </div>
        </div>

        <!-- Status -->
        <div class="filter-item">
          <label class="filter-label">Status</label>
          <div class="custom-select">
            <select v-model="statusFilter">
              <option v-for="st in statuses" :key="st.value" :value="st.value">{{ st.label }}</option>
            </select>
            <ChevronDown class="select-icon" />
          </div>
        </div>

        <!-- Search -->
        <div class="filter-item search-wide">
          <label class="filter-label">Pencarian</label>
          <div class="search-box">
            <SearchIcon class="search-icon" />
            <input
              v-model="q"
              type="text"
              :placeholder="searchPlaceholder"
              :class="{ 'ph-fading': phFading }"
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

    <!-- Table Header -->
    <div class="table-header-row">
      <h2 class="table-section-title">Daftar Riwayat Pengajuan Pengadaan</h2>
      <button class="btn-export" @click="handleExportPDF" :disabled="exportLoading">
        <i class="pi pi-file-pdf"></i>
        {{ exportLoading ? 'Mengekspor...' : 'Export PDF' }}
      </button>
    </div>

    <!-- Export Error Banner -->
    <div v-if="exportError" class="error-banner" role="alert">
      <span><i class="pi pi-exclamation-triangle"></i> {{ exportError }}</span>
      <button class="banner-close" @click="exportError = null" aria-label="Tutup">
        <X class="icon-sm" />
      </button>
    </div>

    <!-- Table -->
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th class="w-100">Waktu Pengajuan</th>
            <th class="w-110">Nama Pengaju</th>
            <th @click="toggleSort('namaAset')" class="sortable w-120">
              <div class="th-inner">
                <span>Nama Aset</span>
                <ArrowUp v-if="store.sortBy === 'namaAset' && store.direction === 'ASC'" class="sort-icon" />
                <ArrowDown v-else-if="store.sortBy === 'namaAset' && store.direction === 'DESC'" class="sort-icon" />
                <ArrowUpDown v-else class="sort-icon unsorted" />
              </div>
            </th>
            <th class="w-100">Merk</th>
            <th class="w-50">Qty</th>
            <th class="w-100">Tanggal Pengadaan</th>
            <th @click="toggleSort('estimasiHarga')" class="sortable w-130">
              <div class="th-inner">
                <span>Estimasi Harga</span>
                <ArrowUp v-if="store.sortBy === 'estimasiHarga' && store.direction === 'ASC'" class="sort-icon" />
                <ArrowDown v-else-if="store.sortBy === 'estimasiHarga' && store.direction === 'DESC'" class="sort-icon" />
                <ArrowUpDown v-else class="sort-icon unsorted" />
              </div>
            </th>
            <th @click="toggleSort('harga')" class="sortable w-120">
              <div class="th-inner">
                <span>Harga Aktual</span>
                <ArrowUp v-if="store.sortBy === 'harga' && store.direction === 'ASC'" class="sort-icon" />
                <ArrowDown v-else-if="store.sortBy === 'harga' && store.direction === 'DESC'" class="sort-icon" />
                <ArrowUpDown v-else class="sort-icon unsorted" />
              </div>
            </th>
            <th class="w-120">Kategori</th>
            <th v-if="isAdminOrYayasan" class="w-80">Unit</th>
            <th class="w-130">Status</th>
            <th class="w-100">Bukti Pembelian</th>
            <th class="w-150">Alasan</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="store.loading">
            <td colspan="13" class="empty">Memuat data...</td>
          </tr>
          <tr v-else-if="store.error">
            <td colspan="13" class="empty error-state">{{ store.error }}</td>
          </tr>
          <tr v-else-if="tableRows.length === 0">
            <td colspan="13" class="empty">
              {{ hasActiveFilters ? 'Data tidak ditemukan' : 'Belum ada data pengadaan' }}
            </td>
          </tr>
          <tr v-for="(row, i) in tableRows" :key="i" v-else>
            <td class="text-xs color-subtle">{{ formatDateTime(row.waktuPengajuan) }}</td>
            <td>{{ row.namaPengaju }}</td>
            <td>{{ row.nama }}</td>
            <td>{{ row.merk }}</td>
            <td class="center">{{ row.qty }}</td>
            <td>{{ formatDate(row.waktuPengadaan) }}</td>
            <td class="bold">{{ formatRupiah(row.estimasiHarga) }}</td>
            <td>{{ formatRupiah(row.hargaAktual) }}</td>
            <td>{{ formatKategori(row.kategori) }}</td>
            <td v-if="isAdminOrYayasan">{{ row.unit }}</td>
            <td class="center">
              <span :class="['status-pill', row.status]">
                {{ statusLabel[row.status] ?? row.status }}
              </span>
            </td>
            <td class="center">
              <div
                v-if="row.bukti"
                class="img-box"
                @click="previewUrl = `http://localhost:8080/uploads/bukti-pembelian/${row.bukti}`"
              >
                <img
                  :src="`http://localhost:8080/uploads/bukti-pembelian/${row.bukti}`"
                  @error="(e: Event) => ((e.target as HTMLElement).closest('.img-box')!.innerHTML = '<span class=\'color-subtle\'>-</span>')"
                />
              </div>
              <span v-else class="color-subtle">-</span>
            </td>
            <td class="text-xs">{{ row.alasan }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-row">
      <div class="pagination-info">
        <span class="info-text">{{ startItem }}–{{ endItem }} of {{ store.totalElements }} items</span>
        <div class="page-size-wrap">
          <span class="info-text">Per halaman:</span>
          <div class="custom-select size-select">
            <select v-model="store.pageSize">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="25">25</option>
            </select>
            <ChevronDown class="select-icon" />
          </div>
        </div>
      </div>
      <div class="pagination-btns">
        <button @click="prevPage" :disabled="store.currentPage <= 0" class="btn-page">
          <ChevronLeft class="icon-sm" /> Previous
        </button>
        <button @click="nextPage" :disabled="store.currentPage >= store.totalPages - 1" class="btn-page">
          Next <ChevronRight class="icon-sm" />
        </button>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <div v-if="previewUrl" class="modal-overlay" @click.self="previewUrl = null">
      <div class="modal-box">
        <button class="modal-close" @click="previewUrl = null"><X /></button>
        <img :src="previewUrl" class="modal-img" />
      </div>
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
.filter-grid { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; }
.filter-item { display: flex; flex-direction: column; gap: 0.4rem; min-width: 160px; }
.search-wide { flex: 2; min-width: 250px; }
.filter-label { font-size: 0.75rem; font-weight: 600; color: #475569; }

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
.search-box input::placeholder { transition: opacity 0.25s ease; }
.search-box input.ph-fading::placeholder { opacity: 0; }
.search-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }

.filter-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
.btn-apply { background: #00588f; color: white; padding: 0.625rem 1.5rem; border-radius: 2rem; font-weight: 600; border: none; cursor: pointer; }
.btn-reset { background: white; color: #475569; padding: 0.625rem 1.5rem; border-radius: 2rem; border: 1px solid #d1d5db; font-weight: 600; cursor: pointer; }

/* ── Table Header ── */
.table-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.table-section-title { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
.btn-export {
  background: #e11d48; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem;
  border: none; font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;
}
.btn-export:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Export Error Banner ── */
.error-banner {
  background: #FEE2E2;
  color: #991B1B;
  border: 1px solid #FCA5A5;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  animation: slideDown 0.25s ease;
}
.error-banner i { margin-right: 0.5rem; }
.banner-close {
  background: none; border: none; color: inherit;
  cursor: pointer; display: flex; align-items: center;
  padding: 0.25rem; border-radius: 0.25rem;
}
.banner-close:hover { background: rgba(153, 27, 27, 0.1); }
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Table ── */
.table-wrapper { background: white; border-radius: 0.75rem; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
table { width: 100%; border-collapse: collapse; table-layout: auto; }
thead { background: #00588f; color: white; }
th { font-size: 0.7rem; font-weight: 600; padding: 1rem; text-align: center; text-transform: uppercase; letter-spacing: 0.025em; }
td { padding: 1rem; font-size: 0.75rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; word-wrap: break-word; }

.th-inner { display: flex; align-items: center; justify-content: center; gap: 0.4rem; cursor: pointer; user-select: none; }
.sort-icon { width: 0.85rem; height: 0.85rem; flex-shrink: 0; }
.unsorted { opacity: 0.35; }
.sortable:hover { background: #004f80; }

/* ── Status Badges ── */
.status-pill {
  padding: 0.3rem 0.65rem;
  border-radius: 1.25rem;
  font-size: 0.65rem;
  font-weight: 700;
  display: inline-block;
  white-space: nowrap;
}
.DIAJUKAN { background: #F3F4F6; color: #4B5563; }
.DISETUJUI_KEPSEK { background: #E0F2FE; color: #0284C7; }
.DISETUJUI_YAYASAN { background: #FFF4E5; color: #D97706; }
.DITOLAK { background: #FFE4E6; color: #E11D48; }
.DIBELI { background: #DCFCE7; color: #16A34A; }

/* ── Bukti Pembelian ── */
.img-box {
  width: 80px; height: 60px; overflow: hidden;
  border-radius: 8px; border: 1px solid #eee;
  cursor: pointer; margin: 0 auto;
  transition: opacity 0.15s;
}
.img-box:hover { opacity: 0.8; }
.img-box img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* ── Pagination ── */
.pagination-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 1.25rem; flex-wrap: wrap; gap: 0.75rem;
}
.pagination-info { display: flex; align-items: center; gap: 1rem; }
.info-text { font-size: 0.8rem; color: #64748b; }
.page-size-wrap { display: flex; align-items: center; gap: 0.5rem; }
.size-select { min-width: 70px; }
.size-select select { padding: 0.35rem 2rem 0.35rem 0.6rem; font-size: 0.8rem; border-radius: 0.5rem; }
.pagination-btns { display: flex; gap: 0.5rem; }
.btn-page {
  display: flex; align-items: center; gap: 0.25rem;
  padding: 0.4rem 0.9rem; border: 1px solid #d1d5db; border-radius: 0.5rem;
  background: white; font-size: 0.8rem; font-weight: 600; color: #374151; cursor: pointer;
  transition: background 0.15s;
}
.btn-page:hover:not(:disabled) { background: #f1f5f9; }
.btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
.icon-sm { width: 1rem; height: 1rem; }

/* ── Preview Modal ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgb(0 0 0 / 0.65);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-box { position: relative; max-width: 90vw; max-height: 90vh; }
.modal-close {
  position: absolute; top: -2rem; right: 0; background: none; border: none;
  color: white; cursor: pointer; width: 1.5rem; height: 1.5rem;
}
.modal-img { max-width: 90vw; max-height: 85vh; border-radius: 0.5rem; display: block; }

/* ── Utils ── */
.bold { font-weight: 700; }
.center { text-align: center; }
.color-subtle { color: #64748b; }
.text-xs { font-size: 0.7rem; }
.flex-row { display: flex; }
.gap-8 { gap: 0.5rem; }
.flex-1 { flex: 1; }
.empty { text-align: center; padding: 3rem; color: #94a3b8; }
.error-state { color: #e11d48; }

/* Width helpers */
.w-50 { min-width: 50px; }
.w-80 { min-width: 80px; }
.w-100 { min-width: 100px; }
.w-110 { min-width: 110px; }
.w-120 { min-width: 120px; }
.w-130 { min-width: 130px; }
.w-150 { min-width: 150px; }
</style>
