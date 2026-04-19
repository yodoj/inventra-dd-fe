<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { usePeminjamanStore } from '@/stores/peminjaman';
import { useTinjauPeminjamanStore } from '@/stores/tinjauPeminjaman';
import { useAuthStore } from '@/stores/auth';
import { useRouter, useRoute } from 'vue-router';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  ClipboardList,
  ArrowRightLeft,
  Eye
} from 'lucide-vue-next';
import 'primeicons/primeicons.css'
import SearchIcon from '@/components/icons/SearchIcon.vue';
import EditIcon from '@/components/icons/EditIcon.vue';
import ConfirmationModal from '@/components/ConfirmationModal.vue';
import { useToastStore } from '@/stores/toast';

const router = useRouter();
const route = useRoute();
const peminjamanStore = usePeminjamanStore();
const tinjauStore = useTinjauPeminjamanStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const activeTab = ref<'persetujuan' | 'lintas-unit'>(
  route.path.endsWith('/tinjau') ? 'persetujuan' : 'lintas-unit'
);
const searchQuery = ref('');
const statusFilter = ref('');
const unitFilter = ref('');
const categoryGroupFilter = ref('');
const currentPage = ref(0);
const pageSize = ref(10);

const showDeleteModal = ref(false);
const loanToDelete = ref<any>(null);
const isDeleting = ref(false);

const isSarprasOrAdmin = computed(() => {
  return ['SARPRAS', 'ADMIN', 'SUPERADMIN'].includes(authStore.userRole || '');
});
const isSuperAdmin = computed(() => ['ADMIN', 'SUPERADMIN'].includes(authStore.userRole || ''));
const isSarpras = computed(() => authStore.userRole === 'SARPRAS');

const units = ['KB-TK', 'SD', 'SMP', 'SMA'];
const categories = [
  { label: 'Barang', value: 'BARANG' },
  { label: 'Ruangan', value: 'RUANGAN' }
];
const statuses = [
  { label: 'Diajukan', value: 'DIAJUKAN' },
  { label: 'Disetujui', value: 'DISETUJUI' },
  { label: 'Ditolak', value: 'DITOLAK' },
  { label: 'Dibatalkan', value: 'DIBATALKAN' }
];

const loadLoans = async () => {
  const filters: any = {};
  if (searchQuery.value) filters.search = searchQuery.value;
  if (statusFilter.value) filters.status = statusFilter.value;
  if (unitFilter.value) filters.unit = unitFilter.value;

  if (activeTab.value === 'lintas-unit') {
    await peminjamanStore.fetchLoansLintasUnit(currentPage.value, pageSize.value, filters);
  } else {
    await tinjauStore.fetchAll();
  }
};

onMounted(() => {
  if (!isSarprasOrAdmin.value) {
      // For Siswa/Guru, they don't have tabs, just Internal Loans
      peminjamanStore.fetchLoans(currentPage.value, pageSize.value);
  } else {
      loadLoans();
  }
});

watch(activeTab, (newTab) => {
  if (newTab === 'persetujuan') {
    router.push('/peminjaman/tinjau');
  } else {
    router.push('/peminjaman');
  }
  
  currentPage.value = 0;
  loadLoans();
});

// Watch perubahan URL (misal user klik tombol back di browser)
watch(
  () => route.path,
  (newPath) => {
    activeTab.value = newPath.endsWith('/tinjau') ? 'persetujuan' : 'lintas-unit';
    loadLoans(); 
  }
);

const handleFilter = () => {
  currentPage.value = 0;
  loadLoans();
};

const handleReset = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  unitFilter.value = '';
  categoryGroupFilter.value = '';
  currentPage.value = 0;
  loadLoans();
};

const handleActionTinjau = (loan: any) => {
  // Pastikan field id_peminjaman ini ada di data loan kamu
  const targetId = loan.id_peminjaman; 

  if (loan.status_peminjaman === 'DIAJUKAN') {
    router.push({
      // Path harus sama persis dengan yang di index.ts
      path: `/peminjaman/tinjau/create/${targetId}`,
      state: { loan: loan }
    });
  } else {
    router.push({
      path: `/peminjaman/tinjau/update/${targetId}`,
      state: { loan: loan }
    });
  }
};

const handleGoToDetail = (loan: any) => {
  router.push(`/peminjaman/tinjau/detail/${loan.id_peminjaman}`);
};

const getStatusClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'DIAJUKAN': return 'status-diajukan';
    case 'DISETUJUI': return 'status-disetujui';
    case 'DITOLAK': return 'status-ditolak';
    case 'DIBATALKAN': return 'status-dibatalkan';
    default: return '';
  }
};

const formatKategori = (loan: any) => {
  if (['RUANG_KELAS', 'RUANG_NON_KELAS'].includes(loan.kategori_aset)) {
    return loan.kategori_aset === 'RUANG_KELAS' ? 'Ruang Kelas' : 'Ruang Non Kelas';
  }
  return loan.kategori_aset === 'BARANG_HABIS_PAKAI' ? 'Barang Habis Pakai' : 'Barang Tidak Habis Pakai';
};

const confirmDelete = (loan: any) => {
  loanToDelete.value = loan;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!loanToDelete.value) return;
  isDeleting.value = true;
  try {
    await peminjamanStore.cancelLoan(loanToDelete.value.id_peminjaman);
    toastStore.success('Success', 'Pengajuan peminjaman berhasil dibatalkan');
    showDeleteModal.value = false;
    loadLoans();
  } catch (error) {
    toastStore.error('Error', 'Gagal membatalkan pengajuan');
  } finally {
    isDeleting.value = false;
  }
};

const handleEdit = (loan: any) => {
  if (isSarprasOrAdmin.value) {
    router.push(`/peminjaman/lintas-unit/edit/${loan.id_peminjaman}`);
  } else {
    router.push(`/peminjaman/edit/${loan.id_peminjaman}`);
  }
};

const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--;
    loadLoans();
  }
};

const nextPage = () => {
  if (currentPage.value < peminjamanStore.totalPages - 1) {
    currentPage.value++;
    loadLoans();
  }
};

const totalColumns = computed(() => {
  if (activeTab.value === 'persetujuan') {
    return isSuperAdmin.value ? 10 : 9;
  } else {
    return (isSuperAdmin.value || activeTab.value === 'lintas-unit') ? 10 : 9;
  }
});

const displayLoans = computed(() => {
    // If not Sarpras/Admin, always show internal loans
    if (isSarprasOrAdmin.value && activeTab.value === 'persetujuan') {
        return tinjauStore.listTinjauan;
    }
    let list = !isSarprasOrAdmin.value ? peminjamanStore.loans : (activeTab.value === 'lintas-unit' ? peminjamanStore.loansLintasUnit : peminjamanStore.loans);
    
    // Client-side filtering as fallback/refinement
    if (statusFilter.value) {
        list = list.filter(l => l.status_peminjaman === statusFilter.value);
    }
    if (categoryGroupFilter.value) {
        if (categoryGroupFilter.value === 'BARANG') {
            list = list.filter(l => l.kategori_aset === 'BARANG_TIDAK_HABIS_PAKAI');
        } else {
            list = list.filter(l => ['RUANG_KELAS', 'RUANG_NON_KELAS'].includes(l.kategori_aset));
        }
    }
    if (unitFilter.value && isSarprasOrAdmin.value) {
        list = list.filter(l => l.unit_tujuan === unitFilter.value || l.unit_peminjam === unitFilter.value);
    }
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        list = list.filter(l => l.aset.toLowerCase().includes(query) || l.kode_aset.toLowerCase().includes(query));
    }
    
    return list;
});
</script>

<template>
  <div class="managed-peminjaman-page">
    <div class="container py-16">
      <div class="flex justify-between items-center mb-16">
        <h1 class="h2-headline">{{ activeTab === 'persetujuan' ? 'Peninjauan Pengajuan Peminjaman Aset' : 'Peminjaman Aset' }}</h1>
      </div>

      <!-- Tab Switcher (Sarpras/Admin only) -->
      <div v-if="isSarprasOrAdmin" class="tab-switcher mb-20">
        <button
          @click="activeTab = 'persetujuan'"
          :class="['tab-btn', { active: activeTab === 'persetujuan' }]"
        >
          <ClipboardList class="icon-md" /> Persetujuan Peminjaman
        </button>
        <button
          @click="activeTab = 'lintas-unit'"
          :class="['tab-btn', { active: activeTab === 'lintas-unit' }]"
        >
          <ArrowRightLeft class="icon-md" /> Pengajuan ke Unit Lain
        </button>
      </div>

      <!-- Filter Section -->
      <div class="filter-card mb-20">
        <h3 class="s2-subtitle" style="margin-bottom: 12px;">Filter Peminjaman</h3>
        <div class="filter-grid">
          <div v-if="isSarprasOrAdmin" class="filter-item">
            <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Unit</label>
            <div class="custom-select">
              <select v-model="unitFilter" :class="{ 'placeholder-color': !unitFilter }">
                <option value="">Semua Unit</option>
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <div class="filter-item">
            <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Kategori</label>
            <div class="custom-select">
              <select v-model="categoryGroupFilter" :class="{ 'placeholder-color': !categoryGroupFilter }">
                <option value="">Semua Kategori</option>
                <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <div class="filter-item">
            <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Status</label>
            <div class="custom-select">
              <select v-model="statusFilter" :class="{ 'placeholder-color': !statusFilter }">
                <option value="">Semua Status</option>
                <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <div class="filter-item flex-grow">
            <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Cari Peminjaman</label>
            <div class="search-box">
              <SearchIcon class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari nama aset..."
                @keyup.enter="handleFilter"
              />
            </div>
          </div>
        </div>
        <div class="filter-actions" style="margin-top: 10px;">
          <button @click="handleFilter" class="btn-apply btn-medium">Terapkan Filter</button>
          <button @click="handleReset" class="btn-reset btn-medium">Reset</button>
        </div>
      </div>

      <!-- Add Button -->
      <!-- Sarpras sees only one ADD button for Lintas Unit -->
      <div class="flex justify-end mb-16 gap-4">
        <button v-if="!isSarprasOrAdmin"
          @click="router.push('/peminjaman/tambah')"
          class="btn-add"
        >
          <Plus class="w-5 h-5" /> Buat Pengajuan
        </button>

        <button v-if="isSarprasOrAdmin && activeTab === 'lintas-unit'"
          @click="router.push('/peminjaman/tambah-lintas-unit')"
          class="btn-add btn-secondary"
        >
          <Plus class="w-5 h-5" /> Buat Pengajuan
        </button>
      </div>

      <!-- Table Section -->
      <div class="table-container shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse table-fixed">
            <thead>
              <tr v-if="activeTab === 'persetujuan'">
                <th class="col-nama border-r border-white/20">Nama Peminjam</th>
                <th class="col-aset border-r border-white/20">Aset</th>
                <th v-if="isSuperAdmin" class="col-unit border-r border-white/20">Unit Tujuan</th>
                <th class="col-qty border-r border-white/20 text-center">Qty</th>
                <th class="col-waktu border-r border-white/20">Waktu Peminjaman</th>
                <th class="col-waktu border-r border-white/20">Waktu Pengembalian</th>
                <th class="col-tujuan border-r border-white/20">Tujuan Peminjaman</th>
                <th class="col-alasan border-r border-white/20">Alasan & Riwayat Review</th>
                <th class="col-status border-r border-white/20 text-center">Status</th>
                <th class="col-aksi text-center">Aksi</th>
              </tr>
              <tr v-else>
                <th class="col-waktu-pengajuan border-r border-white/20">Waktu Pengajuan</th>
                <th class="col-aset border-r border-white/20">Aset</th>
                <th v-if="isSuperAdmin || activeTab === 'lintas-unit'" class="col-unit border-r border-white/20">Unit</th>
                <th class="col-qty border-r border-white/20 text-center">Qty</th>
                <th class="col-kategori border-r border-white/20">Kategori</th>
                <th class="col-peminjaman border-r border-white/20">Waktu Peminjaman</th>
                <th class="col-pengembalian border-r border-white/20">Waktu Pengembalian</th>
                <th class="col-tujuan border-r border-white/20">Tujuan Peminjaman</th>
                <th class="col-status border-r border-white/20 text-center">Status</th>
                <th class="col-aksi text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="peminjamanStore.isLoading || tinjauStore.isLoading">
                <td :colspan="totalColumns" class="text-center py-12">
                  <div class="flex justify-center items-center gap-2">
                    <span class="b2-body text-gray-500">Memuat data...</span>
                  </div>
                </td>
              </tr>

              <tr v-else-if="displayLoans.length === 0">
                <td :colspan="totalColumns" class="text-center py-12 text-gray-400">
                  <ClipboardList class="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p class="b2-body">Tidak ada data pengajuan.</p>
                </td>
              </tr>

              <tr v-else v-for="loan in displayLoans" :key="loan.id_peminjaman">
               <template v-if="activeTab === 'persetujuan'">
                <td class="border-r border-gray-100 px-4">
                  <div class="pengaju-wrapper">
                    <span class="nama-text">{{ (loan as any).nama_peminjam }}</span>
                    <span class="role-text">
                      {{ (loan as any).role_peminjam }}
                      <template v-if="(loan as any).role_peminjam !== 'SUPER_ADMIN'">
                        {{ (loan as any).unit_asal }}
                      </template>
                    </span>
                  </div>
                </td>
                <td class="b2-body border-r border-gray-100 px-4 font-semibold">
                  {{ loan.kode_aset }} - {{ (loan as any).nama_aset }}
                  {{ (loan as any).merk_aset ? ` - ${(loan as any).merk_aset}` : '' }}
                </td>
                <td v-if="isSuperAdmin" class="text-center border-r border-gray-100">
                  {{ (loan as any).unit_tujuan }}
                </td>
                <td class="text-center border-r border-gray-100">{{ loan.qty }}</td>
                <td class="text-center border-r border-gray-100">{{ loan.waktu_peminjaman }}</td>
                <td class="text-center border-r border-gray-100">{{ loan.waktu_pengembalian }}</td>
                <td class="b3-body border-r border-gray-100 px-4 py-3 align-top break-words">
                  {{ loan.tujuan_peminjaman }}
                </td>
                <td class="border-r border-gray-100 px-4 py-3 align-top whitespace-normal break-words">
                <div class="alasan-wrapper">
                  <p class="alasan-main">{{ (loan as any).alasan }}</p>
                  
                  <div v-if="(loan as any).status_peminjaman !== 'DIAJUKAN'" class="reviewer-info">
                    Terakhir direview oleh 
                    <span class="highlight">
                      {{ (loan as any).role_peninjau || (loan as any).role_peminjam }}
                    </span> 
                    pada 
                    <span class="highlight">
                      {{ (loan as any).updatedAt || (loan as any).updated_at }}
                    </span>
                  </div>

                  <div v-else class="no-review-text">
                    Belum ada review
                  </div>
                </div>
              </td>
            </template>

                <template v-else>
                  <td class="b3-body text-center border-r border-gray-100">{{ loan.waktu_pengajuan }}</td>
                  <td class="b2-body border-r border-gray-100 px-4 font-semibold">
                    {{ loan.kode_aset }} - {{ (loan as any).aset }}
                    {{ (loan as any).merk_aset ? ` - ${(loan as any).merk_aset}` : '' }}
                  </td>
                  <td v-if="isSuperAdmin || activeTab === 'lintas-unit'" class="text-center border-r border-gray-100">
                    {{ (loan as any).unit_peminjam || (loan as any).unit_asal }}
                  </td>
                  <td class="text-center border-r border-gray-100">{{ loan.qty }}</td>
                  <td class="text-center border-r border-gray-100 px-2">{{ formatKategori(loan) }}</td>
                  <td class="text-center border-r border-gray-100">{{ loan.waktu_peminjaman }}</td>
                  <td class="text-center border-r border-gray-100">{{ loan.waktu_pengembalian }}</td>
                  <td class="b3-body border-r border-gray-100 px-4 py-3 align-top break-words">
                    {{ loan.tujuan_peminjaman }}
                  </td>
                </template>

                <td class="text-center border-r border-gray-100">
                  <span :class="['badge', getStatusClass(loan.status_peminjaman)]">
                    {{ loan.status_peminjaman }}
                  </span>
                </td>

                <td>
                  <div class="flex justify-center gap-2">
                    <template v-if="activeTab === 'persetujuan'">
                      <button 
                        v-if="loan.status_peminjaman === 'DIAJUKAN'"
                        @click="handleActionTinjau(loan)" 
                        class="btn-icon btn-review" 
                        title="Berikan Peninjauan"
                      >
                        <i class="pi pi-comments" ></i>
                      </button>

                      <button 
                        v-else
                        @click="handleActionTinjau(loan)" 
                        class="btn-icon btn-edit" 
                        title="Ubah Tinjauan"
                      >
                        <EditIcon class="w-4 h-4" />
                      </button>
                      <button @click="handleGoToDetail(loan)" class="btn-icon btn-detail" title="Detail">
                        <Eye class="w-4 h-4" />
                      </button>
                    </template>

                    <template v-else>
                      <template v-if="loan.status_peminjaman === 'DIAJUKAN'">
                        <button @click="handleEdit(loan)" class="btn-icon btn-edit" title="Ubah">
                          <EditIcon class="w-4 h-4" />
                        </button>
                        <button @click="confirmDelete(loan)" class="btn-icon btn-delete" title="Hapus">
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </template>
                      <button v-else @click="handleGoToDetail(loan)" class="btn-icon btn-detail" title="Detail">
                        <ClipboardList class="w-4 h-4" />
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination Section -->
      <div class="pagination-section mt-16 mb-8 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <p class="c2-caption text-gray-500">
            Showing Page {{ peminjamanStore.currentPage + 1 }} of {{ peminjamanStore.totalPages || 1 }}
          </p>
        </div>
        <div class="pagination-btns flex gap-2">
          <button @click="prevPage" :disabled="currentPage === 0" class="btn-page">
            <ChevronLeft class="w-4 h-4" /> Previous
          </button>
          <button @click="nextPage" :disabled="currentPage >= peminjamanStore.totalPages - 1" class="btn-page">
            Next <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <ConfirmationModal
    :show="showDeleteModal"
    title="Konfirmasi Pembatalan Pengajuan"
    message="Apakah Anda yakin ingin membatalkan pengajuan peminjaman ini?"
    confirm-text="Ya, Batalkan"
    cancel-text="Kembali"
    type="danger"
    :is-loading="isDeleting"
    @confirm="handleDelete"
    @cancel="showDeleteModal = false"
  />
</template>

<style scoped>
.managed-peminjaman-page {
  background-color: #FAFAFA;
  min-height: calc(100vh - 80px);
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.tab-switcher {
  display: flex;
  background-color: #EFEFEF;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E0E0E0;
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
  font-size: 14px;
}

.tab-btn.active {
  background-color: #00588F;
  color: white;
}

.tab-btn:hover:not(.active) {
  background-color: #E5E5E5;
}

.icon-md { width: 20px; height: 20px; }

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
  border-radius: 40px;
  background: white;
  font-size: 14px;
  outline: none;
  appearance: none;
}

.custom-select select:focus {
  border-color: #00588F;
}

.placeholder-color {
  color: #9CA3AF !important;
}

.select-icon {
  position: absolute;
  right: 14px;
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
  padding: 10px 12px 10px 42px;
  border: 1px solid #D1D5DB;
  border-radius: 40px;
  font-size: 14px;
  outline: none;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6B7280;
  width: 18px;
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
  font-weight: 600;
}

.btn-reset {
  background-color: white;
  color: #333;
  border: 1px solid #D1D5DB;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
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

.btn-secondary {
    background-color: #0088CC;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #EEEEEE;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

table thead {
  background-color: #00588F;
  color: white;
}

table th {
  padding: 14px 10px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  vertical-align: middle;
}

.col-waktu-pengajuan { width: 140px; }
.col-aset { width: auto; min-width: 150px; }
.col-unit { width: 80px; }
.col-qty { width: 60px; }
.col-kategori { width: 130px; }
.col-peminjaman { width: 140px; }
.col-pengembalian { width: 140px; }
.col-tujuan { width: auto; min-width: 180px; }
.col-status { width: 110px; }
.col-aksi { width: 90px; }

table td {
  padding: 12px 8px;
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
  font-size: 12px;
  color: #333;
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  display: inline-block;
  min-width: 75px;
  text-transform: uppercase;
}

.status-diajukan { background-color: #ECF2F7; color: #4B5563; }
.status-disetujui { background-color: #E6F7F0; color: #008B58; }
.status-ditolak { background-color: #FEE2E2; color: #DC2626; }
.status-dibatalkan { background-color: #F3F4F6; color: #6B7280; }

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
.btn-detail { background-color: #64748B; color: white; }
.btn-review { background: #198754; color: white; }

.btn-page {
  padding: 8px 16px;
  border-radius: 8px;
  background: white;
  border: 1px solid #D1D5DB;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.py-16 { padding-top: 2rem; padding-bottom: 2rem; }
.mb-16 { margin-bottom: 1.5rem; }
.mb-20 { margin-bottom: 2.5rem; }

select {
  background-image: none;
}

.pengaju-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nama-text {
  font-size: 13px; 
  font-weight: 700;
  color: #333;
}

.role-text {
  font-size: 11px; 
  color: #64748B;
}


.alasan-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 40px;
}

.alasan-main {
  font-size: 12px; 
  margin-bottom: 8px;
  line-height: 1.5;
  color: #333;
}

.reviewer-info {
  font-size: 10px;
  color: #667085;
  font-style: italic;
  border-top: 1px dashed #E2E8F0;
  padding-top: 6px;
  line-height: 1.4;
}

.highlight {
  font-weight: 600;
  color: #00588F; 
}

.col-nama { width: 140px; }

.no-review-text {
  font-size: 11px;
  color: #667085;
  font-style: italic;
}
</style>