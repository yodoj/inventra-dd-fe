<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useDashboardAssetStore } from '@/stores/dashboardAsset';
import { useAuthStore } from '@/stores/auth';
import { 
  Package, 
  Box, 
  Archive, 
  DoorOpen, 
  Building2,
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  RotateCcw,
  Search,
  ChevronDown
} from 'lucide-vue-next';

const dashboardStore = useDashboardAssetStore();
const authStore = useAuthStore();

const isYayasan = computed(() => authStore.userRole === 'YAYASAN' || authStore.userRole === 'ADMIN');
const userUnit = computed(() => authStore.user?.unit || '');
const dashboardTitle = computed(() => {
  if (isYayasan.value) return 'Dashboard Peminjaman Aset Dian Didaktika';
  return `Dashboard Peminjaman Aset - ${userUnit.value}`;
});

const summary = computed(() => dashboardStore.summary);
const peminjamanPerUnit = computed(() => dashboardStore.peminjamanPerUnit);
const trendData = computed(() => dashboardStore.trend);
const topBorrowed = computed(() => dashboardStore.topBorrowed);
const topDamaged = computed(() => dashboardStore.topDamaged);

// Filters State
const currentYear = new Date().getFullYear();
const selectedYear = ref<number | null>(null);
const selectedMonth = ref<number | null>(null);
const selectedUnit = ref('Semua Unit');
const selectedKategori = ref('Semua Kategori');

const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const monthsList = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

const applyFilters = () => {
  dashboardStore.fetchTrend(selectedYear.value, selectedMonth.value, selectedUnit.value, selectedKategori.value);
  dashboardStore.fetchSummary();
  dashboardStore.fetchTopBorrowed(selectedYear.value, selectedMonth.value, selectedUnit.value, selectedKategori.value);
  dashboardStore.fetchTopDamaged(selectedYear.value, selectedMonth.value, selectedUnit.value, selectedKategori.value);
};

const resetFilters = () => {
  selectedYear.value = null;
  selectedMonth.value = null;
  selectedUnit.value = 'Semua Unit';
  selectedKategori.value = 'Semua Kategori';
  applyFilters();
};

onMounted(() => {
  dashboardStore.fetchSummary();
  if (isYayasan.value) {
    dashboardStore.fetchPeminjamanPerUnit();
  }
  dashboardStore.fetchTrend();
  dashboardStore.fetchTopBorrowed();
  dashboardStore.fetchTopDamaged();
});

// Y-Axis Calculation Helpers
const calculateYAxisMax = (rawMax: number) => {
  if (rawMax <= 10) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const normalized = rawMax / magnitude;
  let rounded;
  if (normalized <= 1) rounded = 1;
  else if (normalized <= 2) rounded = 2;
  else if (normalized <= 5) rounded = 5;
  else rounded = 10;
  return rounded * magnitude;
};

const calculateYAxisSteps = (max: number) => {
  return [max, max * 0.75, max * 0.5, max * 0.25, 0];
};

// Bar Chart Scale
const barMaxVal = computed(() => Math.max(...peminjamanPerUnit.value.map(u => u.totalPeminjaman), 0));
const yAxisMaxBar = computed(() => calculateYAxisMax(barMaxVal.value));
const yAxisStepsBar = computed(() => calculateYAxisSteps(yAxisMaxBar.value));

const getBarHeight = (value: number) => {
  if (yAxisMaxBar.value === 0) return 0;
  return (value / yAxisMaxBar.value) * 100;
};

// Trend Chart Scale
const trendMaxVal = computed(() => Math.max(...trendData.value.map(t => t.count), 0));
const yAxisMaxTrend = computed(() => calculateYAxisMax(trendMaxVal.value));
const yAxisStepsTrend = computed(() => calculateYAxisSteps(yAxisMaxTrend.value));

// Line Chart SVG Logic
const getPointX = (index: number, total: number) => {
  if (total <= 1) return 500;
  return (index / (total - 1)) * 1000;
};

const getPointY = (value: number) => {
  if (yAxisMaxTrend.value === 0) return 400;
  return 400 - (value / yAxisMaxTrend.value) * 400;
};

const svgPath = computed(() => {
  if (trendData.value.length < 2) return "";
  return trendData.value.reduce((path, point, i) => {
    const x = getPointX(i, trendData.value.length);
    const y = getPointY(point.count);
    return i === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
  }, "");
});

// Format Asset Name based on role and category
const formatAssetName = (item: any) => {
  const isBarang = item.kategori?.includes('BARANG');
  const kode = item.kodeAset ? `[${item.kodeAset}] ` : '';
  const nama = item.namaAset || '';
  const merk = item.merkAset ? ` - ${item.merkAset}` : '';
  const unit = isYayasan.value && item.unit ? ` - ${item.unit}` : '';
  
  if (isBarang) {
    return `${kode}${nama}${merk}${unit}`;
  } else {
    return `${kode}${nama}${unit}`;
  }
};

</script>

<template>
  <div class="dashboard-container fade-in">
    <!-- Header -->
    <header class="dashboard-header">
      <h1 class="h1-headline">{{ dashboardTitle }}</h1>
    </header>

    <!-- Top Grid: Summary & Bar Chart -->
    <div class="top-dashboard-grid" :class="{ 'yayasan-layout': isYayasan }">
      <!-- Summary Section -->
      <div class="summary-section">
        <div class="main-stat-card">
          <div class="stat-icon-wrapper">
            <Package class="icon-lg" />
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Inventori Aset {{ !isYayasan ? userUnit : '' }}</p>
            <h2 class="stat-value">{{ summary?.totalAset || 0 }} <span class="unit-text">Unit</span></h2>
          </div>
        </div>

        <div class="category-grid">
          <div class="category-card">
            <div class="cat-value">{{ summary?.breakdown.BARANG_HABIS_PAKAI || 0 }}</div>
            <div class="cat-label">Barang Habis Pakai</div>
          </div>
          <div class="category-card">
            <div class="cat-value">{{ summary?.breakdown.BARANG_TIDAK_HABIS_PAKAI || 0 }}</div>
            <div class="cat-label">Barang Tidak Habis Pakai</div>
          </div>
          <div class="category-card">
            <div class="cat-value">{{ summary?.breakdown.RUANG_KELAS || 0 }}</div>
            <div class="cat-label">Ruang Kelas</div>
          </div>
          <div class="category-card">
            <div class="cat-value">{{ summary?.breakdown.RUANG_NON_KELAS || 0 }}</div>
            <div class="cat-label">Ruang Non Kelas</div>
          </div>
        </div>
      </div>

      <!-- Bar Chart Section (Yayasan Only) -->
      <div v-if="isYayasan" class="chart-section premium-card">
        <div class="card-header">
          <h3 class="s1-subtitle">Peminjaman Aset per Unit</h3>
        </div>
        <div class="chart-wrapper">
          <div class="y-axis">
            <span v-for="step in yAxisStepsBar" :key="step">{{ Math.round(step) }}</span>
          </div>
          <div class="bars-container">
            <!-- Grid Lines -->
            <div class="grid-lines">
              <div v-for="step in yAxisStepsBar" :key="step" class="grid-line"></div>
            </div>
            <div v-for="unit in peminjamanPerUnit" :key="unit.unit" class="bar-group">
              <div class="bar-outer">
                <div 
                  class="bar-inner" 
                  :style="{ height: getBarHeight(unit.totalPeminjaman) + '%' }"
                >
                  <span class="bar-tooltip">{{ unit.totalPeminjaman }}</span>
                </div>
              </div>
              <span class="bar-label">{{ unit.unit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-dashboard-content premium-card">
      <!-- Filters -->
      <div class="filter-bar">
        <div class="filter-group">
          <label>Unit</label>
          <div class="custom-select select-wide">
            <select v-model="selectedUnit" :disabled="!isYayasan">
              <option value="Semua Unit">Semua Unit</option>
              <template v-if="isYayasan">
                <option>KB-TK</option>
                <option>SD</option>
                <option>SMP</option>
                <option>SMA</option>
              </template>
              <option v-else>{{ userUnit }}</option>
            </select>
            <ChevronDown class="select-icon" />
          </div>
        </div>
        <div class="filter-group">
          <label>Kategori Aset</label>
          <div class="custom-select select-wide">
            <select v-model="selectedKategori">
              <option value="Semua Kategori">Semua Kategori</option>
              <option>Barang Habis Pakai</option>
              <option>Barang Tidak Habis Pakai</option>
              <option>Ruang Kelas</option>
              <option>Ruang Non Kelas</option>
            </select>
            <ChevronDown class="select-icon" />
          </div>
        </div>
        <div class="filter-group">
          <label>Periode</label>
          <div class="period-filters">
            <div class="custom-select select-small">
              <select v-model="selectedMonth">
                <option :value="null">Semua Bulan</option>
                <option v-for="m in monthsList" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
            <div class="custom-select select-small">
              <select v-model="selectedYear">
                <option :value="null">Semua Tahun</option>
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn-apply" @click="applyFilters">Terapkan Filter</button>
          <button class="btn-reset" @click="resetFilters">Reset</button>
        </div>
      </div>

      <!-- Line Chart Area -->
      <div class="tren-section">
        <h3 class="s1-subtitle">Tren Peminjaman Aset {{ !isYayasan ? userUnit : '' }}</h3>
        <div class="line-chart-container">
          <div class="line-chart-y">
            <span v-for="step in yAxisStepsTrend" :key="step">{{ Math.round(step) }}</span>
          </div>
          <div class="line-chart-content">
             <div class="chart-main-area">
                <!-- Grid Lines -->
                <div class="grid-lines">
                  <div v-for="step in yAxisStepsTrend" :key="step" class="grid-line"></div>
                </div>
                <!-- SVG for the line only -->
                <svg v-if="trendData.length > 0" class="line-svg" viewBox="0 0 1000 400" preserveAspectRatio="none">
                  <path :d="svgPath" fill="none" stroke="#00588F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="miter" vector-effect="non-scaling-stroke" />
                </svg>
                <!-- Div dots positioned perfectly -->
                <div class="line-dots">
                  <div v-for="(point, i) in trendData" :key="i" 
                    class="line-dot"
                    :style="{ 
                      left: (getPointX(i, trendData.length) / 10) + '%', 
                      top: (getPointY(point.count) / 4) + '%' 
                    }"
                  >
                    <span class="dot-tooltip">{{ point.count }}</span>
                  </div>
                </div>
             </div>
             <!-- Labels moved outside/below chart area -->
             <div class="line-labels">
                <span 
                  v-for="(point, i) in trendData" 
                  :key="point.label"
                  :style="{ left: (getPointX(i, trendData.length) / 10) + '%' }"
                >
                  {{ point.label }}
                </span>
             </div>
          </div>
        </div>
      </div>

      <!-- Top 5 Tables -->
      <div class="top-lists-grid">
        <div class="top-list-card navy-card">
          <h4 class="card-title">Top 5 Aset Paling Sering Dipinjam</h4>
          <div class="top-items-stack">
            <template v-if="topBorrowed.length > 0">
              <div v-for="(item, idx) in topBorrowed" :key="idx" class="top-item-row">
                <div class="item-rank">{{ idx + 1 }}.</div>
                <div class="item-info">
                  {{ formatAssetName(item) }}
                </div>
                <div class="item-value-badge">{{ item.value }}</div>
              </div>
            </template>
            <div v-else class="empty-state-text">
              Tidak ada data peminjaman dalam periode ini.
            </div>
          </div>
        </div>

        <div class="top-list-card navy-card">
          <h4 class="card-title">Top 5 Aset Paling Sering Rusak</h4>
          <div class="top-items-stack">
            <template v-if="topDamaged.length > 0">
              <div v-for="(item, idx) in topDamaged" :key="idx" class="top-item-row">
                <div class="item-rank">{{ idx + 1 }}.</div>
                <div class="item-info">
                  {{ formatAssetName(item) }}
                </div>
                <div class="item-value-badge">{{ item.value }}</div>
              </div>
            </template>
            <div v-else class="empty-state-text">
              Tidak ada laporan kerusakan dalam periode ini.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 40px;
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.dashboard-header h1 {
  color: #000;
  font-weight: 800;
}

.top-dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}

.yayasan-layout {
  grid-template-columns: 1.2fr 1fr;
}

.summary-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.main-stat-card {
  background: #00588F;
  border-radius: 20px;
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 24px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 88, 143, 0.2);
}

.stat-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-lg { width: 40px; height: 40px; }

.stat-label {
  font-size: 18px;
  font-weight: 600;
  opacity: 0.9;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 48px;
  font-weight: 800;
  margin: 0;
  line-height: 1;
}

.unit-text {
  font-size: 20px;
  font-weight: 600;
  opacity: 0.8;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.category-card {
  background: #E8F4FD;
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  transition: transform 0.3s ease;
}

.category-card:hover {
  transform: translateY(-5px);
}

.cat-value {
  font-size: 32px;
  font-weight: 800;
  color: #000;
  margin-bottom: 4px;
}

.cat-label {
  font-size: 13px;
  font-weight: 600;
  color: #4B5563;
}

/* Premium Card */
.premium-card {
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border: 1px solid #F3F4F6;
}

/* Bar Chart Styles */
.chart-section {
  display: flex;
  flex-direction: column;
}

.chart-wrapper {
  flex: 1;
  display: flex;
  gap: 20px;
  margin-top: 24px;
  position: relative;
  height: 250px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 30px;
  color: #6B7280;
  font-size: 12px;
  font-weight: 600;
  width: 30px;
}

.bars-container {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  border-bottom: 2px solid #E5E7EB;
  padding-bottom: 10px;
  position: relative; /* Added to contain absolute grid lines */
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
  padding-bottom: 10px; /* Match bars-container padding */
}

.grid-line {
  width: 100%;
  height: 1px;
  background: #F3F4F6;
}

.grid-line:last-child {
  background: transparent; /* Last line overlaps with border-bottom */
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 60px;
  height: 100%;
  justify-content: flex-end;
  z-index: 1; /* Keep bars above grid lines */
}

.bar-outer {
  width: 100%;
  height: calc(100% - 20px);
  display: flex;
  align-items: flex-end;
}

.bar-inner {
  width: 100%;
  background: #93C5FD;
  border-radius: 8px 8px 0 0;
  position: relative;
}

.bar-tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #1F2937;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  opacity: 0;
  transition: opacity 0.3s;
}

.bar-inner:hover .bar-tooltip {
  opacity: 1;
}

.bar-label {
  margin-top: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #4B5563;
}

/* Main Content Styles */
.main-dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 150px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 700;
  color: #00588F;
}

.custom-select {
  position: relative;
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.custom-select:hover {
  border-color: #00588F;
}

.custom-select select {
  width: 100%;
  padding: 10px 12px;
  padding-right: 32px;
  appearance: none;
  background: transparent;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: #4B5563;
  cursor: pointer;
  outline: none;
}

.select-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: #6B7280;
  pointer-events: none;
}

.select-wide { width: 100%; }
.select-small { width: 100%; }

.period-filters {
  display: flex;
  gap: 8px;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

.btn-apply {
  background: #00588F;
  color: white;
  padding: 12px 32px;
  border-radius: 100px;
  font-weight: 700;
  border: none;
  transition: all 0.3s;
}

.btn-apply:hover {
  background: #004570;
  transform: translateY(-2px);
}

.btn-reset {
  background: white;
  color: #374151;
  border: 1px solid #D1D5DB;
  padding: 12px 32px;
  border-radius: 100px;
  font-weight: 700;
  transition: all 0.3s;
}

.btn-reset:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

/* Tren Section */
.line-chart-container {
  margin-top: 32px;
  display: flex;
  gap: 20px;
  height: 300px;
}

.line-chart-y {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 40px;
  color: #6B7280;
  font-size: 12px;
  font-weight: 600;
}

.line-chart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart-main-area {
  flex: 1;
  position: relative;
  border-bottom: 2px solid #E5E7EB;
  border-top: 1px solid #F3F4F6;
}

.line-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.line-dots {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
}

.line-dot {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #00588F;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.line-labels {
  position: relative;
  height: 40px;
  margin-top: 8px;
}

.line-labels span {
  position: absolute;
  transform: translateX(-50%);
  color: #6B7280;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.dot-tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #1F2937;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  white-space: nowrap;
}

.line-dot:hover .dot-tooltip {
  opacity: 1;
}


/* Top Lists Grid */
.top-lists-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.top-list-card {
  padding: 32px;
  border-radius: 24px;
}

.navy-card {
  background: #00588F;
  color: white;
}

.empty-state-text {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.7;
  font-style: italic;
  font-size: 14px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
}

.top-items-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.top-item-row {
  background: white;
  border-radius: 50px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  color: #1F2937;
  gap: 12px;
}

.item-rank {
  font-weight: 800;
  color: #00588F;
}

.item-info {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
}

.item-id { color: #6B7280; }

.item-value-badge {
  background: #E8F4FD;
  color: #00588F;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 800;
}

@media (max-width: 1024px) {
  .yayasan-layout { grid-template-columns: 1fr; }
  .category-grid { grid-template-columns: repeat(2, 1fr); }
  .top-lists-grid { grid-template-columns: 1fr; }
}
</style>
