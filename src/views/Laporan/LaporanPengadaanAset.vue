<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, X } from 'lucide-vue-next'
import SearchIcon from '@/components/icons/SearchIcon.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import 'primeicons/primeicons.css'
import { useAuthStore } from '@/stores/auth'
import { useLaporanPengadaanStore } from '@/stores/laporanPengadaan'
import { laporanPengadaanService } from '@/services/laporanPengadaanService'
import { API_BASE_URL } from '@/services/api'
import type { LaporanFilterParams, DateField } from '@/interfaces/laporanPengadaan'

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
const dateField = ref<DateField>('waktu_pengajuan')

const dateFieldLabels: Record<DateField, string> = {
  waktu_pengajuan: 'Waktu Pengajuan',
  tanggal_pengadaan: 'Tanggal Pengadaan',
}

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

const isDateRangeInvalid = computed(() => {
  if (dateFrom.value && dateTo.value) {
    return new Date(dateFrom.value) > new Date(dateTo.value)
  }
  return false
})

/* ── Active filter check (untuk empty state message) ── */
const hasActiveFilters = computed(() =>
  !!(q.value || statusFilter.value || kategoriFilter.value || unitFilter.value
     || bulanFilter.value || tahunFilter.value || dateFrom.value || dateTo.value
     || dateField.value !== 'waktu_pengajuan'),
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
    dateField: dateField.value,
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
  dateField.value = 'waktu_pengajuan'
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
const isExportModalOpen = ref(false)
let exportErrorTimer: ReturnType<typeof setTimeout> | null = null

function openExportModal() {
  isExportModalOpen.value = true
}

async function handleExportPDF() {
  exportLoading.value = true
  exportError.value = null
  try {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const data = await laporanPengadaanService.getAllLaporanForExport(buildParams())

    const doc = new jsPDF({ orientation: 'landscape' })
    const pageW = doc.internal.pageSize.getWidth()

    // ── Title (centered, Helvetica) ──
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(0, 88, 143)
    doc.text('LAPORAN PENGADAAN ASET', pageW / 2, 14, { align: 'center' })

    // Decorative underline under title
    doc.setDrawColor(0, 88, 143)
    doc.setLineWidth(0.5)
    doc.line(pageW / 2 - 50, 16.5, pageW / 2 + 50, 16.5)

    // ── Build active-filter pairs ──
    const sortLabelMap: Record<string, string> = {
      waktuPengajuan: 'Waktu Pengajuan',
      namaAset: 'Nama Aset',
      estimasiHarga: 'Estimasi Harga',
      harga: 'Harga Aktual',
    }
    const activeFilters: Array<[string, string]> = []
    const hasDateFilter = !!(bulanFilter.value || tahunFilter.value || dateFrom.value || dateTo.value)
    if (hasDateFilter) {
      activeFilters.push(['Filter Tanggal', dateFieldLabels[dateField.value]])
    }
    if (q.value) activeFilters.push(['Pencarian', `"${q.value}"`])
    if (statusFilter.value) {
      activeFilters.push(['Status', statusLabel[statusFilter.value] ?? statusFilter.value])
    }
    if (kategoriFilter.value) {
      const k = kategoriList.find((x) => x.value === kategoriFilter.value)
      activeFilters.push(['Kategori Aset', k?.label ?? kategoriFilter.value])
    }
    if (isAdminOrYayasan.value && unitFilter.value) {
      activeFilters.push(['Unit', unitFilter.value])
    }
    if (bulanFilter.value && tahunFilter.value) {
      activeFilters.push(['Periode', `${bulanNames[Number(bulanFilter.value) - 1]} ${tahunFilter.value}`])
    } else if (tahunFilter.value) {
      activeFilters.push(['Tahun', String(tahunFilter.value)])
    } else if (bulanFilter.value) {
      activeFilters.push(['Bulan', bulanNames[Number(bulanFilter.value) - 1]])
    }
    if (dateFrom.value || dateTo.value) {
      activeFilters.push(['Rentang Tanggal', `${dateFrom.value || '...'}  s/d  ${dateTo.value || '...'}`])
    }
    if (store.sortBy !== 'waktuPengajuan' || store.direction !== 'DESC') {
      const sortLbl = sortLabelMap[store.sortBy] ?? store.sortBy
      activeFilters.push(['Urutan', `${sortLbl} (${store.direction})`])
    }

    // ── Render structured filter table (only if any filter active) ──
    let tableStartY = 22
    if (activeFilters.length > 0) {
      const boxX = 14
      const boxY = 22
      const boxW = pageW - 28
      const headerH = 7
      const rowH = 6
      const labelColW = 55
      const padding = 3

      // Header bar (filled blue)
      doc.setFillColor(0, 88, 143)
      doc.rect(boxX, boxY, boxW, headerH, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text('FILTER YANG DITERAPKAN', boxX + padding, boxY + headerH - 2)

      // Body rows (zebra striping + key/value columns)
      let y = boxY + headerH
      doc.setFontSize(9.5)
      activeFilters.forEach((pair, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(241, 245, 249)
        } else {
          doc.setFillColor(255, 255, 255)
        }
        doc.rect(boxX, y, boxW, rowH, 'F')

        // Vertical divider between label & value
        doc.setDrawColor(203, 213, 225)
        doc.setLineWidth(0.2)
        doc.line(boxX + labelColW, y, boxX + labelColW, y + rowH)

        // Horizontal divider
        if (idx > 0) doc.line(boxX, y, boxX + boxW, y)

        // Label (bold)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text(pair[0], boxX + padding, y + rowH - 1.8)

        // Value (normal)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(51, 65, 85)
        const valueText = doc.splitTextToSize(pair[1], boxW - labelColW - padding * 2) as string[]
        doc.text(valueText[0] ?? '', boxX + labelColW + padding, y + rowH - 1.8)

        y += rowH
      })

      // Outer border
      doc.setDrawColor(0, 88, 143)
      doc.setLineWidth(0.4)
      doc.rect(boxX, boxY, boxW, headerH + activeFilters.length * rowH)

      tableStartY = y + 5
    }

    const head = isAdminOrYayasan.value
      ? [['Waktu Pengajuan', 'Nama Pengaju', 'Nama Aset', 'Merk', 'Qty', 'Tgl Pengadaan', 'Est. Harga', 'Harga Aktual', 'Kategori', 'Unit', 'Status', 'Bukti', 'Alasan']]
      : [['Waktu Pengajuan', 'Nama Pengaju', 'Nama Aset', 'Merk', 'Qty', 'Tgl Pengadaan', 'Est. Harga', 'Harga Aktual', 'Kategori', 'Status', 'Bukti', 'Alasan']]

    const buktiColIdx = isAdminOrYayasan.value ? 11 : 10

    // Status pill colors — mirror UI .status-pill CSS classes
    const STATUS_PILL_COLORS: Record<string, { fill: [number, number, number]; text: [number, number, number] }> = {
      DIAJUKAN:          { fill: [243, 244, 246], text: [75, 85, 99] },
      DISETUJUI_KEPSEK:  { fill: [224, 242, 254], text: [2, 132, 199] },
      DISETUJUI_YAYASAN: { fill: [255, 244, 229], text: [217, 119, 6] },
      DITOLAK:           { fill: [255, 228, 230], text: [225, 29, 72] },
      DIBELI:            { fill: [220, 252, 231], text: [22, 163, 74] },
    }

    // Pre-fetch bukti pembelian as base64 (parallel)
    const buktiFilenames = [...new Set(data.filter((d) => d.bukti_pembelian).map((d) => d.bukti_pembelian as string))]
    const buktiMap = new Map<string, { data: string; format: 'JPEG' | 'PNG' }>()
    await Promise.all(
      buktiFilenames.map(async (filename) => {
        try {
          const res = await fetch(`${API_BASE_URL}/uploads/bukti-pembelian/${filename}`)
          if (!res.ok) return
          const blob = await res.blob()
          const format: 'JPEG' | 'PNG' = blob.type.includes('png') ? 'PNG' : 'JPEG'
          const reader = new FileReader()
          const dataUrl: string = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          buktiMap.set(filename, { data: dataUrl, format })
        } catch (err) {
          console.warn('Gagal load bukti pembelian:', filename, err)
        }
      }),
    )

    const body = data.map((it) => {
      const base: any[] = [
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

      // Status as styled pill cell
      const statusKey = it.status_pengajuan
      const statusText = statusLabel[statusKey] ?? statusKey
      const pillColor = STATUS_PILL_COLORS[statusKey]
      base.push(
        pillColor
          ? { content: statusText, styles: { fillColor: pillColor.fill, textColor: pillColor.text, fontStyle: 'bold', halign: 'center' } }
          : statusText,
      )

      // Bukti: raw filename, text suppressed in didParseCell; image drawn in didDrawCell
      base.push(it.bukti_pembelian ?? '')
      base.push(it.alasan ?? '-')
      return base
    })

    autoTable(doc, {
      head,
      body,
      startY: tableStartY,
      styles: { fontSize: 10, font: 'helvetica', textColor: [30, 41, 59], cellPadding: 2 },
      headStyles: { fillColor: [0, 88, 143], textColor: [255, 255, 255], font: 'helvetica', fontStyle: 'bold', fontSize: 10 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        [buktiColIdx]: { minCellHeight: 18, halign: 'center', cellWidth: 22 },
      },
      margin: { bottom: 18, left: 14, right: 14 },
      didParseCell: (cellData) => {
        // Suppress filename text in bukti column — image rendered in didDrawCell instead
        if (cellData.section === 'body' && cellData.column.index === buktiColIdx) {
          cellData.cell.text = []
        }
      },
      didDrawCell: (cellData) => {
        if (cellData.section !== 'body' || cellData.column.index !== buktiColIdx) return
        const filename = cellData.cell.raw as string
        if (!filename) return
        const img = buktiMap.get(filename)
        if (!img) {
          // Fallback: draw '-' placeholder text manually
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(148, 163, 184)
          doc.text('-', cellData.cell.x + cellData.cell.width / 2, cellData.cell.y + cellData.cell.height / 2 + 1, { align: 'center' })
          return
        }
        const padding = 1.5
        const maxW = cellData.cell.width - padding * 2
        const maxH = cellData.cell.height - padding * 2
        const imgW = Math.min(18, maxW)
        const imgH = Math.min(14, maxH)
        const x = cellData.cell.x + (cellData.cell.width - imgW) / 2
        const y = cellData.cell.y + (cellData.cell.height - imgH) / 2
        try {
          doc.addImage(img.data, img.format, x, y, imgW, imgH)
        } catch (err) {
          console.warn('Gagal embed gambar bukti:', filename, err)
        }
      },
    })

    // ── Footer di setiap halaman ──
    const totalPages = doc.internal.getNumberOfPages()
    const userName = auth.userName || '-'
    const userRoleRaw = (auth.userRole || '-').toUpperCase()
    const now = new Date()
    const tgl = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    const jam = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    const footerRight = `Dicetak oleh ${userName} (${userRoleRaw}) pada ${tgl}, ${jam}.`

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      const pgW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()

      // Thin separator line above footer
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(0.2)
      doc.line(14, pageH - 12, pgW - 14, pageH - 12)

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`Halaman ${i} dari ${totalPages}`, 14, pageH - 6)
      doc.text(footerRight, pgW - 14, pageH - 6, { align: 'right' })
    }

    // Filename: laporan-pengadaan-YYYYMMDD.pdf (PBI-66)
    const today = new Date()
    const yyyymmdd = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`
    doc.save(`laporan-pengadaan-${yyyymmdd}.pdf`)
    isExportModalOpen.value = false
  } catch (err: any) {
    console.error('Export PDF gagal:', err)
    exportError.value = `Gagal mengunduh PDF: ${err?.message || 'unknown error'}`
    if (exportErrorTimer) clearTimeout(exportErrorTimer)
    exportErrorTimer = setTimeout(() => { exportError.value = null }, 6000)
    isExportModalOpen.value = false
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

        <!-- Filter Tanggal Berdasarkan -->
        <div class="filter-item">
          <label class="filter-label">Filter Tanggal Berdasarkan</label>
          <div class="custom-select">
            <select v-model="dateField">
              <option value="waktu_pengajuan">Waktu Pengajuan</option>
              <option value="tanggal_pengadaan">Tanggal Pengadaan</option>
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

        <!-- From / To -->
        <div class="filter-item" style="min-width: 260px; flex: 2; position: relative; max-width: 300px;">
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="filter-label" style="margin-bottom: 8px;">From</label>
              <input type="date" v-model="dateFrom" class="custom-input" :class="{ 'border-red-500': isDateRangeInvalid }" @change="onFromToChange" />
            </div>
            <div class="flex-1">
              <label class="filter-label" style="margin-bottom: 8px;">To</label>
              <input type="date" v-model="dateTo" class="custom-input" :class="{ 'border-red-500': isDateRangeInvalid }" @change="onFromToChange" />
            </div>
          </div>
          <div class="relative h-0">
            <p v-if="isDateRangeInvalid" class="absolute top-1 left-0 text-red-500 text-[10px] italic leading-tight whitespace-nowrap">
              Rentang tanggal tidak valid: 'From' tidak boleh lebih besar dari 'To'
            </p>
          </div>
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
        <button @click="handleApplyFilter" class="btn-apply" :disabled="isDateRangeInvalid" :class="{ 'opacity-50 cursor-not-allowed': isDateRangeInvalid }">Terapkan Filter</button>
        <button @click="handleReset" class="btn-reset">Reset</button>
      </div>
    </section>

    <!-- Table Header -->
    <div class="table-header-row">
      <h2 class="table-section-title">Daftar Riwayat Pengajuan Pengadaan</h2>
      <button class="btn-export" @click="openExportModal" :disabled="exportLoading">
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
                @click="previewUrl = `${API_BASE_URL}/uploads/bukti-pembelian/${row.bukti}`"
              >
                <img
                  :src="`${API_BASE_URL}/uploads/bukti-pembelian/${row.bukti}`"
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
              <option :value="10">10</option>
              <option :value="30">30</option>
              <option :value="50">50</option>
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

    <!-- Export Confirmation Modal -->
    <ConfirmationModal
      :show="isExportModalOpen"
      title="Konfirmasi Export PDF"
      message="Apakah Anda ingin mengunduh laporan riwayat pengadaan aset ini dalam format PDF?"
      confirmText="Unduh PDF"
      cancelText="Batal"
      :isLoading="exportLoading"
      @confirm="handleExportPDF"
      @cancel="isExportModalOpen = false"
    />
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
  background: #e11d48; color: white; padding: 0.5rem 1rem; border-radius: 40px;
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
.table-wrapper { background: white; border-radius: 0.75rem; border: 1px solid #e2e8f0; overflow-x: auto; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1); }
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
