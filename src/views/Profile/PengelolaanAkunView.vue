<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserManagementStore } from '@/stores/userManagementStore';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import SearchIcon from '@/components/icons/SearchIcon.vue';
import EditIcon from '@/components/icons/EditIcon.vue';
import { ChevronDown, ChevronLeft, ChevronRight, Trash2, Eye, Users, UserCog, Plus } from 'lucide-vue-next';
import { userManagementService, type UserPerUnit } from '@/services/userManagementService';
import ConfirmationModal from '@/components/ConfirmationModal.vue';

const userStore = useUserManagementStore();
const authStore = useAuthStore();
const router = useRouter();
const toastStore = useToastStore();

const activeTab = ref<'terdaftar' | 'unit_lain'>('terdaftar');
const searchQuery = ref('');
const roleFilter = ref('Semua Role');
const unitFilter = ref('Semua Unit');

const isAdmin = computed(() => authStore.userRole === 'ADMIN');

const roles = computed(() => {
  const allRoles = [
    { label: 'Semua Role', value: 'Semua Role' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Yayasan', value: 'YAYASAN' },
    { label: 'Sarpras', value: 'SARPRAS' },
    { label: 'Kepsek', value: 'KEPSEK' },
    { label: 'Guru', value: 'GURU' },
    { label: 'Siswa', value: 'SISWA' }
  ];

  if (!isAdmin.value) {
    return allRoles.filter(role => role.value !== 'ADMIN' && role.value !== 'YAYASAN');
  }
  return allRoles;
});

const units = [
  { label: 'Semua Unit', value: 'Semua Unit' },
  { label: 'SD', value: 'SD' },
  { label: 'SMP', value: 'SMP' },
  { label: 'SMA', value: 'SMA' },
  { label: 'KB-TK', value: 'KB-TK' }
];

const pageSize = ref(10);
const currentPage = ref(1);

const userUnit = computed(() => authStore.user?.unit || '');
const pageTitle = computed(() => isAdmin.value ? 'Pengelolaan Profile' : `Pengelolaan Profile - ${userUnit.value}`);

const loadUsers = () => {
  if (isAdmin.value || activeTab.value === 'terdaftar') {
    userStore.fetchUsers(currentPage.value, pageSize.value, searchQuery.value, roleFilter.value, isAdmin.value ? unitFilter.value : undefined);
  }
};

watch(pageSize, () => {
  currentPage.value = 1;
  loadUsers();
});

const handleSearch = () => {
  currentPage.value = 1;
  loadUsers();
};

const handleReset = () => {
  searchQuery.value = '';
  roleFilter.value = 'Semua Role';
  unitFilter.value = 'Semua Unit';
  currentPage.value = 1;
  loadUsers();
};

const nextPage = () => {
  if (currentPage.value < userStore.totalPages) {
    currentPage.value++;
    loadUsers();
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadUsers();
  }
};

const formatRoleDisplay = (role: string) => {
  if (!role) return '-';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

const getRoleBadgeClass = (role: string) => {
  if (!role) return 'role-default';
  switch (role.toUpperCase()) {
    case 'ADMIN': return 'role-admin';
    case 'YAYASAN': return 'role-yayasan';
    case 'SARPRAS': return 'role-sarpras';
    case 'KEPSEK': return 'role-kepsek';
    case 'GURU': return 'role-guru';
    case 'SISWA': return 'role-siswa';
    default: return 'role-default';
  }
};

onMounted(() => {
  loadUsers();
});

const handleTambahAkun = () => {
  router.push({ name: 'tambah-akun' });
};

const handleViewUser = (user: UserPerUnit) => {
  router.push({ name: 'detail-user', params: { id: user.id } });
};

const handleEditUser = (user: UserPerUnit) => {
  router.push({ name: 'edit-user', params: { id: user.id } });
};

const showDeleteConfirm = ref(false);
const userToDelete = ref<UserPerUnit | null>(null);
const isDeleting = ref(false);

const handleDeleteUser = (user: UserPerUnit) => {
  userToDelete.value = user;
  showDeleteConfirm.value = true;
};

const confirmDeleteUser = async () => {
  if (!userToDelete.value) return;
  if (userToDelete.value.id === authStore.user?.id) {
    toastStore.error('Error', 'Tidak dapat menghapus akun sendiri');
    showDeleteConfirm.value = false;
    return;
  }
  isDeleting.value = true;
  const result = await userStore.deleteUser(userToDelete.value.id);
  isDeleting.value = false;
  showDeleteConfirm.value = false;
  userToDelete.value = null;
  if (!result.success) {
    toastStore.error('Error', result.message || 'Gagal menghapus akun pengguna');
  } else {
    if (userStore.users.length === 1 && currentPage.value > 1) {
      currentPage.value--;
    }
    loadUsers();
  }
};

// --- Unit Lain Tab ---
const unitLainSearchQuery = ref('');
const unitLainUnitFilter = ref('Semua Unit');
const unitLainCurrentPage = ref(1);
const unitLainPageSize = ref(10);
const unitLainUsers = ref<UserPerUnit[]>([]);
const unitLainLoading = ref(false);
const unitLainTotalPages = ref(1);
const unitLainInitialized = ref(false);

const unitLainFilterOptions = computed(() => {
  const all = [
    { label: 'Semua Unit', value: 'Semua Unit' },
    { label: 'KB-TK', value: 'KB-TK' },
    { label: 'SD', value: 'SD' },
    { label: 'SMP', value: 'SMP' },
    { label: 'SMA', value: 'SMA' },
  ];
  return all.filter(u => u.value === 'Semua Unit' || u.value !== userUnit.value);
});

const loadSarprasLintasUnit = async () => {
  unitLainLoading.value = true;
  try {
    const res = await userManagementService.getSarprasLintasUnit(
      unitLainCurrentPage.value, unitLainPageSize.value,
      unitLainSearchQuery.value, unitLainUnitFilter.value
    );
    if (res?.data) {
      unitLainUsers.value = res.data.data;
      unitLainTotalPages.value = res.data.total_pages;
    }
  } catch { /* handled by global interceptor */ }
  finally { unitLainLoading.value = false; }
};

const handleUnitLainSearch = () => {
  unitLainCurrentPage.value = 1;
  loadSarprasLintasUnit();
};

const handleUnitLainReset = () => {
  unitLainSearchQuery.value = '';
  unitLainUnitFilter.value = 'Semua Unit';
  unitLainCurrentPage.value = 1;
  loadSarprasLintasUnit();
};

const nextPageUnitLain = () => {
  if (unitLainCurrentPage.value < unitLainTotalPages.value) {
    unitLainCurrentPage.value++;
    loadSarprasLintasUnit();
  }
};

const prevPageUnitLain = () => {
  if (unitLainCurrentPage.value > 1) {
    unitLainCurrentPage.value--;
    loadSarprasLintasUnit();
  }
};

watch(activeTab, (newTab) => {
  if (newTab === 'unit_lain' && !unitLainInitialized.value) {
    unitLainInitialized.value = true;
    loadSarprasLintasUnit();
  }
});

watch(unitLainPageSize, () => {
  unitLainCurrentPage.value = 1;
  loadSarprasLintasUnit();
});
</script>

<template>
  <div class="user-management-page">
    <div class="container py-16">
      <div class="flex justify-between items-center mb-16">
        <h1 class="h2-headline">{{ pageTitle }}</h1>
      </div>

      <!-- Tab Switcher -->
      <div v-if="!isAdmin" class="tab-switcher mb-20">
        <button
          @click="activeTab = 'terdaftar'"
          :class="['tab-btn', { active: activeTab === 'terdaftar' }]"
        >
          <Users class="icon-md" /> Akun {{ userUnit }} Terdaftar
        </button>
        <button
          @click="activeTab = 'unit_lain'"
          :class="['tab-btn', { active: activeTab === 'unit_lain' }]"
        >
          <UserCog class="icon-md" /> Akun Sarpras Unit Lain
        </button>
      </div>

      <div v-show="isAdmin || activeTab === 'terdaftar'">
        <!-- Filter Section -->
        <div class="filter-card mb-20">
          <h3 class="s2-subtitle" style="margin-bottom: 12px;">Filter Akun</h3>
          <div class="filter-grid">
            <div class="filter-item">
              <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Role Akun</label>
              <div class="custom-select">
                <select v-model="roleFilter" :class="{ 'placeholder-color': roleFilter === 'Semua Role' }">
                  <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>

            <div v-if="isAdmin" class="filter-item">
              <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Unit</label>
              <div class="custom-select">
                <select v-model="unitFilter" :class="{ 'placeholder-color': unitFilter === 'Semua Unit' }">
                  <option v-for="u in units" :key="u.value" :value="u.value">{{ u.label }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>

            <div class="filter-item flex-grow">
              <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Cari Akun</label>
              <div class="search-box">
                <SearchIcon class="search-icon" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cari email, nama lengkap, atau nomor telepon pengguna"
                  @keyup.enter="handleSearch"
                />
              </div>
            </div>
          </div>
          <div class="filter-actions" style="margin-top: 10px;">
            <button @click="handleSearch" class="btn-apply btn-medium border border-transparent font-semibold">Terapkan Filter</button>
            <button @click="handleReset" class="btn-reset btn-medium border border-gray-300 font-semibold">Reset</button>
          </div>
        </div>

        <!-- Create Account Button -->
        <div class="flex justify-end mb-16">
          <button @click="handleTambahAkun" class="btn-add font-semibold text-sm shadow-md">
            <Plus class="w-5 h-5" /> Buat Akun
          </button>
        </div>

        <!-- Table Section -->
        <div class="table-container shadow-sm border border-gray-200 rounded-xl bg-white overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th class="col-no">No</th>
                  <th class="col-email">Email</th>
                  <th class="col-nama">Nama Lengkap</th>
                  <th class="col-telepon">No Telepon</th>
                  <th class="col-role text-center">Role</th>
                  <th v-if="isAdmin" class="col-unit text-center">Unit</th>
                  <th class="col-aksi text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="userStore.loading">
                  <td colspan="6" class="text-center py-8">Memuat data...</td>
                </tr>
                <tr v-else-if="userStore.users.length === 0">
                  <td colspan="6" class="text-center py-8 text-gray-500 bg-gray-50">Data pengguna tidak ditemukan</td>
                </tr>
                <tr
                  v-else
                  v-for="(user, index) in userStore.users"
                  :key="user.id"
                  class="border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer"
                  @click="handleViewUser(user)"
                >
                  <td class="b3-body font-medium">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td class="b3-body font-medium text-gray-800">{{ user.email }}</td>
                  <td class="b2-body text-gray-700">{{ user.nama_lengkap }}</td>
                  <td class="b3-body text-gray-600">{{ user.nomor_telepon }}</td>
                  <td class="text-center">
                    <span class="badge" :class="getRoleBadgeClass(user.role)">
                      {{ formatRoleDisplay(user.role) }}
                    </span>
                  </td>
                  <td v-if="isAdmin" class="text-center">
                    <span v-if="user.unit" class="badge unit-badge">{{ user.unit }}</span>
                    <span v-else class="text-gray-500">-</span>
                  </td>
                  <td>
                    <div class="flex justify-center gap-2">
                      <button @click.stop="handleEditUser(user)" class="btn-icon btn-edit" title="Ubah">
                        <EditIcon class="w-3.5 h-3.5" />
                      </button>
                      <button @click.stop="handleDeleteUser(user)" class="btn-icon btn-delete" title="Hapus">
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                      <button @click.stop="handleViewUser(user)" class="btn-icon btn-view" title="Detail">
                        <Eye class="w-3.5 h-3.5" />
                      </button>
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
              Showing Page {{ userStore.totalPages === 0 ? 0 : currentPage }} of {{ userStore.totalPages }}
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
              :disabled="currentPage <= 1"
              class="btn-page"
            >
              <ChevronLeft class="icon-sm" /> Previous
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage >= userStore.totalPages"
              class="btn-page"
            >
              Next <ChevronRight class="icon-sm" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="!isAdmin" v-show="activeTab === 'unit_lain'">
        <!-- Filter Card -->
        <div class="filter-card mb-20">
          <h3 class="s2-subtitle" style="margin-bottom: 12px;">Filter Akun</h3>
          <div class="filter-grid">
            <div class="filter-item">
              <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Pilih Unit</label>
              <div class="custom-select">
                <select v-model="unitLainUnitFilter" :class="{ 'placeholder-color': unitLainUnitFilter === 'Semua Unit' }">
                  <option v-for="u in unitLainFilterOptions" :key="u.value" :value="u.value">{{ u.label }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>
            <div class="filter-item flex-grow">
              <label class="c2-caption mb-2 block" style="margin-bottom: 8px;">Cari Akun</label>
              <div class="search-box">
                <SearchIcon class="search-icon" />
                <input
                  v-model="unitLainSearchQuery"
                  type="text"
                  placeholder="Cari akun"
                  @keyup.enter="handleUnitLainSearch"
                />
              </div>
            </div>
          </div>
          <div class="filter-actions" style="margin-top: 10px;">
            <button @click="handleUnitLainSearch" class="btn-apply btn-medium border border-transparent font-semibold">Terapkan Filter</button>
            <button @click="handleUnitLainReset" class="btn-reset btn-medium border border-gray-300 font-semibold">Reset</button>
          </div>
        </div>

        <!-- Table -->
        <div class="table-container shadow-sm border border-gray-200 rounded-xl bg-white overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th class="col-no">No</th>
                  <th class="col-email">Email</th>
                  <th class="col-nama">Nama Lengkap</th>
                  <th class="col-telepon">No Telepon</th>
                  <th class="col-unit text-center">Unit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="unitLainLoading">
                  <td colspan="5" class="text-center py-8">Memuat data...</td>
                </tr>
                <tr v-else-if="unitLainUsers.length === 0">
                  <td colspan="5" class="text-center py-8 text-gray-500 bg-gray-50">Data akun Sarpras tidak ditemukan</td>
                </tr>
                <tr
                  v-else
                  v-for="(user, index) in unitLainUsers"
                  :key="user.id"
                  class="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                >
                  <td class="b3-body font-medium">{{ (unitLainCurrentPage - 1) * unitLainPageSize + index + 1 }}</td>
                  <td class="b3-body font-medium text-gray-800">{{ user.email }}</td>
                  <td class="b2-body text-gray-700">{{ user.nama_lengkap }}</td>
                  <td class="b3-body text-gray-600">{{ user.nomor_telepon }}</td>
                  <td class="text-center">
                    <span class="badge status-role">{{ user.unit }}</span>
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
              Showing Page {{ unitLainTotalPages === 0 ? 0 : unitLainCurrentPage }} of {{ unitLainTotalPages }}
            </p>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">Per page:</span>
              <div class="custom-select page-size-wrapper">
                <select v-model="unitLainPageSize" class="page-size-select">
                  <option :value="10">10</option>
                  <option :value="30">30</option>
                  <option :value="50">50</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>
          </div>
          <div class="pagination-btns">
            <button @click="prevPageUnitLain" :disabled="unitLainCurrentPage <= 1" class="btn-page">
              <ChevronLeft class="icon-sm" /> Previous
            </button>
            <button @click="nextPageUnitLain" :disabled="unitLainCurrentPage >= unitLainTotalPages" class="btn-page">
              Next <ChevronRight class="icon-sm" />
            </button>
          </div>
        </div>
      </div>

    </div>

    <ConfirmationModal
      :show="showDeleteConfirm"
      title="Konfirmasi Delete Akun"
      message="Apakah Anda yakin ingin delete data ini dari sistem?"
      confirm-text="Ya, Delete"
      cancel-text="Batal"
      type="danger"
      :isLoading="isDeleting"
      @confirm="confirmDeleteUser"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<style scoped>
.user-management-page {
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
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  pointer-events: none;
  color: #6B7280;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-box input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
}

.search-box input:focus {
  border-color: #00588F;
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
  padding-top: 10px;
}

.btn-apply {
  background-color: #00588F;
  color: white;
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-apply:hover {
  background-color: #004470;
}

.btn-reset {
  background-color: white;
  color: var(--text-primary);
  padding: 10px 24px;
  border-radius: 40px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-reset:hover {
  background-color: #F9FAFB;
}

.table-container {
  background: white;
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

.col-no { width: 60px; }
.col-email { width: 180px; }
.col-nama { width: 180px; }
.col-telepon { width: 140px; }
.col-role { width: 120px; }
.col-unit { width: 100px; }
.col-aksi { width: 140px; }

table td {
  padding: 16px 12px;
  border-bottom: 1px solid #EEEEEE;
  vertical-align: middle;
  font-size: 13px;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
table tbody tr:last-child td {
  border-bottom: none;
}

.badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  display: inline-block;
  text-align: center;
  min-width: 80px;
  line-height: 1.2;
}

.role-admin,
.role-yayasan,
.role-sarpras,
.role-kepsek,
.role-guru,
.role-siswa,
.role-default,
.unit-badge,
.status-role {
  background-color: #00588F;
  border: none;
  color: white;
}

.btn-icon {
  width: 28px;
  height: 28px;
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
.btn-view { background-color: #9CA3AF; color: white; }

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

.py-16 { padding-top: 32px; padding-bottom: 32px; }
.mb-16 { margin-bottom: 32px; }
.mb-20 { margin-bottom: 40px; }
.mt-20 { margin-top: 40px; }
</style>
