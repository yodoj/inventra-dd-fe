<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useAssetStore } from '@/stores/asset';
import { useAuthStore } from '@/stores/auth';
import SearchIcon from '@/components/icons/SearchIcon.vue';
import EditIcon from '@/components/icons/EditIcon.vue';
import { Package, Home, ChevronDown, ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import 'primeicons/primeicons.css';
import ConfirmationModal from '@/components/ConfirmationModal.vue';

const router = useRouter();
const assetStore = useAssetStore();
const authStore = useAuthStore();

const activeTab = ref<'barang' | 'ruangan'>('barang');
const searchQuery = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');

const currentPage = ref(0);
const pageSize = 50;

const showDeleteModal = ref(false);
const assetToDelete = ref<any>(null);
const isDeleting = ref(false);

// Enums from backend
const categoriesBarang = [
  { label: 'Barang Habis Pakai', value: 'BARANG_HABIS_PAKAI' },
  { label: 'Barang Tidak Habis Pakai', value: 'BARANG_TIDAK_HABIS_PAKAI' }
];

const categoriesRuangan = [
  { label: 'Ruang Kelas', value: 'RUANG_KELAS' },
  { label: 'Ruang Non Kelas', value: 'RUANG_NON_KELAS' }
];

const statuses = [
  { label: 'Tersedia', value: 'TERSEDIA' },
  { label: 'Habis', value: 'HABIS' },
  { label: 'Rusak', value: 'RUSAK' },
  { label: 'Sedang Perbaikan', value: 'SEDANG_PERBAIKAN' },
  { label: 'Sedang Dipinjam', value: 'SEDANG_DIPINJAM' },
  { label: 'Dimusnahkan', value: 'DIMUSNAHKAN' }
];

const isSarprasOrYayasan = computed(() => {
  return ['SARPRAS', 'YAYASAN', 'ADMIN'].includes(authStore.userRole || '');
});

const canSeeUnit = computed(() => isSarprasOrYayasan.value);
const canSeeAction = computed(() => isSarprasOrYayasan.value);

const handleTabChange = (tab: 'barang' | 'ruangan') => {
  activeTab.value = tab;
  currentPage.value = 0;
  loadAssets();
};

const loadAssets = () => {
  const filters: any = {};
  if (searchQuery.value) filters.search = searchQuery.value;
  if (categoryFilter.value) filters.category = categoryFilter.value;
  if (statusFilter.value) filters.status = statusFilter.value;

  assetStore.fetchAssets(activeTab.value, currentPage.value, pageSize, filters);
};

const handleFilter = () => {
  currentPage.value = 0;
  loadAssets();
};

const handleReset = () => {
  searchQuery.value = '';
  categoryFilter.value = '';
  statusFilter.value = '';
  currentPage.value = 0;
  loadAssets();
};

const nextPage = () => {
  if (currentPage.value < assetStore.totalPages - 1) {
    currentPage.value++;
    loadAssets();
  }
};

const confirmDelete = (asset: any) => {
  assetToDelete.value = asset;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!assetToDelete.value) return;
  
  isDeleting.value = true;
  try {
    if (activeTab.value === 'barang') {
      await assetStore.deleteAssetBarang(assetToDelete.value.id_aset);
    } else {
      await assetStore.deleteAssetRuangan(assetToDelete.value.id_aset);
    }
    showDeleteModal.value = false;
    assetToDelete.value = null;
    loadAssets();
  } catch (error) {
    console.error('Failed to delete asset:', error);
  } finally {
    isDeleting.value = false;
  }
};

const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--;
    loadAssets();
  }
};

onMounted(() => {
  loadAssets();
});

// Helper for status badge colors
const getStatusClass = (status: string) => {
  switch (status.toUpperCase()) {
    case 'TERSEDIA': return 'status-tersedia';
    case 'HABIS': return 'status-habis';
    case 'SEDANG_PERBAIKAN': return 'status-diperbaiki';
    case 'RUSAK': return 'status-rusak';
    case 'SEDANG_DIPINJAM': return 'status-dipinjam';
    case 'DIMUSNAHKAN': return 'status-dimusnahkan';
    default: return '';
  }
};

const formatStatusDisplay = (status: string) => {
  return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const transformImageUrl = (url: string) => {
  if (!url) return 'https://via.placeholder.com/80x60?text=No+Image';
  
  // Handle Google Search Redirects
  if (url.includes('google.com/url?')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const targetUrl = urlParams.get('url');
    if (targetUrl) return transformImageUrl(targetUrl); // Recurse to handle potentially escaped links
  }

  // Handle Google Drive links
  if (url.includes('drive.google.com')) {
    const match = url.match(/[-\w]{25,}/);
    if (match) {
      return `https://drive.google.com/uc?id=${match[0]}`;
    }
  }
  return url;
};
const canModifyAsset = (asset: any) => {
  if (['YAYASAN', 'ADMIN'].includes(authStore.userRole || '')) return true;
  if (authStore.userRole === 'SARPRAS') {
    return asset.unit === authStore.user?.unit;
  }
  return false;
};

const handleEdit = (asset: any) => {
  const path = activeTab.value === 'barang' ? '/assets/ubah-barang/' : '/assets/ubah-ruangan/';
  router.push(path + asset.id_aset);
};
</script>

<template>
  <div class="managed-assets-page">
    <div class="container py-16">
      <div class="flex justify-between items-center mb-16">
        <h1 class="h2-headline">Daftar Aset</h1>
        <button 
          v-if="isSarprasOrYayasan"
          @click="router.push(activeTab === 'barang' ? '/assets/tambah-barang' : '/assets/tambah-ruangan')" 
          class="btn-add"
        >
          <Plus class="w-5 h-5" /> Tambah Aset
        </button>
      </div>

      <!-- Tab Switcher -->
      <div class="tab-switcher mb-20">
        <button 
          @click="handleTabChange('barang')" 
          :class="['tab-btn', { active: activeTab === 'barang' }]"
        >
          <Package class="icon-md" /> Aset Barang
        </button>
        <button 
          @click="handleTabChange('ruangan')" 
          :class="['tab-btn', { active: activeTab === 'ruangan' }]"
        >
          <Home class="icon-md" /> Aset Ruangan
        </button>
      </div>

      <!-- Filter Section -->
      <div class="filter-card mb-20">
        <h3 class="s2-subtitle mb-4">Filter Aset</h3>
        <div class="filter-grid">
          <div class="filter-item">
            <label class="c2-caption mb-2 block">Kategori Aset</label>
            <div class="custom-select">
              <select v-model="categoryFilter" :class="{ 'placeholder-color': !categoryFilter }">
                <option value="">Kategori</option>
                <option v-for="cat in (activeTab === 'barang' ? categoriesBarang : categoriesRuangan)" :key="cat.value" :value="cat.value">
                  {{ cat.label }}
                </option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>
          <div class="filter-item">
            <label class="c2-caption mb-2 block">Status Aset</label>
            <div class="custom-select">
              <select v-model="statusFilter" :class="{ 'placeholder-color': !statusFilter }">
                <option value="">Semua Status</option>
                <option v-for="st in statuses" :key="st.value" :value="st.value">{{ st.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>
          <div class="filter-item flex-grow">
            <label class="c2-caption mb-2 block">Cari Aset</label>
            <div class="search-box">
              <SearchIcon class="search-icon" />
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Search" 
                @keyup.enter="handleFilter"
              />
            </div>
          </div>
        </div>
        <div class="filter-actions mt-6">
          <button @click="handleFilter" class="btn-apply btn-medium">Terapkan Filter</button>
          <button @click="handleReset" class="btn-reset btn-medium">Reset</button>
        </div>
      </div>

      <!-- Table Section -->
      <div class="table-container shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Gambar</th>
                <th>Nama</th>
                <th v-if="activeTab === 'barang'">Merk</th>
                <th v-if="activeTab === 'barang'">Qty</th>
                <th v-if="canSeeUnit">Unit</th>
                <th v-if="activeTab === 'barang'">Lokasi</th>
                <th>Kategori</th>
                <th>Status</th>
                <th>Keterangan</th>
                <th v-if="canSeeAction" class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="assetStore.isLoading">
                <td colspan="11" class="text-center py-8">Memuat data...</td>
              </tr>
              <tr v-else-if="assetStore.assets.length === 0">
                <td colspan="11" class="text-center py-8 text-gray-500">Tidak ada data ditemukan</td>
              </tr>
              <tr v-for="asset in assetStore.assets" :key="asset.id_aset">
                <td class="b3-body">{{ asset.kode_aset }}</td>
                <td>
                  <img :src="transformImageUrl(asset.gambar_url_aset)" class="asset-img" />
                </td>
                <td class="b2-body">{{ asset.nama_aset }}</td>
                <td v-if="activeTab === 'barang'">{{ asset.merk_aset || '-' }}</td>
                <td v-if="activeTab === 'barang'" class="text-center">{{ asset.qty_aset || 0 }}</td>
                <td v-if="canSeeUnit">{{ asset.unit }}</td>
                <td v-if="activeTab === 'barang'">{{ asset.lokasi_aset || '-' }}</td>
                <td>{{ formatStatusDisplay(asset.kategori_aset) }}</td>
                <td>
                  <span :class="['badge', getStatusClass(asset.status_aset)]">
                    {{ formatStatusDisplay(asset.status_aset) }}
                  </span>
                </td>
                <td class="b3-body max-w-[200px] truncate">{{ asset.keterangan_aset }}</td>
                <td v-if="canSeeAction">
                  <div class="flex justify-center gap-2">
                    <button 
                      v-if="canModifyAsset(asset)"
                      @click="handleEdit(asset)" 
                      class="btn-icon btn-edit" 
                      title="Ubah"
                    >
                      <EditIcon class="w-4 h-4" />
                    </button>
                    <button 
                      v-if="canModifyAsset(asset)"
                      @click="confirmDelete(asset)" 
                      class="btn-icon btn-delete" 
                      title="Hapus"
                    >
                      <Trash2 class="icon-sm" />
                    </button>
                    <span v-if="!canModifyAsset(asset)" class="text-xs text-gray-400 italic">No Access</span>
                  </div>
                </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination-section mt-12 mb-8">
          <p class="c2-caption text-gray-500">
            Showing Page {{ assetStore.currentPage + 1 }} of {{ assetStore.totalPages }}
          </p>
          <div class="pagination-btns">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 0" 
              class="btn-page"
            >
              <ChevronLeft class="icon-sm" /> Previous
            </button>
            <button 
              @click="nextPage" 
              :disabled="currentPage >= assetStore.totalPages - 1" 
              class="btn-page"
            >
              Next <ChevronRight class="icon-sm" />
            </button>
          </div>
      </div>
    </div>
  </div>

  <ConfirmationModal
    :show="showDeleteModal"
    title="Konfirmasi Hapus Aset"
    :message="`Apakah Anda yakin ingin menghapus aset '${assetToDelete?.nama_aset}'? Tindakan ini tidak dapat dibatalkan.`"
    confirm-text="Ya, Hapus"
    cancel-text="Batal"
    type="danger"
    :is-loading="isDeleting"
    @confirm="handleDelete"
    @cancel="showDeleteModal = false"
  />
</template>

<style scoped>
.managed-assets-page {
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
  color: var(--text-primary);
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
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #EEEEEE;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.filter-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  min-width: 200px;
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
  background-image: none !important;
}

.custom-select select::-ms-expand {
  display: none;
}

.custom-select select:focus {
  border-color: #00588F;
}

.custom-select select.placeholder-color {
  color: #9CA3AF;
}

.search-box input::placeholder {
  color: #9CA3AF;
}

select option {
  color: #374151;
}

.select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  pointer-events: none;
  color: #6B7280;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6B7280;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-apply {
  background-color: #00588F;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
}

.btn-reset {
  background-color: white;
  color: var(--text-primary);
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
  padding: 14px 16px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

table td {
  padding: 12px 16px;
  border-bottom: 1px solid #EEEEEE;
  vertical-align: middle;
  font-size: 14px;
}

.asset-img {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #EEEEEE;
}

.badge {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  display: inline-block;
  text-align: center;
  min-width: 80px;
}

.status-tersedia { background-color: #ECF8FD; color: #1FA2FF; }
.status-habis { background-color: #FBE5E6; color: #DC3545; }
.status-diperbaiki { background-color: #FFEED9; color: #AA5B00; }
.status-rusak { background-color: #EFEFEF; color: #333437; }

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-edit { background-color: #00588F; color: white; }
.btn-delete { background-color: #DC3545; color: white; }

.btn-icon:hover { transform: scale(1.1); }

/* Ensure Action column doesn't wrap or overflow */
td:last-child {
  min-width: 100px;
}

.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-btns {
  display: flex;
  gap: 8px;
}

.btn-page {
  padding: 8px 16px;
  border-radius: 8px;
  background: white;
  border: 1px solid #D1D5DB;
  font-size: 12px;
  cursor: pointer;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add {
  background-color: #00588F;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 40px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  box-shadow: 0 4px 12px rgba(0, 88, 143, 0.2);
}

.btn-add:hover {
  background-color: #004470;
}

.py-16 {
  padding-top: 32px;
  padding-bottom: 32px;
}

.mb-16 {
  margin-bottom: 32px;
}

.mb-20 {
  margin-bottom: 40px;
}

</style>
