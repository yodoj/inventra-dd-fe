<script setup lang="ts">
import { ref, onMounted, computed, watch, markRaw } from 'vue';
import { useAssetStore } from '@/stores/asset';
import { useAuthStore } from '@/stores/auth';
import SearchIcon from '@/components/icons/SearchIcon.vue';
import EditIcon from '@/components/icons/EditIcon.vue';
import { Package, Home, ChevronDown, ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import 'primeicons/primeicons.css';
import ConfirmationModal from '@/components/ConfirmationModal.vue';
import { useToastStore } from '@/stores/toast';

const router = useRouter();
const assetStore = useAssetStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const activeTab = ref<'barang' | 'ruangan'>('barang');
const searchQuery = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');
const unitFilter = ref('');

const units = ['KB-TK', 'SD', 'SMP', 'SMA'];

const currentPage = ref(0);
const pageSize = ref(10);

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

const availableStatuses = computed(() => {
  if (activeTab.value === 'ruangan') {
    return statuses.filter(s => ['TERSEDIA', 'SEDANG_PERBAIKAN', 'SEDANG_DIPINJAM'].includes(s.value));
  }
  
  if (categoryFilter.value === 'BARANG_HABIS_PAKAI') {
    return statuses.filter(s => ['TERSEDIA', 'HABIS'].includes(s.value));
  }
  
  if (categoryFilter.value === 'BARANG_TIDAK_HABIS_PAKAI') {
    return statuses.filter(s => ['TERSEDIA', 'RUSAK', 'SEDANG_PERBAIKAN', 'DIMUSNAHKAN', 'SEDANG_DIPINJAM'].includes(s.value));
  }
  
  return statuses;
});

watch([activeTab, categoryFilter], () => {
  statusFilter.value = '';
});

const isSarprasOrYayasan = computed(() => {
  return ['SARPRAS', 'YAYASAN', 'ADMIN'].includes(authStore.userRole || '');
});

const canSeeUnit = computed(() => isSarprasOrYayasan.value);
const canSeeAction = computed(() => isSarprasOrYayasan.value);

const totalColumns = computed(() => {
  let cols = activeTab.value === 'barang' ? 8 : 5; // Base columns
  if (canSeeUnit.value) cols++;
  if (canSeeAction.value) cols++;
  if (activeTab.value === 'barang') cols++; // For merk column which is only in barang
  return cols;
});

const handleTabChange = (tab: 'barang' | 'ruangan') => {
  activeTab.value = tab;
  currentPage.value = 0;
  loadAssets();
};

const loadAssets = () => {
  const filters: any = {};
  if (searchQuery.value) filters.search = searchQuery.value;
  if (categoryFilter.value) filters.kategori = categoryFilter.value;
  if (statusFilter.value) filters.status = statusFilter.value;
  if (unitFilter.value) filters.unit = unitFilter.value;

  assetStore.fetchAssets(activeTab.value, currentPage.value, pageSize.value, filters);
};

watch(pageSize, () => {
  currentPage.value = 0;
  loadAssets();
});

const handleFilter = () => {
  currentPage.value = 0;
  loadAssets();
};

const handleReset = () => {
  searchQuery.value = '';
  categoryFilter.value = '';
  statusFilter.value = '';
  unitFilter.value = '';
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
      toastStore.success('Success', 'Aset barang berhasil dihapus');
    } else {
      await assetStore.deleteAssetRuangan(assetToDelete.value.id_aset);
      toastStore.success('Success', 'Aset ruangan berhasil dihapus');
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

      <AssetFilter 
        :active-tab="activeTab"
        :is-sarpras-or-yayasan="isSarprasOrYayasan"
        @filter="handleFilterChange"
        @reset="handleReset"
      />
      
      <!-- Add Button Positioned Above Table -->
      <div v-if="isSarprasOrYayasan" class="flex justify-end mb-16">
        <button 
          @click="router.push(activeTab === 'barang' ? '/assets/tambah-barang' : '/assets/tambah-ruangan')" 
          class="btn-add"
        >
          <Plus class="w-5 h-5" /> Tambah Aset
        </button>
      </div>

      <!-- Table Section -->
      <div class="table-container shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr>
                <th class="col-kode">Kode</th>
                <th class="col-img">Gambar</th>
                <th class="col-nama">Nama</th>
                <th v-if="activeTab === 'barang'" class="col-merk">Merk</th>
                <th v-if="activeTab === 'barang'" class="col-qty">Qty</th>
                <th v-if="canSeeUnit" class="col-unit">Unit</th>
                <th v-if="activeTab === 'barang'" class="col-lokasi">Lokasi</th>
                <th class="col-kategori">Kategori</th>
                <th class="col-status text-center">Status</th>
                <th class="col-keterangan">Keterangan</th>
                <th v-if="canSeeAction" class="col-aksi text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="assetStore.isLoading">
                <td :colspan="totalColumns" class="text-center py-8">Memuat data...</td>
              </tr>
              <tr v-else-if="assetStore.assets.length === 0">
                <td :colspan="totalColumns" class="text-center py-8 text-gray-500">Tidak ada data ditemukan</td>
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
                <td class="text-center">
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
        <div class="pagination-section mt-20 mb-8">
          <div class="flex items-center gap-4">
            <p class="c2-caption text-gray-500">
              Showing Page {{ assetStore.currentPage + 1 }} of {{ assetStore.totalPages }}
            </p>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">Per page:</span>
              <div class="custom-select page-size-wrapper">
                <select v-model="pageSize" class="page-size-select">
                  <option :value="10">10</option>
                  <option :value="30">30</option>
                  <option :value="50">50</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>
          </div>
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

/* Filter styles moved to AssetFilter.vue */

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

table {
  table-layout: fixed;
  width: 100%;
}

table th {
  padding: 14px 12px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  word-wrap: break-word;
}

.col-kode { width: 80px; }
.col-img { width: 85px; }
.col-nama { width: 130px; }
.col-merk { width: 90px; }
.col-qty { width: 65px; }
.col-unit { width: 70px; }
.col-lokasi { width: 110px; }
.col-kategori { width: 100px; }
.col-status { width: 90px; }
.col-aksi { width: 100px; }
.col-keterangan { width: 160px; }

table td {
  padding: 12px 12px;
  border-bottom: 1px solid #EEEEEE;
  vertical-align: middle;
  font-size: 13px;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.asset-img {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #EEEEEE;
}

.badge {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  display: inline-block;
  text-align: center;
  min-width: 70px;
  line-height: 1.2;
}

.status-tersedia { background-color: #E6F7F0; color: #008B58; }
.status-dipinjam { background-color: #ECF8FD; color: #1FA2FF; }
.status-habis { background-color: #FBE5E6; color: #DC3545; }
.status-diperbaiki { background-color: #FEF9C3; color: #A16207; }
.status-rusak { background-color: #EFEFEF; color: #333437; }
.status-dimusnahkan { background-color: #F3F4F6; color: #6B7280; }

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
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  background: white;
  border: 1px solid #D1D5DB;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: #F9FAFB;
  border-color: #00588F;
  color: #00588F;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-size-wrapper {
  width: 80px;
}

.page-size-select {
  width: 100%;
  padding: 6px 32px 6px 12px !important;
  border-radius: 8px;
  border: 1px solid #D1D5DB;
  font-size: 13px;
  outline: none;
  background-color: white;
  cursor: pointer;
  transition: all 0.2s;
  color: #374151;
  font-weight: 500;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.page-size-wrapper .select-icon {
  width: 14px;
  height: 14px;
}

.page-size-select:hover {
  border-color: #00588F;
}

.page-size-select:focus {
  border-color: #00588F;
  box-shadow: 0 0 0 2px rgba(0, 88, 143, 0.1);
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

.mt-20 {
  margin-top: 40px;
}


</style>
