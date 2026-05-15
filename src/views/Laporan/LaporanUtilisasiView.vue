<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useLaporanUtilisasiStore } from '@/stores/laporanUtilisasiStore';
import { useAuthStore } from '@/stores/auth';
import { Package, Building2, Search, FileText, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-vue-next';

const store = useLaporanUtilisasiStore();
const authStore = useAuthStore();

const activeTab = ref<'history' | 'frequency'>('history');

// Filter states
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const unitFilter = ref('Semua Unit');
const periodeBulan = ref<string>('Bulan');
const periodeTahun = ref<string>('Tahun');
const startDate = ref('');
const endDate = ref('');
const searchQuery = ref('');
const kategoriFilter = ref('Semua Kategori');

// Dropdown open states
const isMonthOpen = ref(false);
const isYearOpen = ref(false);

const closeDropdowns = () => {
  isMonthOpen.value = false;
  isYearOpen.value = false;
};

// Handle click outside
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.custom-select-wrapper')) {
    closeDropdowns();
  }
};

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
});

// Watcher to auto-fill dates when dropdown changes, but allow manual edits
watch([periodeBulan, periodeTahun], ([newBulan, newTahun]) => {
  const currentYear = new Date().getFullYear();
  const year = newTahun === 'Tahun' ? currentYear : parseInt(newTahun);
  
  if (newBulan !== 'Bulan') {
    const month = parseInt(newBulan) - 1;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
    startDate.value = start.toISOString().split('T')[0];
    endDate.value = end.toISOString().split('T')[0];
  } else if (newTahun !== 'Tahun') {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
    end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
    startDate.value = start.toISOString().split('T')[0];
    endDate.value = end.toISOString().split('T')[0];
  }
});

// Role & Unit checks
const userRole = computed(() => authStore.userRole || '');
const userUnit = computed(() => authStore.user?.unit || '');

const isLockedUnit = computed(() => {
  return userRole.value === 'KEPSEK' || userRole.value === 'SARPRAS';
});

const isDateRangeInvalid = computed(() => {
  if (startDate.value && endDate.value) {
    return new Date(startDate.value) > new Date(endDate.value);
  }
  return false;
});

// Dropdown options
const units = ['Semua Unit', 'KB-TK', 'SD', 'SMP', 'SMA'];
const months = [
  { label: 'Bulan', value: 'Bulan' },
  { label: 'Januari', value: '1' },
  { label: 'Februari', value: '2' },
  { label: 'Maret', value: '3' },
  { label: 'April', value: '4' },
  { label: 'Mei', value: '5' },
  { label: 'Juni', value: '6' },
  { label: 'Juli', value: '7' },
  { label: 'Agustus', value: '8' },
  { label: 'September', value: '9' },
  { label: 'Oktober', value: '10' },
  { label: 'November', value: '11' },
  { label: 'Desember', value: '12' }
];

const years = ['Tahun'];
for (let y = currentYear; y >= 1981; y--) {
  years.push(String(y));
}

const categories = [
  { label: 'Semua Kategori', value: 'Semua Kategori' },
  { label: 'Barang', value: 'BARANG' },
  { label: 'Ruangan', value: 'RUANGAN' }
];

// Pagination state
const limit = ref(10);
const currentPage = ref(1);

const loadData = async () => {
  const params: any = {
    page: currentPage.value,
    limit: limit.value
  };

  if (unitFilter.value !== 'Semua Unit') {
    params.unit = unitFilter.value;
  }
  
  if (startDate.value) {
    params.start_date = startDate.value;
  }
  if (endDate.value) {
    params.end_date = endDate.value;
  }
  if (periodeBulan.value !== 'Bulan') {
    params.period_type = 'monthly';
  } else if (periodeTahun.value !== 'Tahun') {
    params.period_type = 'yearly';
  } else if (startDate.value && endDate.value) {
    params.period_type = 'daily';
  }
  
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim();
  }
  if (kategoriFilter.value !== 'Semua Kategori') {
    params.kategori = kategoriFilter.value;
  }

  if (activeTab.value === 'history') {
    await store.fetchHistory(params);
  } else {
    await store.fetchFrequency(params);
  }
};

const handleApplyFilter = () => {
  currentPage.value = 1;
  loadData();
};

const handleResetFilter = () => {
  if (isLockedUnit.value) {
    unitFilter.value = userUnit.value || 'Semua Unit';
  } else {
    unitFilter.value = 'Semua Unit';
  }
  periodeBulan.value = 'Bulan';
  periodeTahun.value = 'Tahun';
  startDate.value = '';
  endDate.value = '';
  searchQuery.value = '';
  kategoriFilter.value = 'Semua Kategori';
  currentPage.value = 1;
  loadData();
};

watch(activeTab, () => {
  currentPage.value = 1;
  loadData();
});

watch(limit, () => {
  currentPage.value = 1;
  loadData();
});



onMounted(() => {
  if (isLockedUnit.value && userUnit.value) {
    unitFilter.value = userUnit.value;
  }
  loadData();
});

const nextPage = () => {
  if (currentPage.value < store.pagination.total_page) {
    currentPage.value++;
    loadData();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadData();
  }
};

const paginationRangeText = computed(() => {
  const { total_data, current_page, limit } = store.pagination;
  if (total_data === 0) return '0 items';
  const start = (current_page - 1) * limit + 1;
  const end = Math.min(current_page * limit, total_data);
  return `${start} - ${end} of ${total_data} items`;
});

const exportPdf = () => {
  window.print();
};
</script>

<template>
  <div class="laporan-utilisasi-page">
    <div class="container py-16">
      
      <!-- Header Section -->
      <div class="mb-16" style="margin-bottom: 28px;">
        <h1 class="h2-headline text-gray-900 font-bold text-3xl">Laporan Peminjaman Aset{{ isLockedUnit && userUnit ? ` - ${userUnit}` : '' }}</h1>
        <p class="text-gray-500 text-sm mt-1">Riwayat dan Frekuensi Peminjaman Aset</p>
      </div>

      <!-- Tab Switcher -->
      <div class="tab-switcher shadow-sm" style="margin-bottom: 36px;">
        <button 
          @click="activeTab = 'history'" 
          :class="['tab-btn', { active: activeTab === 'history' }]"
        >
          <Package class="w-5 h-5" /> Riwayat Peminjaman
        </button>
        <button 
          @click="activeTab = 'frequency'" 
          :class="['tab-btn', { active: activeTab === 'frequency' }]"
        >
          <Building2 class="w-5 h-5" /> Riwayat Frekuensi Peminjaman
        </button>
      </div>

      <!-- Filter Card -->
      <div class="filter-card" style="margin-bottom: 40px;">
        <h3 class="s2-subtitle" style="margin-bottom: 16px;">Filter Laporan</h3>
        
        <div class="filter-grid">
          <!-- Unit Filter -->
          <div v-if="!isLockedUnit" class="filter-item" style="min-width: 140px; flex: 1;">
            <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Unit</label>
            <div class="custom-select">
              <select v-model="unitFilter">
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <!-- Periode Filter -->
          <div class="filter-item" style="min-width: 200px; flex: 1.5;">
            <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Periode</label>
            <div class="flex gap-2">
              <div class="custom-select-wrapper flex-1">
                <div class="select-trigger" @click.stop="isMonthOpen = !isMonthOpen; isYearOpen = false">
                  {{ months.find(m => m.value === periodeBulan)?.label || 'Bulan' }}
                  <ChevronDown class="select-icon" />
                </div>
                <div v-if="isMonthOpen" class="options-container">
                  <div 
                    v-for="m in months" 
                    :key="m.value" 
                    class="option-item"
                    @click="periodeBulan = m.value; isMonthOpen = false"
                  >
                    {{ m.label }}
                  </div>
                </div>
              </div>
              <div class="custom-select-wrapper flex-1">
                <div class="select-trigger" @click.stop="isYearOpen = !isYearOpen; isMonthOpen = false">
                  {{ periodeTahun }}
                  <ChevronDown class="select-icon" />
                </div>
                <div v-if="isYearOpen" class="options-container">
                  <div 
                    v-for="y in years" 
                    :key="y" 
                    class="option-item"
                    @click="periodeTahun = y; isYearOpen = false"
                  >
                    {{ y }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Custom Date Range -->
          <div class="filter-item flex flex-col" style="min-width: 280px; flex: 2;">
            <div class="flex gap-2">
              <div class="flex-1">
                <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">From</label>
                <input type="date" v-model="startDate" class="date-input" :class="{ 'border-red-500': isDateRangeInvalid }" />
              </div>
              <div class="flex-1">
                <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">To</label>
                <input type="date" v-model="endDate" class="date-input" :class="{ 'border-red-500': isDateRangeInvalid }" />
              </div>
            </div>
            <!-- Error Message underneath the pickers without shifting layout -->
            <div class="relative h-0">
              <p v-if="isDateRangeInvalid" class="absolute top-1 left-0 text-red-500 text-[10px] italic leading-tight whitespace-nowrap">
                Rentang tanggal tidak valid: 'From' tidak boleh lebih besar dari 'To'
              </p>
            </div>
          </div>

          <!-- Kategori Filter -->
          <div v-if="activeTab === 'frequency'" class="filter-item" style="min-width: 160px; flex: 1.2;">
            <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Kategori Aset</label>
            <div class="custom-select">
              <select v-model="kategoriFilter">
                <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <!-- Search Input -->
          <!-- Search Bar -->
          <div class="filter-item flex-grow" style="min-width: 250px;">
            <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Cari Aset</label>
            <div class="search-box">
              <Search class="search-icon" />
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Cari nama peminjam atau aset" 
                @keyup.enter="handleApplyFilter"
              />
            </div>
          </div>
        </div>

        <!-- Filter Actions -->
        <div class="filter-actions" style="margin-top: 24px;">
          <button 
            @click="handleApplyFilter" 
            class="btn-apply btn-medium" 
            :disabled="isDateRangeInvalid"
            :class="{ 'opacity-50 cursor-not-allowed': isDateRangeInvalid }"
          >
            Terapkan Filter
          </button>
          <button @click="handleResetFilter" class="btn-reset btn-medium">Reset</button>
        </div>
      </div>

      <!-- Table Header & Export Section -->
      <div class="flex justify-between items-center" style="margin-bottom: 20px;">
        <h2 style="font-size: 20px; font-weight: 700; color: #111827;">
          {{ activeTab === 'history' ? 'Daftar Riwayat Peminjaman' : 'Daftar Frekuensi Peminjaman' }}
        </h2>
        <button @click="exportPdf" class="btn-export">
          <FileText class="w-4 h-4" /> Export PDF
        </button>
      </div>

      <!-- Table Container -->
      <div class="table-container shadow-sm printable-area">
        <div class="overflow-x-auto">
          
          <!-- Tabel Riwayat Peminjaman -->
          <table v-if="activeTab === 'history'" class="w-full text-left border-collapse">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th style="width: 150px;">Nama Peminjam</th>
                <th style="width: 220px;">Aset</th>
                <th style="width: 70px;">Qty</th>
                <th style="width: 90px;">Unit</th>
                <th style="width: 150px;">Waktu Peminjaman</th>
                <th style="width: 150px;">Waktu Pengembalian</th>
                <th style="width: 200px;">Tujuan Peminjaman</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.isLoading">
                <td colspan="8" class="text-center py-8 text-gray-500">Memuat data riwayat...</td>
              </tr>
              <tr v-else-if="store.historyList.length === 0">
                <td colspan="8" class="text-center py-8 text-[#6B7280] bg-white text-sm">
                  Data peminjaman tidak ditemukan
                </td>
              </tr>
              <tr v-else v-for="(item, index) in store.historyList" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td class="b3-body text-center">
                  {{ (store.pagination.current_page - 1) * store.pagination.limit + index + 1 }}
                </td>
                <td class="b2-body text-center">{{ item.nama_peminjam }}</td>
                <td class="b2-body text-center">{{ item.aset }}</td>
                <td class="b3-body text-center">{{ item.qty }}</td>
                <td class="b2-body text-center font-bold">{{ item.unit }}</td>
                <td class="b3-body text-center">{{ item.waktu_peminjaman }}</td>
                <td class="b3-body text-center">{{ item.waktu_pengembalian }}</td>
                <td class="b3-body" style="text-align: left; padding-left: 16px;">{{ item.tujuan }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Tabel Frekuensi Peminjaman -->
          <table v-else class="w-full text-left border-collapse">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th style="width: 250px;">Aset</th>
                <th style="width: 180px;">Kategori</th>
                <th style="width: 100px;">Unit</th>
                <th style="width: 160px;">Frekuensi Peminjaman</th>
                <th style="width: 160px;">Total Durasi Peminjaman</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.isLoading">
                <td colspan="6" class="text-center py-8 text-gray-500">Memuat data frekuensi...</td>
              </tr>
              <tr v-else-if="store.frequencyList.length === 0">
                <td colspan="6" class="text-center py-8 text-[#6B7280] bg-white text-sm">
                  Data frekuensi tidak ditemukan
                </td>
              </tr>
              <tr v-else v-for="(item, index) in store.frequencyList" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td class="b3-body text-center">
                  {{ (store.pagination.current_page - 1) * store.pagination.limit + index + 1 }}
                </td>
                <td class="b2-body text-center font-bold">{{ item.aset }}</td>
                <td class="b3-body text-center">{{ item.kategori }}</td>
                <td class="b2-body text-center font-bold">{{ item.unit }}</td>
                <td class="text-center">
                  <p class="font-bold text-xs text-gray-900">{{ item.frekuensi_peminjaman }}</p>
                  <p class="text-[10px] text-gray-400 mt-0.5">{{ item.periode }}</p>
                </td>
                <td class="b3-body text-center">{{ item.total_durasi_peminjaman }}</td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>

      <!-- Pagination (Matched with Pengelolaan Profile) -->
      <div class="pagination-section mt-20 mb-8">
        <div class="flex items-center gap-4">
          <p class="text-xs font-semibold text-gray-500">
            Showing Page {{ store.pagination.current_page }} of {{ store.pagination.total_page || 1 }}
          </p>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-gray-500">Per page:</span>
            <div class="pagination-select-wrapper">
              <select v-model="limit" class="pagination-select">
                <option :value="10">10</option>
                <option :value="30">30</option>
                <option :value="50">50</option>
              </select>
              <ChevronDown class="pagination-select-icon" />
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            @click="prevPage" 
            :disabled="store.pagination.current_page <= 1"
            class="btn-pagination"
          >
            <ChevronLeft class="w-3.5 h-3.5" /> Previous
          </button>
          <button 
            @click="nextPage" 
            :disabled="store.pagination.current_page >= store.pagination.total_page"
            class="btn-pagination"
          >
            Next <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.laporan-utilisasi-page {
  background-color: #FAFAFA;
  min-height: calc(100vh - 80px);
}

.tab-switcher {
  display: flex;
  background-color: #EFEFEF;
  border-radius: 12px;
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  font-weight: 700;
  font-size: 14px;
  color: #4B5563;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn.active {
  background-color: #00588F;
  color: white;
}

.filter-card {
  background: white;
  padding: 24px 28px 20px;
  border-radius: 16px;
  border: 1px solid #EEEEEE;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.filter-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.custom-select-wrapper {
  position: relative;
}

.select-trigger {
  width: 100%;
  padding: 10px 16px;
  padding-right: 40px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  min-height: 42px;
  display: flex;
  align-items: center;
  color: #374151;
  transition: border-color 0.2s;
}

.select-trigger:hover {
  border-color: #00588F;
}

.options-container {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.option-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background-color 0.2s;
}

.option-item:hover {
  background-color: #F3F4F6;
  color: #00588F;
}

.custom-select {
  position: relative;
}

.custom-select select {
  width: 100%;
  padding: 12px 16px;
  padding-right: 40px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.placeholder-color {
  color: #9CA3AF !important;
}

.select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  pointer-events: none;
  color: #6B7280;
}

.date-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  outline: none;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
}
.search-box input::placeholder {
  color: #9CA3AF;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #6B7280;
  width: 18px;
  height: 18px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-apply {
  background-color: #00588F;
  color: white;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
  border: none;
}

.btn-export {
  background-color: #DC3545;
  color: white;
  padding: 10px 20px;
  border-radius: 40px;
  cursor: pointer;
  border: none;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s;
}
.btn-export:hover {
  background-color: #C82333;
}

.btn-pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid #D1D5DB;
  background-color: white;
  color: #4B5563;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-pagination:hover:not(:disabled) {
  background-color: #F9FAFB;
  border-color: #9CA3AF;
}
.btn-pagination:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.pagination-select {
  background-color: white;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  padding: 4px 28px 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  transition: border-color 0.2s;
}
.pagination-select-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  pointer-events: none;
  color: #6B7280;
}
.pagination-select:focus {
  border-color: #00588F;
}

.btn-reset {
  background-color: white;
  color: #333;
  border: 1px solid #D1D5DB;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #EEEEEE;
}

table thead {
  background-color: #00588F;
  color: white;
}

table th {
  padding: 16px 14px;
  font-size: 11px;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.15);
}
table th:last-child {
  border-right: none;
}

table td {
  padding: 16px 14px;
  border: 1px solid #EEEEEE;
  font-size: 13px;
  text-align: center;
  vertical-align: middle;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.py-16 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

@media print {
  body * {
    visibility: hidden;
  }
  .printable-area, .printable-area * {
    visibility: visible;
  }
  .printable-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    box-shadow: none;
    border: none;
  }
}
</style>
