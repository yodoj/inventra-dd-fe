<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

// Store import
import { usePengadaanStore } from '@/stores/pengadaanAset';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

// Component Import
import ConfirmationModal from '@/components/ConfirmationModal.vue';

// Icon Import
import SearchIcon from '@/components/icons/SearchIcon.vue';
import EditIcon from '@/components/icons/EditIcon.vue';
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Plus, 
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-vue-next';

const router = useRouter();
const pengadaanStore = usePengadaanStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

// State management
const showDeleteModal = ref(false);
const selectedId = ref<string | null>(null);
const isDeleting = ref(false);
const searchQuery = ref('');

// Filter & Sorting state
const statusFilter = ref('');
const categoryFilter = ref('');
const sortBy = ref('waktuPengajuan');
const sortDirection = ref('DESC');

// Otorisasi dan akses
const isAuthorized = computed(() => {
  return ['ADMIN', 'SARPRAS', 'GURU'].includes(authStore.userRole || '');
});

// Aset hanya bisa diedit/hapus jika statusnya masih awal (Diajukan/Ditolak)
const canEditDelete = (status: string) => {
  return ['DIAJUKAN', 'DITOLAK'].includes(status?.toUpperCase());
};

const categories = [
  { label: 'Barang Habis Pakai', value: 'BARANG_HABIS_PAKAI' },
  { label: 'Barang Tidak Habis Pakai', value: 'BARANG_TIDAK_HABIS_PAKAI' }
];

const statuses = [
  { label: 'Diajukan', value: 'DIAJUKAN' },
  { label: 'Ditolak', value: 'DITOLAK' },
  { label: 'Disetujui Oleh Kepsek', value: 'DISETUJUI_OLEH_KEPSEK' },
  { label: 'Disetujui Oleh Yayasan', value: 'DISETUJUI_OLEH_YAYASAN' },
  { label: 'Dibeli', value: 'DIBELI' }
];

onMounted(() => {
  pengadaanStore.fetchMyPengadaan();
});

// Fungsi untuk menerapkan filter dan sorting
const handleApplyFilter = () => {
  const params: any = {};
  if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
  if (statusFilter.value) params.status = statusFilter.value;
  if (categoryFilter.value) params.kategori = categoryFilter.value;
  
  params.sortBy = sortBy.value;
  params.direction = sortDirection.value;
  
  pengadaanStore.fetchMyPengadaan(params);
};

// Fungsi untuk mereset filter dan menampilkan semua data kembali
const handleReset = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  categoryFilter.value = '';
  pengadaanStore.fetchMyPengadaan();
};

// Fungsi untuk mendapatkan kelas CSS berdasarkan status pengajuan
const getStatusClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'DIAJUKAN': return 'status-diajukan';
    case 'DITOLAK': return 'status-ditolak';
    case 'DISETUJUI_KEPSEK': return 'status-setuju-kepsek';
    case 'DISETUJUI_YAYASAN': return 'status-setuju-yayasan';
    case 'DIBELI': return 'status-dibeli';
    default: return '';
  }
};

// Fungsi untuk memformat teks kategori/status agar lebih user-friendly
const formatDisplay = (text: string) => {
  return text?.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// CRUD Actions
const confirmDelete = (id: string) => {
  selectedId.value = id;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!selectedId.value) return;
  
  isDeleting.value = true;
  try {
    await pengadaanStore.deletePengadaan(selectedId.value);
    toastStore.success('Success', 'Pengajuan pengadaan berhasil dihapus');
    showDeleteModal.value = false;
    selectedId.value = null;
    await pengadaanStore.fetchMyPengadaan();
  } catch (error: any) {
    toastStore.error('Error', error.response?.data?.message || 'Gagal menghapus data');
  } finally {
    isDeleting.value = false;
  }
};

// Fungsi untuk toggle sorting 
const toggleSort = (column: string) => {
  if (sortBy.value === column) {
    sortDirection.value = sortDirection.value === 'ASC' ? 'DESC' : 'ASC';
  } else {
    sortBy.value = column;
    sortDirection.value = 'DESC';
  }
  handleApplyFilter();
};

</script>

<template>
  <div v-if="isAuthorized" class="managed-pengadaan-page">
    <div class="container py-16">
      <div class="flex justify-between items-center mb-16">
        <h1 class="h2-headline">Pengajuan Pengadaan Aset</h1>
      </div>

      <div class="filter-card mb-20">
        <h3 class="s2-subtitle" style="margin-bottom: 12px;">Filter Pengajuan</h3>
        <div class="filter-grid">
          <div class="filter-item">
            <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Kategori Aset</label>
            <div class="custom-select">
              <select v-model="categoryFilter" :class="{ 'placeholder-color': !categoryFilter }">
                <option value="">Semua Kategori</option>
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>
          
          <div class="filter-item">
            <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Status Pengajuan</label>
            <div class="custom-select">
              <select v-model="statusFilter" :class="{ 'placeholder-color': !statusFilter }">
                <option value="">Semua Status</option>
                <option v-for="st in statuses" :key="st.value" :value="st.value">{{ st.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <div class="filter-item flex-grow">
            <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Cari Pengajuan</label>
            <div class="search-box">
              <SearchIcon class="search-icon" />
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Cari nama aset atau merk" 
                @keyup.enter="handleApplyFilter"
              />
            </div>
          </div>
        </div>
        <div class="filter-actions" style="margin-top: 10px;">
          <button @click="handleApplyFilter" class="btn-apply btn-medium">Terapkan Filter</button>
          <button @click="handleReset" class="btn-reset btn-medium">Reset</button>
        </div>
      </div>

      <div class="flex justify-end mb-16">
        <button 
          @click="router.push('/pengadaan/ajukan-pengadaan')" 
          class="btn-add"
        >
          <Plus class="w-5 h-5" /> Buat Pengajuan
        </button>
      </div>

      <div class="table-container shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr>
                <th class="col-waktu cursor-pointer" @click="toggleSort('waktuPengajuan')">
                  <div class="flex items-center justify-center gap-1">
                    Waktu Pengajuan
                    <ArrowUpDown v-if="sortBy !== 'waktuPengajuan'" class="w-3 h-3" />
                    <ArrowUp v-else-if="sortDirection === 'ASC'" class="w-3 h-3" />
                    <ArrowDown v-else class="w-3 h-3" />
                  </div>
                </th>
                <th class="col-img text-center">Foto</th>
                <th class="col-nama">Nama</th>
                <th class="col-merk">Merk</th>
                <th class="col-qty text-center">Qty</th>
                <th class="col-harga">Estimasi Harga</th>
                <th class="col-tanggal">Tanggal Pengadaan</th>
                <th class="col-kategori">Kategori</th>
                <th class="col-status text-center">Status</th>
                <th class="col-aksi text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pengadaanStore.isLoading">
                <td colspan="10" class="text-center py-8">Memuat data...</td>
              </tr>
              <tr v-else-if="pengadaanStore.listPengadaan.length === 0">
                <td colspan="10" class="text-center py-8 text-gray-500">
                  {{ searchQuery ? 'Pengajuan pengadaan tidak ditemukan' : 'Tidak ada pengajuan ditemukan' }}
                </td>
              </tr>
              <tr v-for="item in pengadaanStore.listPengadaan" :key="item.id_pengadaan">
                <td class="b3-body">{{ item.waktu_pengajuan }}</td>
                <td class="text-center">
                  <img :src="item.link_gambar" class="asset-img mx-auto" />
                </td>
                <td class="b2-body">{{ item.nama_aset }}</td>
                <td>{{ item.merk }}</td>
                <td class="text-center">{{ item.qty }}</td>
                <td>Rp{{ item.estimasi_harga?.toLocaleString() }}</td>
                <td>{{ item.tanggal_pengadaan }}</td>
                <td>{{ formatDisplay(item.kategori) }}</td>
                <td class="text-center">
                  <span :class="['badge', getStatusClass(item.status_pengadaan)]">
                    {{ formatDisplay(item.status_pengadaan) }}
                  </span>
                </td>
                <td>
                  <div class="flex justify-center gap-2">
                    <template v-if="canEditDelete(item.status_pengadaan)">
                      <button @click="router.push(`/pengadaan/pengajuan/update/${item.id_pengadaan}`)" class="btn-icon btn-edit">
                        <EditIcon class="w-4 h-4" />
                      </button>
                      <button @click="confirmDelete(item.id_pengadaan)" class="btn-icon btn-delete">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </template>
                    <button @click="router.push(`/pengadaan/pengajuan/detail/${item.id_pengadaan}`)" class="btn-icon btn-detail">
                      <Eye class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="forbidden-simple-wrapper">
    <p class="forbidden-text">Anda tidak memiliki izin untuk mengakses halaman ini</p>
  </div>

  <ConfirmationModal
    :show="showDeleteModal"
    title="Konfirmasi Penghapusan Pengajuan Pengadaan"
    message="Apakah Anda yakin ingin menghapus pengajuan ini?"
    confirm-text="Ya, Hapus"
    cancel-text="Batal"
    type="danger"
    :is-loading="isDeleting"
    @confirm="handleDelete"
    @cancel="showDeleteModal = false"
  />
</template>

<style scoped>
.managed-pengadaan-page {
  background-color: #FAFAFA;
  min-height: calc(100vh - 80px);
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

.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 14px;
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
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
  border: none;
}

.btn-reset {
  background-color: white;
  color: #333;
  border: 1px solid #D1D5DB;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
}

.btn-add {
  background-color: #00588F;
  color: white;
  padding: 12px 24px;
  border-radius: 40px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 88, 143, 0.2);
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
  padding: 14px 12px;
  font-size: 11px;
  text-align: center;
}

table td {
  padding: 12px;
  border-bottom: 1px solid #EEEEEE;
  font-size: 13px;
  text-align: center;
  vertical-align: middle;
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
  min-width: 80px;
  display: inline-block;
}

.status-diajukan {
  background-color: #F3F4F6;
  color: #4B5563;
}

.status-ditolak {
  background-color: #FEE2E2;
  color: #DC2626;
}

.status-setuju-kepsek {
  background-color: #ECF8FD;
  color: #1FA2FF;
  border: 1px solid #D1E9FF;
}

.status-setuju-yayasan {
  background-color: #FEF9C3;
  color: #A16207;
  border: 1px solid #FEF08A;
}

.status-dibeli {
  background-color: #ECFDF3;
  color: #065F46;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

.btn-edit {
  background-color: #00588F;
  color: white;
}

.btn-delete {
  background-color: #DC3545;
  color: white;
}

.btn-detail {
  background-color: #9CA3AF;
  color: white;
}

.col-waktu {
  width: 130px;
}

.col-img {
  width: 90px;
}

.col-nama {
  width: 140px;
}

.col-merk {
  width: 100px;
}

.col-qty {
  width: 60px;
}

.col-harga {
  width: 120px;
}

.col-tanggal {
  width: 130px;
}

.col-kategori {
  width: 140px;
}

.col-status {
  width: 150px;
}

.col-aksi {
  width: 120px;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.py-16 {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.mb-16 {
  margin-bottom: 1.5rem;
}

.mb-20 {
  margin-bottom: 2.5rem;
}

.forbidden-simple-wrapper {
  padding-top: 150px; 
  text-align: center;
  width: 100%;
  min-height: 100vh;
  background-color: #FAFAFA; 
}

.forbidden-text {
  font-size: 16px;
  font-weight: 500;
  color: #000000; 
}
</style>