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
  MessageSquare,
  ArrowRightLeft,
  Eye,
  Search,
  FileText,
  Home,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-vue-next';
import 'primeicons/primeicons.css'
import EditIcon from '@/components/icons/EditIcon.vue';
import ConfirmationModal from '@/components/ConfirmationModal.vue';
import { useToastStore } from '@/stores/toast';

const route = useRoute();
const router = useRouter();
const peminjamanStore = usePeminjamanStore();
const tinjauStore = useTinjauPeminjamanStore();
const authStore = useAuthStore();
const toastStore = useToastStore();
const searchQuery = ref('');
const statusFilter = ref('');
const unitFilter = ref('');
const categoryGroupFilter = ref('');
const tanggalPeminjamanFilter = ref('');
const tanggalPengembalianFilter = ref('');
const currentPage = ref(0);
const pageSize = ref(10);

const sortColumn = ref('');
const sortDesc = ref(false);

const handleSort = (column: string) => {
  if (sortColumn.value === column) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortColumn.value = column;
    sortDesc.value = true;
  }
};

const showDeleteModal = ref(false);
const loanToDelete = ref<any>(null);
const isDeleting = ref(false);

const isSarprasOrAdmin = computed(() => {
  return ['SARPRAS', 'ADMIN', 'SUPERADMIN'].includes(authStore.userRole || '');
});

const isGuruSiswaView = computed(() => route.path === '/peminjaman/guru-siswa');
const activeTab = ref<'persetujuan' | 'lintas-unit'>('persetujuan');

const isSuperadmin = computed(() => {
    return authStore.userRole === 'ADMIN' && authStore.user?.unit === 'SUPERADMIN';
});

const isPeninjauanTab = computed(() => {
  return isSarprasOrAdmin.value && activeTab.value === 'persetujuan' && !isGuruSiswaView.value;
});

const units = ['KB-TK', 'SD', 'SMP', 'SMA'];
const categories = [
  { label: 'Barang', value: 'BARANG' },
  { label: 'Ruangan', value: 'RUANGAN' }
];

const loadLoans = async () => {
  const filters: any = {};

  if (isPeninjauanTab.value) {
    if (unitFilter.value) filters.unitTujuan = unitFilter.value;
    if (categoryGroupFilter.value) filters.kategoriAset = categoryGroupFilter.value;
    if (statusFilter.value) filters.statusPeminjaman = statusFilter.value;
    if (searchQuery.value) filters.search = searchQuery.value;
    if (tanggalPeminjamanFilter.value) {
      const [y, m, d] = tanggalPeminjamanFilter.value.split('-');
      if (y && m && d) {
        filters.tanggalPeminjaman = `${d}-${m}-${y}`;
      }
    }
    if (tanggalPengembalianFilter.value) {
      const [y, m, d] = tanggalPengembalianFilter.value.split('-');
      if (y && m && d) {
        filters.tanggalPengembalian = `${d}-${m}-${y}`;
      }
    }
    await tinjauStore.fetchAll(filters);
  } else {
    if (searchQuery.value) filters.search = searchQuery.value;
    if (statusFilter.value) filters.statusPeminjaman = statusFilter.value;
    if (unitFilter.value) filters.unitTujuan = unitFilter.value;
    if (categoryGroupFilter.value) filters.kategoriAset = categoryGroupFilter.value;

    if (!isSarprasOrAdmin.value) {
        await peminjamanStore.fetchLoans(currentPage.value, pageSize.value, filters);
    } else if (isGuruSiswaView.value) {
        await peminjamanStore.fetchLoans(currentPage.value, pageSize.value, { ...filters, all: true });
    } else if (activeTab.value === 'lintas-unit') {
        await peminjamanStore.fetchLoansLintasUnit(currentPage.value, pageSize.value, { ...filters, all: true });
    }
  }
};

onMounted(() => {
  loadLoans();
});

watch(() => route.path, (newPath) => {
  if (newPath.includes('/guru-siswa')) {
    activeTab.value = 'persetujuan';
  } else if (newPath === '/peminjaman') {
    activeTab.value = 'persetujuan';
  }
  currentPage.value = 0;
  handleReset();
});

watch(activeTab, () => {
    currentPage.value = 0;
    loadLoans();
});

watch(pageSize, () => {
    currentPage.value = 0;
    loadLoans();
});

const handleFilter = () => {
  currentPage.value = 0;
  loadLoans();
};

const handleReset = () => {
  searchQuery.value = '';
  statusFilter.value = '';
  unitFilter.value = '';
  categoryGroupFilter.value = '';
  tanggalPeminjamanFilter.value = '';
  tanggalPengembalianFilter.value = '';
  currentPage.value = 0;
  loadLoans();
};

const handleActionTinjau = (loan: any) => {
  const targetId = loan.id_peminjaman;
  if (loan.status_peminjaman === 'DIAJUKAN') {
    router.push({ path: `/peminjaman/tinjau/create/${targetId}` });
  } else {
    router.push({ path: `/peminjaman/tinjau/update/${targetId}` });
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

const splitDateTime = (val: string) => {
  if (!val) return ['', ''];
  // Handle ISO format or space-separated format
  const cleanVal = val.replace('T', ' ');
  const [datePart, timePart] = cleanVal.split(' ');
  
  if (!datePart) return ['', ''];
  
  // Format Date: YYYY-MM-DD -> DD-MM-YYYY
  const [y, m, d] = datePart.split('-');
  const formattedDate = y && m && d ? `${d}-${m}-${y}` : datePart;
  
  // Format Time: HH:mm:ss -> HH:mm
  let formattedTime = '';
  if (timePart) {
    const timeParts = timePart.split(':');
    formattedTime = timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : timePart;
  }
  
  return [formattedDate, formattedTime];
};

const confirmDelete = (loan: any) => {
  loanToDelete.value = loan;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!loanToDelete.value) return;
  isDeleting.value = true;
  try {
    const isLintasUnit = isSarprasOrAdmin.value && activeTab.value === 'lintas-unit';
    await peminjamanStore.deleteLoan(loanToDelete.value.id_peminjaman, isLintasUnit);
    toastStore.success('Success', `Pengajuan peminjaman ${isLintasUnit ? 'lintas unit ' : ''}berhasil dihapus`);
    showDeleteModal.value = false;
    loadLoans();
  } catch (error) {
    toastStore.error('Error', 'Gagal menghapus pengajuan');
  } finally {
    isDeleting.value = false;
  }
};

const handleEdit = (loan: any) => {
  if (isGuruSiswaView.value || !isSarprasOrAdmin.value) {
    router.push(`/peminjaman/edit/${loan.id_peminjaman}`);
  } else {
    router.push(`/peminjaman/lintas-unit/edit/${loan.id_peminjaman}`);
  }
};

const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--;
    loadLoans();
  }
};

const nextPage = () => {
  const total = isPeninjauanTab.value ? 1 : peminjamanStore.totalPages;
  if (currentPage.value < total - 1) {
    currentPage.value++;
    loadLoans();
  }
};

const displayLoans = computed(() => {
    let list = [];
    if (isPeninjauanTab.value) {
        list = [...tinjauStore.listTinjauan];
        // Sembunyikan data jika sudah direview dan sudah lewat 1 hari dari waktu peminjaman
        list = list.filter((loan: any) => {
            if (loan.status_peminjaman !== 'DIAJUKAN' && loan.waktu_peminjaman) {
                const peminjamanDate = new Date(loan.waktu_peminjaman).getTime();
                const now = Date.now();
                const diffDays = (now - peminjamanDate) / (1000 * 60 * 60 * 24);
                if (diffDays >= 1) return false;
            }
            return true;
        });
    } else {
        list = activeTab.value === 'lintas-unit' ? [...peminjamanStore.loansLintasUnit] : [...peminjamanStore.loans];
    }
    
    if (sortColumn.value) {
        list.sort((a: any, b: any) => {
            let valA: any, valB: any;
            if (sortColumn.value === 'waktu_pengajuan') {
                valA = a.waktu_pengajuan ? new Date(a.waktu_pengajuan).getTime() : 0;
                valB = b.waktu_pengajuan ? new Date(b.waktu_pengajuan).getTime() : 0;
            } else if (sortColumn.value === 'waktu_peminjaman') {
                valA = a.waktu_peminjaman ? new Date(a.waktu_peminjaman).getTime() : 0;
                valB = b.waktu_peminjaman ? new Date(b.waktu_peminjaman).getTime() : 0;
            } else if (sortColumn.value === 'waktu_pengembalian') {
                valA = a.waktu_pengembalian ? new Date(a.waktu_pengembalian).getTime() : 0;
                valB = b.waktu_pengembalian ? new Date(b.waktu_pengembalian).getTime() : 0;
            } else if (sortColumn.value === 'aset') {
                valA = (a.kode_aset || '').toString().toLowerCase();
                valB = (b.kode_aset || '').toString().toLowerCase();
            }

            if (valA < valB) return sortDesc.value ? 1 : -1;
            if (valA > valB) return sortDesc.value ? -1 : 1;
            
            // Secondary sort for equal values (especially useful for 'aset')
            const timeA = a.waktu_pengajuan ? new Date(a.waktu_pengajuan).getTime() : 0;
            const timeB = b.waktu_pengajuan ? new Date(b.waktu_pengajuan).getTime() : 0;
            if (timeA < timeB) return -1;
            if (timeA > timeB) return 1;

            return 0;
        });
    }

    return list;
});

const storeLoading = computed(() => {
    return peminjamanStore.isLoading || (isPeninjauanTab.value && tinjauStore.isLoading);
});

const totalPages = computed(() => {
    if (isPeninjauanTab.value) return 1;
    return peminjamanStore.totalPages || 1;
});

// Menghitung jumlah kolom secara dinamis untuk colspan agar tabel tidak terjepit saat kosong
const dynamicColspan = computed(() => {
  if (isPeninjauanTab.value) {
    return 9 + (isSuperadmin.value ? 1 : 0);
  } else {
    return 9 + (isSarprasOrAdmin.value ? 2 : 0);
  }
});

const canEditReview = (loan: any) => {
  if (!loan.updatedAt) return false;
  
  // Mengecek usia review (maksimal 2 hari)
  const reviewDate = new Date(loan.updatedAt).getTime();
  const now = Date.now();
  const diffDays = (now - reviewDate) / (1000 * 60 * 60 * 24);
  if (diffDays > 2) return false;
  
  // Mengecek apakah barang sudah mulai dipinjam
  if (loan.waktu_peminjaman) {
    const peminjamanDate = new Date(loan.waktu_peminjaman).getTime();
    if (now >= peminjamanDate) return false;
  }
  
  return true;
};
</script>

<template>
  <div class="managed-peminjaman-page">
    <div class="container py-16">
      <div class="flex justify-between items-center mb-16">
        <h1 class="h2-headline">
          {{ (isSarprasOrAdmin && activeTab === 'persetujuan' && !isGuruSiswaView) ? 'Peninjauan Pengajuan Peminjaman Aset' : 'Pengajuan Peminjaman Aset' }}
        </h1>
      </div>

      <!-- Tab Switcher (Sarpras/Admin only) -->
      <div v-if="isSarprasOrAdmin && !isGuruSiswaView" class="tab-switcher mb-20">
        <button
          @click="activeTab = 'persetujuan'"
          :class="['tab-btn', { active: activeTab === 'persetujuan' }]"
        >
          <FileText class="icon-md" /> {{ isSuperadmin ? 'Persetujuan Pengajuan' : 'Persetujuan Pengajuan' }}
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
        <h3 class="s2-subtitle" style="margin-bottom: 12px;">{{ isPeninjauanTab ? 'Filter Peninjauan Peminjaman' : 'Filter Peminjaman' }}</h3>
        
        <!-- Filter Peninjauan -->
        <div v-if="isPeninjauanTab" class="filter-grid">
          <div v-if="authStore.userRole === 'ADMIN'" class="filter-item">
            <label class="c2-caption block" style="margin-bottom: 8px;">Unit Tujuan</label>
            <div class="custom-select col-unit-select">
              <select v-model="unitFilter" :class="{ 'placeholder-color': !unitFilter }">
                <option value="">Semua Unit</option>
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <div class="filter-item">
            <label class="c2-caption block" style="margin-bottom: 8px;">Kategori</label>
            <div class="custom-select col-cat-select">
              <select v-model="categoryGroupFilter" :class="{ 'placeholder-color': !categoryGroupFilter }">
                <option value="">Semua Kategori</option>
                <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <div class="filter-item">
            <label class="c2-caption block" style="margin-bottom: 8px;">Status Peminjaman</label>
            <div class="custom-select col-status-select">
              <select v-model="statusFilter" :class="{ 'placeholder-color': !statusFilter }">
                <option value="">Semua Status</option>
                <option v-for="s in [
                  { label: 'Diajukan', value: 'DIAJUKAN' },
                  { label: 'Disetujui', value: 'DISETUJUI' },
                  { label: 'Ditolak', value: 'DITOLAK' }
                ]" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <div class="filter-item">
            <label class="c2-caption block" style="margin-bottom: 8px;">Tanggal Peminjaman</label>
            <div class="search-box">
              <Calendar class="search-icon" />
              <input
                v-model="tanggalPeminjamanFilter"
                type="date"
                @keyup.enter="handleFilter"
              />
            </div>
          </div>

          <div class="filter-item">
            <label class="c2-caption block" style="margin-bottom: 8px;">Tanggal Pengembalian</label>
            <div class="search-box">
              <Calendar class="search-icon" />
              <input
                v-model="tanggalPengembalianFilter"
                type="date"
                @keyup.enter="handleFilter"
              />
            </div>
          </div>

          <div class="filter-item flex-grow">
            <label class="c2-caption block" style="margin-bottom: 8px;">Cari Peminjaman</label>
            <div class="search-box">
              <Search class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari nama, merk, atau kode aset"
                @keyup.enter="handleFilter"
              />
            </div>
          </div>
        </div>

        <!-- Filter Peminjaman Default -->
        <div v-else class="filter-grid">
          <div v-if="isSarprasOrAdmin" class="filter-item">
            <label class="c2-caption block" style="margin-bottom: 8px;">Unit Tujuan</label>
            <div class="custom-select col-unit-select">
              <select v-model="unitFilter" :class="{ 'placeholder-color': !unitFilter }">
                <option value="">Semua Unit</option>
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <div class="filter-item">
            <label class="c2-caption block" style="margin-bottom: 8px;">Kategori</label>
            <div class="custom-select col-cat-select">
              <select v-model="categoryGroupFilter" :class="{ 'placeholder-color': !categoryGroupFilter }">
                <option value="">Semua Kategori</option>
                <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <div class="filter-item">
            <label class="c2-caption block" style="margin-bottom: 8px;">Status Peminjaman</label>
            <div class="custom-select col-status-select">
              <select v-model="statusFilter" :class="{ 'placeholder-color': !statusFilter }">
                <option value="">Semua Status</option>
                <option v-for="s in [
                  { label: 'Diajukan', value: 'DIAJUKAN' },
                  { label: 'Disetujui', value: 'DISETUJUI' },
                  { label: 'Ditolak', value: 'DITOLAK' }
                ]" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <div class="filter-item flex-grow">
            <label class="c2-caption block" style="margin-bottom: 8px;">Cari Peminjaman</label>
            <div class="search-box">
              <Search class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari nama, merk, atau kode aset"
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

      <!-- Add Button (Standard Loan View only) -->
      <div v-if="!isSarprasOrAdmin || (activeTab === 'lintas-unit' && !isGuruSiswaView)" class="flex justify-end mb-16">
        <button 
          @click="router.push(activeTab === 'lintas-unit' ? '/peminjaman/tambah-lintas-unit' : '/peminjaman/tambah')"
          class="btn-add"
        >
          <Plus class="w-5 h-5" /> Buat Pengajuan
        </button>
      </div>

      <!-- Table Section -->
      <div class="table-container shadow-sm mt-12">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse table-fixed">
            <thead>
              <tr v-if="activeTab === 'persetujuan' && isSarprasOrAdmin && !isGuruSiswaView">
                <th class="col-pengaju border-r border-white/20">Nama Peminjam</th>
                <th class="col-aset-wide border-r border-white/20 cursor-pointer hover:bg-white/10" @click="handleSort('aset')">
                  <div class="flex items-center gap-1">
                    <span>Aset</span>
                    <ArrowUp v-if="sortColumn === 'aset' && !sortDesc" class="w-3 h-3" />
                    <ArrowDown v-if="sortColumn === 'aset' && sortDesc" class="w-3 h-3" />
                    <ArrowUpDown v-if="sortColumn !== 'aset'" class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th v-if="isSuperadmin" class="col-unit-tujuan border-r border-white/20">Unit Tujuan</th>
                <th class="col-qty border-r border-white/20 text-center">Qty</th>
                <th class="col-peminjaman border-r border-white/20 cursor-pointer hover:bg-white/10" @click="handleSort('waktu_peminjaman')">
                  <div class="flex items-center gap-1 justify-center">
                    <span>Waktu Peminjaman</span>
                    <ArrowUp v-if="sortColumn === 'waktu_peminjaman' && !sortDesc" class="w-3 h-3" />
                    <ArrowDown v-if="sortColumn === 'waktu_peminjaman' && sortDesc" class="w-3 h-3" />
                    <ArrowUpDown v-if="sortColumn !== 'waktu_peminjaman'" class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th class="col-pengembalian border-r border-white/20 cursor-pointer hover:bg-white/10" @click="handleSort('waktu_pengembalian')">
                  <div class="flex items-center gap-1 justify-center">
                    <span>Waktu Pengembalian</span>
                    <ArrowUp v-if="sortColumn === 'waktu_pengembalian' && !sortDesc" class="w-3 h-3" />
                    <ArrowDown v-if="sortColumn === 'waktu_pengembalian' && sortDesc" class="w-3 h-3" />
                    <ArrowUpDown v-if="sortColumn !== 'waktu_pengembalian'" class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th class="col-tujuan-wide border-r border-white/20">Tujuan Peminjaman</th>
                <th class="col-review-history border-r border-white/20">Alasan & Riwayat Review</th>
                <th class="col-status-cell border-r border-white/20 text-center">Status</th>
                <th class="col-aksi-wide text-center">Aksi</th>
              </tr>
              <tr v-else>
                <th class="col-waktu-pengajuan border-r border-white/20 cursor-pointer hover:bg-white/10" @click="handleSort('waktu_pengajuan')">
                  <div class="flex items-center gap-1">
                    <span>Waktu Pengajuan</span>
                    <ArrowUp v-if="sortColumn === 'waktu_pengajuan' && !sortDesc" class="w-3 h-3" />
                    <ArrowDown v-if="sortColumn === 'waktu_pengajuan' && sortDesc" class="w-3 h-3" />
                    <ArrowUpDown v-if="sortColumn !== 'waktu_pengajuan'" class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th v-if="isSarprasOrAdmin" class="col-pengaju border-r border-white/20">Nama Peminjam</th>
                <th class="col-aset-wide border-r border-white/20 cursor-pointer hover:bg-white/10" @click="handleSort('aset')">
                  <div class="flex items-center gap-1">
                    <span>Aset</span>
                    <ArrowUp v-if="sortColumn === 'aset' && !sortDesc" class="w-3 h-3" />
                    <ArrowDown v-if="sortColumn === 'aset' && sortDesc" class="w-3 h-3" />
                    <ArrowUpDown v-if="sortColumn !== 'aset'" class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th v-if="isSarprasOrAdmin" class="col-unit border-r border-white/20">
                  {{ isSuperadmin ? 'Unit Tujuan' : (activeTab === 'lintas-unit' ? 'Unit Tujuan' : 'Unit Peminjam') }}
                </th>
                <th class="col-qty border-r border-white/20 text-center">Qty</th>
                <th class="col-kategori border-r border-white/20">Kategori</th>
                <th class="col-peminjaman border-r border-white/20 cursor-pointer hover:bg-white/10" @click="handleSort('waktu_peminjaman')">
                  <div class="flex items-center gap-1 justify-center">
                    <span>Waktu Peminjaman</span>
                    <ArrowUp v-if="sortColumn === 'waktu_peminjaman' && !sortDesc" class="w-3 h-3" />
                    <ArrowDown v-if="sortColumn === 'waktu_peminjaman' && sortDesc" class="w-3 h-3" />
                    <ArrowUpDown v-if="sortColumn !== 'waktu_peminjaman'" class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th class="col-pengembalian border-r border-white/20 cursor-pointer hover:bg-white/10" @click="handleSort('waktu_pengembalian')">
                  <div class="flex items-center gap-1 justify-center">
                    <span>Waktu Pengembalian</span>
                    <ArrowUp v-if="sortColumn === 'waktu_pengembalian' && !sortDesc" class="w-3 h-3" />
                    <ArrowDown v-if="sortColumn === 'waktu_pengembalian' && sortDesc" class="w-3 h-3" />
                    <ArrowUpDown v-if="sortColumn !== 'waktu_pengembalian'" class="w-3 h-3 opacity-50" />
                  </div>
                </th>
                <th class="col-tujuan-wide border-r border-white/20">Tujuan Peminjaman</th>
                <th class="col-status-cell border-r border-white/20 text-center">Status</th>
                <th class="col-aksi text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="storeLoading">
                <td :colspan="dynamicColspan" class="text-center py-12">
                  <span class="b2-body text-gray-400">Memuat data peminjaman...</span>
                </td>
              </tr>
              <tr v-else-if="displayLoans.length === 0">
                <td :colspan="dynamicColspan" class="text-center py-12 text-gray-500 italic">
                    Tidak ada data ditemukan.
                </td>
              </tr>
              <tr v-for="loan in displayLoans" :key="loan.id_peminjaman">
                <template v-if="activeTab === 'persetujuan' && isSarprasOrAdmin && !isGuruSiswaView">
                  <td class="b3-body border-r border-gray-100 px-4 py-3">
                    <span class="font-bold block">{{ (loan as any).nama_peminjam }}</span>
                    
                    <span class="text-[10px] text-gray-500 uppercase">
                      {{ (loan as any).role_peminjam }} 

                      <template v-if="(loan as any).role_peminjam?.toUpperCase().trim() !== 'ADMIN'">
                        {{ (loan as any).unit_asal }}
                      </template>
                    </span>
                  </td>
                  <td class="b2-body border-r border-gray-100 px-4 py-3 font-semibold">
                    {{ loan.kode_aset }} - {{ (loan as any).nama_aset || (loan as any).aset }}
                    {{ (loan as any).merk_aset ? ` - ${(loan as any).merk_aset}` : '' }}
                  </td>
                  <td v-if="isSuperadmin" class="text-center b3-body border-r border-gray-100">{{ (loan as any).unit_tujuan || '-' }}</td>
                  <td class="text-center b3-body border-r border-gray-100 font-bold">{{ loan.qty }}</td>
                  <td class="text-center b3-body border-r border-gray-100">
                    <div class="whitespace-nowrap">{{ splitDateTime(loan.waktu_peminjaman)[0] }}</div>
                    <div class="text-[10px] text-gray-500">{{ splitDateTime(loan.waktu_peminjaman)[1] }}</div>
                  </td>
                  <td class="text-center b3-body border-r border-gray-100">
                    <div class="whitespace-nowrap">{{ splitDateTime(loan.waktu_pengembalian)[0] }}</div>
                    <div class="text-[10px] text-gray-500">{{ splitDateTime(loan.waktu_pengembalian)[1] }}</div>
                  </td>
                  <td class="b3-body border-r border-gray-100 px-4 py-3 align-top break-words">
                    {{ loan.tujuan_peminjaman }}
                  </td>
                  <td class="b3-body border-r border-gray-100 px-4 py-3 align-top">
                    <!-- Logika Alasan & Riwayat Review dari rekan -->
                    <div v-if="loan.status_peminjaman === 'DIAJUKAN'" class="text-gray-400 italic">
                      Belum ada review
                    </div>
                    <div v-else>
                      <div class="alasan-wrapper">
                        <p class="alasan-main">{{ (loan as any).alasan || '(Tanpa alasan)' }}</p>

                        <div v-if="(loan as any).status_peminjaman !== 'DIAJUKAN'" class="reviewer-info">
                          Terakhir direview oleh 
                          <span class="highlight">
                            {{ (loan as any).role_peninjau || (loan as any).role_peminjam }}
                          </span> 
                          pada 
                          <span class="highlight">
                            {{ splitDateTime((loan as any).updatedAt)[0] }}
                          </span> 
                          pukul 
                          <span class="highlight">
                            {{ splitDateTime((loan as any).updatedAt)[1] }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                </template>

                <template v-else>
                  <td class="b3-body text-center border-r border-gray-100 py-3">
                    <div class="whitespace-nowrap">{{ splitDateTime(loan.waktu_pengajuan)[0] }}</div>
                    <div class="text-[10px] text-gray-500">{{ splitDateTime(loan.waktu_pengajuan)[1] }}</div>
                  </td>
                  <td v-if="isSarprasOrAdmin" class="b3-body border-r border-gray-100 px-4 py-3">
                    <span class="font-bold block">{{ (loan as any).nama_peminjam }}</span>
                    
                    <span class="text-[10px] text-gray-500 uppercase">
                      {{ (loan as any).role_peminjam }}

                      <template v-if="(loan as any).role_peminjam?.toString().trim().toUpperCase() !== 'ADMIN'">
                        {{ (loan as any).unit_asal || (loan as any).unit_peminjam }}
                      </template>
                    </span>
                  </td>
                  <td class="b2-body border-r border-gray-100 px-4 py-3 font-semibold">
                    {{ loan.kode_aset }} - {{ (loan as any).aset || (loan as any).nama_aset }}
                    {{ (loan as any).merk_aset ? ` - ${(loan as any).merk_aset}` : '' }}
                  </td>
                  <td v-if="isSarprasOrAdmin" class="text-center b3-body border-r border-gray-100 font-bold">
                    {{ (activeTab === 'lintas-unit' || isGuruSiswaView) ? (loan as any).unit_tujuan : (loan as any).unit_peminjam }}
                  </td>
                  <td class="text-center b3-body border-r border-gray-100 font-bold">{{ loan.qty }}</td>
                  <td class="text-center b3-body border-r border-gray-100 px-2">{{ formatKategori(loan) }}</td>
                  <td class="text-center b3-body border-r border-gray-100 py-3">
                    <div class="whitespace-nowrap">{{ splitDateTime(loan.waktu_peminjaman)[0] }}</div>
                    <div class="text-[10px] text-gray-500">{{ splitDateTime(loan.waktu_peminjaman)[1] }}</div>
                  </td>
                  <td class="text-center b3-body border-r border-gray-100 py-3">
                    <div class="whitespace-nowrap">{{ splitDateTime(loan.waktu_pengembalian)[0] }}</div>
                    <div class="text-[10px] text-gray-500">{{ splitDateTime(loan.waktu_pengembalian)[1] }}</div>
                  </td>
                  <td class="b3-body border-r border-gray-100 px-4 py-3 align-top break-words">
                    {{ loan.tujuan_peminjaman }}
                  </td>
                </template>

                <td class="text-center border-r border-gray-100 px-2">
                  <span :class="['badge', getStatusClass(loan.status_peminjaman)]">
                    {{ loan.status_peminjaman }}
                  </span>
                </td>
                <td>
                  <div class="flex justify-center gap-2">
                    <template v-if="activeTab === 'persetujuan' && isSarprasOrAdmin && !isGuruSiswaView">
                       <button
                        v-if="loan.status_peminjaman === 'DIAJUKAN'"
                        @click="handleActionTinjau(loan)"
                        class="btn-icon btn-review"
                        title="Berikan Peninjauan"
                      >
                        <MessageSquare class="w-4 h-4" />
                      </button>
                      <button
                        v-else-if="canEditReview(loan)"
                        @click="handleActionTinjau(loan)"
                        class="btn-icon btn-edit-tinjau"
                        title="Ubah Peninjauan"
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
                      <button v-else-if="isSuperadmin" @click="handleGoToDetail(loan)" class="btn-icon btn-detail" title="Detail">
                        <Eye class="w-4 h-4" />
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
      <div v-if="!isPeninjauanTab" class="pagination-section mt-20 mb-8">
        <div class="flex items-center gap-4">
          <p class="c2-caption text-gray-500">
            Showing Page {{ currentPage + 1 }} of {{ totalPages }}
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
          <button @click="prevPage" :disabled="currentPage === 0" class="btn-page">
            <ChevronLeft class="w-4 h-4" /> Previous
          </button>
          <button @click="nextPage" :disabled="currentPage >= totalPages - 1" class="btn-page">
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
  color: #4B5563;
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

.col-unit-select { width: 160px; }
.col-cat-select { width: 200px; }
.col-status-select { width: 160px; }

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
  color: #333;
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

select option {
  color: #333;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 10px 12px 10px 42px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  color: #333;
}

.search-box input::placeholder {
  color: #9CA3AF;
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
  border: none;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.btn-reset {
  background-color: white;
  color: #333;
  border: 1px solid #D1D5DB;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
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

/* Base column widths */
.col-waktu-pengajuan { width: 100px; }
.col-pengaju { width: 140px; }
.col-aset-wide { width: auto; min-width: 220px; }
.col-unit { width: 100px; }
.col-unit-tujuan { width: 85px; }
.col-qty { width: 50px; }
.col-kategori { width: 110px; }
.col-peminjaman { width: 100px; }
.col-pengembalian { width: 100px; }
.col-tujuan-wide { width: auto; min-width: 180px; }
.col-review-history { width: auto; min-width: 200px; }
.col-status-cell { width: 100px; }
.col-aksi-wide { width: 130px; }
.col-aksi { width: 100px; }

table td {
  padding: 12px 16px;
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
  font-size: 12px;
  color: #333;
  white-space: normal;
  word-break: break-word;
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  display: inline-block;
  min-width: 80px;
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
  flex-shrink: 0;
}

.btn-edit { background-color: #00588F; color: white; }
.btn-delete { background-color: #DC3545; color: white; }
.btn-detail { background-color: #64748B; color: white; }
.btn-review { background-color: #198754; color: white; }
.btn-edit-tinjau { background-color: #00588F; color: white; }

.btn-icon:hover { transform: scale(1.1); }

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
  position: relative;
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
  color: #374151;
  font-weight: 500;
  appearance: none;
}

.page-size-wrapper .select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  pointer-events: none;
}

.mt-12 { margin-top: 32px; }
.mt-20 { margin-top: 40px; }
.py-16 { padding-top: 1.5rem; padding-bottom: 2rem; }
.mb-16 { margin-bottom: 24px; }
.mb-20 { margin-bottom: 32px; }

.date-input {
  padding-left: 42px !important;
}

.alasan-wrapper {
  display: flex;
  flex-direction: column;
}

.alasan-main {
  font-size: 12px;
  margin-bottom: 0.3cm; 
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
}

.reviewer-info {
  font-size: 10px;
  color: #667085;
  font-style: italic;
  padding-top: 8px;
  line-height: 1.4;
}

.highlight {
  font-weight: 600;
  color: #00588F;
}

.no-review-text {
  font-size: 12px;
  font-style: italic;
  color: #999;
}
</style>
