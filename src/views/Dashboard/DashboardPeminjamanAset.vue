<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useDashboardAssetStore } from '@/stores/dashboardAsset';
import { useAuthStore } from '@/stores/auth';
import { 
  Package, 
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

// Filters State Common
const currentYear = new Date().getFullYear();
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

// Filter Bar 1: Trend Chart
const trendSelectedYear = ref<number | null>(null);
const trendSelectedMonth = ref<number | null>(null);
const trendSelectedUnit = ref('Semua Unit');
const trendSelectedKategori = ref('Semua Kategori');

const applyTrendFilters = () => {
  dashboardStore.fetchTrend(
    trendSelectedYear.value,
    trendSelectedMonth.value,
    trendSelectedUnit.value,
    trendSelectedKategori.value
  );
};

const resetTrendFilters = () => {
  trendSelectedYear.value = null;
  trendSelectedMonth.value = null;
  trendSelectedUnit.value = isYayasan.value ? 'Semua Unit' : userUnit.value;
  trendSelectedKategori.value = 'Semua Kategori';
  applyTrendFilters();
};

// Filter Bar 2: Top 5 Lists
const topSelectedYear = ref<number | null>(null);
const topSelectedMonth = ref<number | null>(null);
const topSelectedUnit = ref('Semua Unit');
const topSelectedKategori = ref('Semua Kategori');

const applyTopFilters = () => {
  dashboardStore.fetchTopBorrowed(
    topSelectedYear.value,
    topSelectedMonth.value,
    topSelectedUnit.value,
    topSelectedKategori.value
  );
  dashboardStore.fetchTopDamaged(
    topSelectedYear.value,
    topSelectedMonth.value,
    topSelectedUnit.value,
    topSelectedKategori.value
  );
};

const resetTopFilters = () => {
  topSelectedYear.value = null;
  topSelectedMonth.value = null;
  topSelectedUnit.value = isYayasan.value ? 'Semua Unit' : userUnit.value;
  topSelectedKategori.value = 'Semua Kategori';
  applyTopFilters();
};

onMounted(() => {
  trendSelectedUnit.value = isYayasan.value ? 'Semua Unit' : userUnit.value;
  topSelectedUnit.value = isYayasan.value ? 'Semua Unit' : userUnit.value;

  dashboardStore.fetchSummary();
  if (isYayasan.value) {
    dashboardStore.fetchPeminjamanPerUnit();
  }
  applyTrendFilters();
  applyTopFilters();
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
  const startX = 80; // 8% padding to center Minggu 1 and Minggu 4 perfectly
  const endX = 920;  // 92% boundary
  return startX + (index / (total - 1)) * (endX - startX);
};

const getPointY = (value: number) => {
  if (yAxisMaxTrend.value === 0) return 197; // 3 units padding from bottom boundary to prevent stroke clipping
  const minY = 3;  // 3 units padding from top
  const maxY = 197; // 3 units padding from bottom
  const range = maxY - minY;
  return maxY - (value / yAxisMaxTrend.value) * range;
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
  <main class="dashboard-page fade-in">
    <!-- Header -->
    <h1 class="main-title">{{ dashboardTitle }}</h1>

    <!-- Top Grid: Summary & Bar Chart -->
    <div class="top-dashboard-grid" :class="{ 'yayasan-layout': isYayasan }">
      <!-- Summary Section -->
      <div class="summary-section">
        <div class="main-stat-card">
          <div class="stat-icon-wrapper">
            <Package class="icon-lg" />
          </div>
          <div class="stat-content">
            <p class="stat-label">Total Inventori Aset {{ !isYayasan ? userUnit + ' ' : '' }}Saat Ini</p>
            <h2 class="stat-value">{{ summary?.totalAset || 0 }} <span class="unit-text">Unit</span></h2>
          </div>
        </div>

        <div class="category-grid">
          <div class="category-card">
            <div class="cat-value">{{ summary?.breakdown.BARANG_HABIS_PAKAI || 0 }}</div>
            <div class="cat-label">Barang Habis Pakai Saat Ini</div>
          </div>
          <div class="category-card">
            <div class="cat-value">{{ summary?.breakdown.BARANG_TIDAK_HABIS_PAKAI || 0 }}</div>
            <div class="cat-label">Barang Tidak Habis Pakai Saat Ini</div>
          </div>
          <div class="category-card">
            <div class="cat-value">{{ summary?.breakdown.RUANG_KELAS || 0 }}</div>
            <div class="cat-label">Ruang Kelas Saat Ini</div>
          </div>
          <div class="category-card">
            <div class="cat-value">{{ summary?.breakdown.RUANG_NON_KELAS || 0 }}</div>
            <div class="cat-label">Ruang Non Kelas Saat Ini</div>
          </div>
        </div>
      </div>

      <!-- Bar Chart Section (Yayasan Only) -->
      <div v-if="isYayasan" class="chart-section premium-card">
        <div class="card-header">
          <h3 class="s1-subtitle">Jumlah Peminjaman Aset per Unit Saat Ini</h3>
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

    <!-- First Section: Tren Peminjaman Aset (Line Chart & Filter 1) -->
    <div class="main-dashboard-content premium-card">
      <!-- Filters 1 -->
      <div class="filter-bar">
        <!-- If isYayasan, show Unit first -->
        <div v-if="isYayasan" class="filter-group">
          <label>Unit</label>
          <div class="custom-select select-wide">
            <select v-model="trendSelectedUnit">
              <option value="Semua Unit">Semua Unit</option>
              <option>KB-TK</option>
              <option>SD</option>
              <option>SMP</option>
              <option>SMA</option>
            </select>
            <ChevronDown class="select-icon" />
          </div>
        </div>

        <template v-if="!isYayasan">
          <!-- Periode first -->
          <div class="filter-group">
            <label>Periode</label>
            <div class="period-filters">
              <div class="custom-select select-small">
                <select v-model="trendSelectedMonth">
                  <option :value="null">Semua Bulan</option>
                  <option v-for="m in monthsList" :key="m.value" :value="m.value">{{ m.label }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
              <div class="custom-select select-small">
                <select v-model="trendSelectedYear">
                  <option :value="null">Semua Tahun</option>
                  <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>
          </div>
          <!-- Kategori Aset second -->
          <div class="filter-group">
            <label>Kategori Aset</label>
            <div class="custom-select select-wide">
              <select v-model="trendSelectedKategori">
                <option value="Semua Kategori">Semua Kategori</option>
                <option>Barang Habis Pakai</option>
                <option>Barang Tidak Habis Pakai</option>
                <option>Ruang Kelas</option>
                <option>Ruang Non Kelas</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>
        </template>

        <template v-else>
          <!-- Kategori Aset second -->
          <div class="filter-group">
            <label>Kategori Aset</label>
            <div class="custom-select select-wide">
              <select v-model="trendSelectedKategori">
                <option value="Semua Kategori">Semua Kategori</option>
                <option>Barang Habis Pakai</option>
                <option>Barang Tidak Habis Pakai</option>
                <option>Ruang Kelas</option>
                <option>Ruang Non Kelas</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>
          <!-- Periode third -->
          <div class="filter-group">
            <label>Periode</label>
            <div class="period-filters">
              <div class="custom-select select-small">
                <select v-model="trendSelectedMonth">
                  <option :value="null">Semua Bulan</option>
                  <option v-for="m in monthsList" :key="m.value" :value="m.value">{{ m.label }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
              <div class="custom-select select-small">
                <select v-model="trendSelectedYear">
                  <option :value="null">Semua Tahun</option>
                  <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>
          </div>
        </template>

        <div class="filter-actions">
          <button class="btn-apply" @click="applyTrendFilters">Terapkan Filter</button>
          <button class="btn-reset" @click="resetTrendFilters">Reset</button>
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
                <svg v-if="trendData.length > 0" class="line-svg" viewBox="0 0 1000 200" preserveAspectRatio="none">
                  <path :d="svgPath" fill="none" stroke="#00588F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
                </svg>
                <!-- Div dots positioned perfectly -->
                <div class="line-dots">
                  <div v-for="(point, i) in trendData" :key="i" 
                    class="line-dot"
                    :style="{ 
                      left: (getPointX(i, trendData.length) / 10) + '%', 
                      top: (getPointY(point.count) / 2) + '%' 
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
    </div>

    <!-- Second Section: Top 5 Lists (Top 5 Tables & Filter 2) -->
    <div class="main-dashboard-content premium-card">
      <!-- Filters 2 -->
      <div class="filter-bar">
        <!-- If isYayasan, show Unit first -->
        <div v-if="isYayasan" class="filter-group">
          <label>Unit</label>
          <div class="custom-select select-wide">
            <select v-model="topSelectedUnit">
              <option value="Semua Unit">Semua Unit</option>
              <option>KB-TK</option>
              <option>SD</option>
              <option>SMP</option>
              <option>SMA</option>
            </select>
            <ChevronDown class="select-icon" />
          </div>
        </div>

        <template v-if="!isYayasan">
          <!-- Periode first -->
          <div class="filter-group">
            <label>Periode</label>
            <div class="period-filters">
              <div class="custom-select select-small">
                <select v-model="topSelectedMonth">
                  <option :value="null">Semua Bulan</option>
                  <option v-for="m in monthsList" :key="m.value" :value="m.value">{{ m.label }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
              <div class="custom-select select-small">
                <select v-model="topSelectedYear">
                  <option :value="null">Semua Tahun</option>
                  <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>
          </div>
          <!-- Kategori Aset second -->
          <div class="filter-group">
            <label>Kategori Aset</label>
            <div class="custom-select select-wide">
              <select v-model="topSelectedKategori">
                <option value="Semua Kategori">Semua Kategori</option>
                <option>Barang Habis Pakai</option>
                <option>Barang Tidak Habis Pakai</option>
                <option>Ruang Kelas</option>
                <option>Ruang Non Kelas</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>
        </template>

        <template v-else>
          <!-- Kategori Aset second -->
          <div class="filter-group">
            <label>Kategori Aset</label>
            <div class="custom-select select-wide">
              <select v-model="topSelectedKategori">
                <option value="Semua Kategori">Semua Kategori</option>
                <option>Barang Habis Pakai</option>
                <option>Barang Tidak Habis Pakai</option>
                <option>Ruang Kelas</option>
                <option>Ruang Non Kelas</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>
          <!-- Periode third -->
          <div class="filter-group">
            <label>Periode</label>
            <div class="period-filters">
              <div class="custom-select select-small">
                <select v-model="topSelectedMonth">
                  <option :value="null">Semua Bulan</option>
                  <option v-for="m in monthsList" :key="m.value" :value="m.value">{{ m.label }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
              <div class="custom-select select-small">
                <select v-model="topSelectedYear">
                  <option :value="null">Semua Tahun</option>
                  <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>
          </div>
        </template>

        <div class="filter-actions">
          <button class="btn-apply" @click="applyTopFilters">Terapkan Filter</button>
          <button class="btn-reset" @click="resetTopFilters">Reset</button>
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
  </main>
</template>

<style scoped>
.dashboard-page {
  padding: 30px;
  background-color: #f8f9fa;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.main-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 24px;
  color: #000;
}

.top-dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.yayasan-layout {
  grid-template-columns: 1.2fr 1fr;
}

.summary-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-stat-card {
  background: #00588F;
  border-radius: 18px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  color: white;
  box-shadow: 0 10px 30px rgba(0, 88, 143, 0.2);
}

.stat-icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-lg { width: 28px; height: 28px; }

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
  font-weight: 500;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  line-height: 1;
}

.unit-text {
  font-size: 12px;
  opacity: 0.8;
  font-weight: 500;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.category-card {
  background: #E8F4FD;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: transform 0.3s ease;
}

.category-card:hover {
  transform: translateY(-3px);
}

.cat-value {
  font-size: 20px;
  font-weight: 800;
  color: #000;
  margin-bottom: 4px;
}

.cat-label {
  font-size: 11px;
  font-weight: 600;
  color: #4B5563;
}

/* Premium Card (Matches white-container) */
.premium-card {
  background: white;
  padding: 24px;
  border-radius: 20px;
  border: 1px solid #eaeaea;
}

/* Bar Chart Styles */
.chart-section {
  display: flex;
  flex-direction: column;
}

.chart-wrapper {
  flex: 1;
  display: flex;
  gap: 16px;
  margin-top: 16px;
  position: relative;
  height: 180px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 24px;
  color: #6B7280;
  font-size: 11px;
  font-weight: 600;
  width: 25px;
}

.bars-container {
  flex: 1;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  border-bottom: 2px solid #E5E7EB;
  padding-bottom: 10px;
  position: relative;
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
  padding-bottom: 10px;
}

.grid-line {
  width: 100%;
  height: 1px;
  background: #F3F4F6;
}

.grid-line:last-child {
  background: transparent;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48px;
  height: 100%;
  justify-content: flex-end;
  z-index: 1;
}

.bar-outer {
  width: 100%;
  height: calc(100% - 20px);
  display: flex;
  align-items: flex-end;
}

.bar-inner {
  width: 100%;
  background-color: #93c5fd;
  border-radius: 6px 6px 0 0;
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
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #4B5563;
}

/* Main Content Styles */
.main-dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 140px;
}

.filter-group label {
  font-size: 13px;
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
  padding: 8px 12px;
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
  padding: 10px 24px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
  border: none;
  transition: all 0.3s;
  cursor: pointer;
}

.btn-apply:hover {
  background: #004570;
  transform: translateY(-2px);
}

.btn-reset {
  background: white;
  color: #374151;
  border: 1px solid #D1D5DB;
  padding: 10px 24px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.3s;
  cursor: pointer;
}

.btn-reset:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

/* Tren Section */
.tren-section {
  display: flex;
  flex-direction: column;
}

.s1-subtitle {
  font-size: 16px;
  font-weight: 700;
  color: #000;
}

.line-chart-container {
  margin-top: 20px;
  display: flex;
  gap: 16px;
  height: 200px;
}

.line-chart-y {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 30px;
  color: #6B7280;
  font-size: 11px;
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
  overflow: visible !important;
}

.line-svg path {
  fill: none !important;
  vector-effect: non-scaling-stroke !important;
  stroke-width: 3px !important;
  stroke-linecap: round;
  stroke-linejoin: round;
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
  height: 30px;
  margin-top: 8px;
}

.line-labels span {
  position: absolute;
  transform: translateX(-50%);
  color: #6B7280;
  font-size: 11px;
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

/* Top Lists Grid (Matches lists-grid in Pengadaan) */
.top-lists-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.top-list-card {
  padding: 24px;
  border-radius: 18px;
  color: white;
}

.navy-card {
  background-color: #00588F;
}

.empty-state-text {
  text-align: center;
  padding: 20px 0;
  color: #ddd;
  font-size: 14px;
  font-weight: 500;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  padding-bottom: 20px;
}

.top-items-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-item-row {
  background: white;
  padding: 10px 18px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  color: #333;
}

.item-rank {
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

.item-info {
  flex: 1;
  font-weight: 600;
  font-size: 13px;
}

.item-value-badge {
  background-color: #e6f1ff;
  color: #00588f;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 800;
  font-size: 11px;
}

@media (max-width: 1024px) {
  .yayasan-layout { grid-template-columns: 1fr; }
  .category-grid { grid-template-columns: repeat(2, 1fr); }
  .top-lists-grid { grid-template-columns: 1fr; }
}
</style>
