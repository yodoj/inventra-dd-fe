<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDashboardPengadaanStore } from '@/stores/dashboardPengadaanStore'
import { useAuthStore } from '@/stores/auth'

const store = useDashboardPengadaanStore()
const auth = useAuthStore()
const role = computed(() => auth.userRole)

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const startYear = 1980
  return Array.from(
    { length: currentYear - startYear },
    (_, i) => currentYear - i
  )
})


const months = [
  { label: "Januari", value: 1 }, { label: "Februari", value: 2 },
  { label: "Maret", value: 3 }, { label: "April", value: 4 },
  { label: "Mei", value: 5 }, { label: "Juni", value: 6 },
  { label: "Juli", value: 7 }, { label: "Agustus", value: 8 },
  { label: "September", value: 9 }, { label: "Oktober", value: 10 },
  { label: "November", value: 11 }, { label: "Desember", value: 12 }
]

const categories = [
  { label: "Barang Habis Pakai", value: "BARANG_HABIS_PAKAI" },
  { label: "Barang Tidak Habis Pakai", value: "BARANG_TIDAK_HABIS_PAKAI" }
]

const selectedYear = ref<number>(2026)
const selectedMonth = ref<number | null>(null)
const selectedKategori = ref<string | null>(null)
const selectedUnit = ref<string | null>(null)

const isPrivileged = computed(() =>
  ['YAYASAN', 'ADMIN', 'ROLE_YAYASAN', 'ROLE_ADMIN'].includes(role.value)
)
watch([selectedYear, selectedMonth, selectedKategori, selectedUnit], () => {
  store.setYear(selectedYear.value)
  store.setBulan(selectedMonth.value)
  store.setKategori(selectedKategori.value)
  if (isPrivileged.value) {
    store.setUnit(selectedUnit.value === 'ALL' ? null : selectedUnit.value)
  }
  store.fetchAll()
})

onMounted(() => {
  store.setYear(selectedYear.value)
  store.fetchAll()
})

const formatRupiah = (value?: number) => {
  if (!value) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(value).replace(',00', '')
}

const formatShortRupiah = (value: number) => {
  if (value >= 1000000) {
    return `Rp${(value / 1000000).toFixed(0)} jt`
  }
  return formatRupiah(value)
}

const totalBarang = computed(() => store.dashboard?.total?.totalBarang || 0)
const totalBiaya = computed(() => store.dashboard?.total?.totalBiaya || 0)

const unitComparison = computed(() => {
  const defaultUnits = ['KB-TK', 'SD', 'SMP', 'SMA']

  const breakdown = store.dashboard?.breakdownUnit || []

  return defaultUnits.map(unitName => {
    const found = breakdown.find(b => b.unit === unitName)

    return {
      name: unitName,
      price: found?.totalBiaya || 0,
      items: found?.totalBarang || 0
    }
  })
})

const fastMoving = computed(() => store.topPengadaan?.map(item => item.namaAset) || [])
const expensiveData = computed(() => store.topBiaya?.map(item => ({
  name: item.namaAset,
  price: item.totalBiaya
})) || [])

const isExpensiveEmpty = computed(() => {
  return !expensiveData.value?.length ||
         expensiveData.value.every(item => item.price === 0)
})

// Dummy data untuk chart (nanti akan diganti dengan data asli dari API)
const chartData = computed(() => [
  { year: '2023', value: 30 }, { year: '2024', value: 55 },
  { year: '2025', value: 75 }, { year: '2026', value: 70 }
])
</script>

<template>
  <main class="dashboard-page">
    <h1 class="main-title">Dashboard Pengadaan Aset</h1>

    <div class="white-container mb-24">
      <div class="header-filter">
        <select v-if="role === 'YAYASAN' || role === 'ADMIN'" v-model="selectedUnit" class="custom-select-box mr-12">
          <option :value=null>Semua Unit</option>
          <option value="KB-TK">KB-TK</option>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </select>

        <select v-model="selectedYear" class="custom-select-box">
          <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
        </select>
      </div>

      <div class="stats-grid">
        <div class="stat-card bg-gradient-dark">
          <div class="icon-box"><i class="pi pi-box"></i></div>
          <div class="stat-info">
            <span class="stat-label">Total Pengadaan Aset</span>
            <div class="stat-value-group">
              <span class="stat-number">{{ totalBarang }}</span>
              <span class="stat-unit">Unit Barang</span>
            </div>
          </div>
        </div>

        <div class="stat-card bg-blue-solid">
          <div class="icon-box"><i class="pi pi-wallet"></i></div>
          <div class="stat-info">
            <span class="stat-label">Total Biaya Pengadaan Aset</span>
            <span class="stat-number">{{ formatRupiah(totalBiaya) }}</span>
          </div>
        </div>
      </div>

      <div v-if="role === 'YAYASAN' || role === 'ADMIN'" class="comparison-section mt-24">
        <h3 class="comparison-title">Perbandingan Antar Unit {{ selectedYear }}</h3>
        <div class="comparison-grid">
          <div v-for="unit in unitComparison" :key="unit.name" class="comp-card">
            <p class="comp-unit-name">{{ unit.name }}</p>
            <p class="comp-price">{{ formatShortRupiah(unit.price) }}</p>
            <p class="comp-items">{{ unit.items }} Barang</p>
          </div>
        </div>
      </div>
    </div>
    <!-- Part untuk chart (nanti akan diganti dengan data asli dari API) -->
    <div class="charts-grid mb-24">
      <div class="chart-card" v-for="title in ['Biaya Pengadaan Per Tahun', 'Jumlah Aset Pengadaan Per Tahun']" :key="title">
        <div class="flex-between mb-20">
          <h3 class="chart-title">{{ title }}</h3>
          <select v-if="role === 'YAYASAN' || role === 'ADMIN'" class="custom-select-box small">
            <option>Semua Unit</option>
          </select>
        </div>
        <div class="chart-container">
          <div v-for="item in chartData" :key="item.year" class="bar-wrapper">
            <span class="bar-value">{{ item.value }}</span>
            <div class="bar-fill" :style="{ height: item.value + '%' }"></div>
            <span class="bar-label">{{ item.year }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="white-container">
      <div class="header-filter-group">
        <select v-model="selectedKategori" class="custom-select-box">
          <option :value="null">Semua Kategori</option>
          <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
        </select>
        <select v-if="role === 'YAYASAN' || role === 'ADMIN'" v-model="selectedUnit" class="custom-select-box">
          <option :value="null">Semua Unit</option>
          <option value="KB-TK">KB-TK</option>
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
        </select>
        <select v-model="selectedMonth" class="custom-select-box">
          <option :value="null">Semua Bulan</option>
          <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <select v-model="selectedYear" class="custom-select-box">
          <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
        </select>
      </div>
      <!-- Part untuk list aset paling cepat habis (nanti akan diganti dengan data asli dari API) -->
      <div class="lists-grid">
        <div class="list-box bg-navy">
          <h3 class="list-title">Top 5 Aset Paling Cepat Habis</h3>
          <div class="items-stack">
            <div v-for="(name, i) in fastMoving" :key="i" class="pill-item">
              <div class="blue-bullet">{{ i + 1 }}.</div>
              <span class="pill-text">{{ name }}</span>
            </div>
          </div>
        </div>

        <div class="list-box bg-blue">
          <h3 class="list-title">Top 5 Pengadaan Biaya Terbesar</h3>
          <div class="items-stack">
            <!-- Empty state -->
            <div v-if="isExpensiveEmpty" class="empty-list">
              Tidak ada data
            </div>

            <!-- Data ada -->
            <template v-else>
              <div
                v-for="(item, i) in expensiveData"
                :key="i"
                class="pill-item justify-between"
              >
                <div class="flex-items-center">
                  <div class="blue-bullet">{{ i + 1 }}.</div>
                  <span class="pill-text">{{ item.name }}</span>
                </div>
                <span class="price-tag">
                  {{ formatRupiah(item.price) }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.dashboard-page {
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}

.main-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 24px;
  color: #000;
}
.white-container {
  background: white;
  padding: 24px;
  border-radius: 20px;
  border: 1px solid #eaeaea;
}
.mb-24 {
  margin-bottom: 24px;
}
.mt-24 {
  margin-top: 24px;
}
.mr-12 {
  margin-right: 12px;
}

.custom-select-box {
  appearance: none; -webkit-appearance: none;
  padding: 10px 35px 10px 16px; border-radius: 12px; border: 1px solid #d1d5db;
  font-size: 14px; background: white no-repeat right 12px center / 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  cursor: pointer;
}
.custom-select-box.small {
  padding: 5px 30px 5px 10px;
  font-size: 12px;
  border-radius: 8px;
}

.header-filter, .header-filter-group {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.header-filter-group {
  gap: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stat-card {
  padding: 30px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  gap: 24px;
  color: white;
}

.bg-gradient-dark {
  background: linear-gradient(135deg, #23456b 0%, #163252 100%);
}

.bg-blue-solid {
  background-color: #00588f;
}
.icon-box {
  background: rgba(255, 255, 255, 0.2);
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.stat-value-group {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
}

.stat-unit {
  font-size: 12px;
  opacity: 0.8;
}

/* COMPARISON YAYASAN */
.comparison-section {
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.comparison-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 16px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.comp-card {
  background-color: #e6f1ff;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
}

.comp-unit-name {
  font-size: 11px;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  margin: 0 0 4px;
}

.comp-price {
  font-size: 18px;
  font-weight: 800;
  color: #00588f;
  margin: 0;
}

.comp-items {
  font-size: 11px;
  color: #666;
  margin: 4px 0 0;
}

/* CHARTS & LISTS */
.charts-grid,
.lists-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  background: white;
  padding: 24px;
  border-radius: 20px;
  border: 1px solid #eaeaea;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title,
.list-title {
  font-size: 16px;
  font-weight: 700;
  padding-bottom: 20px;
}

.chart-container {
  height: 160px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  border-bottom: 2px solid #f1f1f1;
  /* padding-bottom: 10px; */
}

.bar-wrapper {
  width: 15%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  gap: 6px;
}

.bar-fill {
  width: 100%;
  background-color: #93c5fd;
  border-radius: 8px 8px 0 0;
}

.bar-value {
  font-size: 10px;
  font-weight: 700;
  color: #374151;
  margin-bottom: -6px;
}

.bar-label {
  position: absolute;
  bottom: -25px;
  font-size: 11px;
  color: #666;
}

.list-box {
  padding: 24px;
  border-radius: 18px;
  color: white;
}

.bg-navy {
  background-color: #00406b;
}

.bg-blue {
  background-color: #00588f;
}

.items-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pill-item {
  background: white;
  padding: 10px 18px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  color: #333;
}

.justify-between {
  justify-content: space-between;
}

.flex-items-center {
  display: flex;
  align-items: center;
}

.blue-bullet {
  background-color: #e6f1ff;
  color: #00588f;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 11px;
  margin-right: 12px;
  flex-shrink: 0;
}

.pill-text {
  font-weight: 600;
  font-size: 13px;
}

.price-tag {
  background-color: #e6f1ff;
  color: #00588f;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 800;
  font-size: 11px;
}

.empty-list {
  width: 100%;
  text-align: center;
  color: #ddd;
  font-size: 14px;
  font-weight: 500;
  padding: 20px 0;
}
</style>
