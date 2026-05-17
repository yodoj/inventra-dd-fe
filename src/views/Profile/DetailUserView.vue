<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserManagementStore } from '@/stores/userManagementStore';
import { useToastStore } from '@/stores/toast';
import { useAuthStore } from '@/stores/auth';
import { Edit2, Trash2, ArrowLeft, User, ChevronRight } from 'lucide-vue-next';
import type { UserPerUnit } from '@/services/userManagementService';
import ConfirmationModal from '@/components/ConfirmationModal.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserManagementStore();
const toastStore = useToastStore();
const authStore = useAuthStore();

const user = ref<UserPerUnit | null>(null);
const loading = ref(true);
const showDeleteConfirm = ref(false);
const showSelfDeleteBlock = ref(false);
const isDeleting = ref(false);

const userId = computed(() => route.params.id as string);

const selfDeleteMessage = computed(() => {
  const base = 'Anda tidak bisa menghapus akun Anda sendiri.';
  if (authStore.userRole === 'SUPERADMIN') {
    return `${base} Silakan minta Superadmin lain untuk menghapus akun Anda.`;
  }
  return `${base} Silakan minta Sarpras lain di unit Anda atau Superadmin untuk menghapus akun Anda.`;
});

const displayRole = computed(() => {
  if (!user.value?.role) return '-';
  return user.value.role.charAt(0).toUpperCase() + user.value.role.slice(1).toLowerCase();
});

const isSiswa = computed(() => user.value?.role === 'SISWA');

onMounted(async () => {
  if (!userId.value) {
    toastStore.error('Error', 'User ID tidak ditemukan');
    router.back();
    return;
  }
  try {
    loading.value = true;
    const response = await userStore.fetchUserDetail(userId.value);
    if (response.success && response.data) {
      user.value = response.data;
    } else {
      toastStore.error('Error', 'Gagal memuat data pengguna');
      router.back();
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    toastStore.error('Error', 'Gagal memuat data pengguna');
    router.back();
  } finally {
    loading.value = false;
  }
});

const handleEdit = () => {
  router.push({ name: 'edit-user', params: { id: userId.value } });
};

const handleChangePassword = () => {
  router.push({ name: 'change-user-password', params: { id: userId.value } });
};

const handlePasswordHistory = () => {
  router.push({ name: 'password-history', query: { userId: userId.value } });
};

const handleDelete = () => {
  if (userId.value === authStore.user?.id) {
    showSelfDeleteBlock.value = true;
    return;
  }
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  isDeleting.value = true;
  const result = await userStore.deleteUser(userId.value);
  isDeleting.value = false;
  showDeleteConfirm.value = false;
  if (!result.success) {
    toastStore.error('Error', result.message || 'Gagal menghapus akun pengguna');
  } else {
    router.push('/profile/pengelolaan-akun');
  }
};
</script>

<template>
  <div class="page">
    <div class="layout">

      <!-- Back Button -->
      <button class="btn-back" @click="router.back()" title="Kembali">
        <ArrowLeft :size="20" color="white" />
      </button>

      <!-- Card -->
      <div class="card">

        <!-- Header (includes Edit & Delete buttons) -->
        <div class="card-header">
          <User :size="22" class="header-icon" />
          <span class="card-title">Detail Profile - {{ displayRole }}</span>

          <!-- Edit & Delete — inside header, pushed to the right -->
          <div class="card-actions">
            <button class="btn-action btn-edit" :disabled="loading" @click="handleEdit" title="Edit">
              <Edit2 :size="18" />
            </button>
            <button class="btn-action btn-delete" :disabled="loading" @click="handleDelete" title="Hapus">
              <Trash2 :size="18" />
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
          <div class="spinner" />
          <p>Memuat data detail...</p>
        </div>

        <!-- Fields -->
        <div v-else-if="user" class="card-body">
          <div v-if="isSiswa" class="field">
            <span class="field-label">NISN</span>
            <span class="field-value">{{ (user as any).nisn || '-' }}</span>
          </div>

          <div class="field">
            <span class="field-label">Email</span>
            <span class="field-value">{{ user.email }}</span>
          </div>

          <div class="field">
            <span class="field-label">Nama Lengkap</span>
            <span class="field-value">{{ user.nama_lengkap }}</span>
          </div>

          <div class="field">
            <span class="field-label">No Telepon</span>
            <span class="field-value">{{ user.nomor_telepon }}</span>
          </div>

          <div class="field">
            <span class="field-label">Role</span>
            <span class="field-value">{{ displayRole }}</span>
          </div>

          <div v-if="isSiswa" class="field">
            <span class="field-label">Kelas</span>
            <span class="field-value">{{ (user as any).kelas || '-' }}</span>
          </div>

          <div v-if="user.unit" class="field">
            <span class="field-label">Unit</span>
            <span class="field-value">{{ user.unit }}</span>
          </div>

          <div class="field field-password">
            <div class="password-left">
              <span class="field-label">Password</span>
              <span class="field-value password-dots">**********</span>
            </div>
            <div class="password-actions">
              <button class="btn-change-password" @click="handleChangePassword">
                Ubah Password
                <ChevronRight :size="15" />
              </button>
              <button class="btn-password-history" @click="handlePasswordHistory">
                Lihat Riwayat Perubahan Password
              </button>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="empty-state">
          <p>Data pengguna tidak ditemukan</p>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <ConfirmationModal
      :show="showDeleteConfirm"
      title="Konfirmasi Delete Akun"
      message="Apakah Anda yakin ingin delete data ini dari sistem?"
      confirm-text="Ya, Delete"
      cancel-text="Batal"
      type="danger"
      :isLoading="isDeleting"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- Self-delete Block -->
    <ConfirmationModal
      :show="showSelfDeleteBlock"
      title="Tidak Dapat Menghapus Akun"
      :message="selfDeleteMessage"
      confirm-text="Mengerti"
      type="danger"
      hide-cancel
      @confirm="showSelfDeleteBlock = false"
      @cancel="showSelfDeleteBlock = false"
    />
  </div>
</template>

<style scoped>
/* ── Page ─────────────────────────────────────────────── */
.page {
  background-color: #f3f4f6;
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 56px 24px 80px;
}

/* ── Layout: [back-btn]  [card] ───────────────────────── */
.layout {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  max-width: 590px;
}

/* ── Back Button ──────────────────────────────────────── */
.btn-back {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  margin-top: 30px;
  border-radius: 50%;
  background-color: #00588f;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 88, 143, 0.35);
  transition: background-color 0.2s, transform 0.2s;
}

.btn-back:hover {
  background-color: #004d7a;
  transform: scale(1.05);
}

/* ── Card ─────────────────────────────────────────────── */
.card {
  flex: 1;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 35px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* ── Card Header ──────────────────────────────────────── */
.card-header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 24px 20px 20px 40px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.header-icon {
  color: #1f2937;
  flex-shrink: 0;
}

.card-title {
  font-family: 'Inter', Helvetica, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  line-height: 1.35;
}

/* ── Edit & Delete buttons ────────────────────────────── */
.card-actions {
  margin-left: auto;
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.btn-action {
  width: 39px;
  height: 39px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  transition: opacity 0.2s, transform 0.15s;
}

.btn-action:hover:not(:disabled) {
  opacity: 0.85;
  transform: scale(1.08);
}

.btn-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-edit   { background-color: #00588f; color: #fff; }
.btn-delete { background-color: #DC3544; color: #fff; }

/* ── Fields ───────────────────────────────────────────── */
.card-body {
  padding: 0 40px 36px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.field:last-child {
  border-bottom: none;
}

.field-label {
  font-family: 'Inter', Helvetica, sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
}

.field-value {
  font-family: 'Inter', Helvetica, sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #6b7280;
  line-height: 1.4;
}

/* ── Password field ───────────────────────────────────── */
.field-password {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.password-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.password-dots {
  letter-spacing: 3px;
}

.password-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.btn-change-password {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border: 1.5px solid #00588f;
  border-radius: 8px;
  background-color: #ebf4fb;
  color: #00588f;
  font-family: 'Inter', Helvetica, sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
  white-space: nowrap;
}

.btn-change-password:hover {
  background-color: #d6eaf8;
}

.btn-password-history {
  background: none;
  border: none;
  padding: 0;
  color: #00588f;
  font-family: 'Inter', Helvetica, sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  white-space: nowrap;
}

.btn-password-history:hover {
  color: #004d7a;
}

/* ── Loading ──────────────────────────────────────────── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 24px;
  color: #6b7280;
  font-size: 14px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Empty ────────────────────────────────────────────── */
.empty-state {
  padding: 60px 40px;
  color: #6b7280;
  font-size: 15px;
}

/* ── Mobile ───────────────────────────────────────────── */
@media (max-width: 640px) {
  .page { padding: 32px 16px 48px; }

  .layout {
    flex-direction: column;
    gap: 12px;
    max-width: 100%;
  }

  .btn-back {
    margin-top: 0;
  }

  .card-header { padding: 20px 16px 16px 20px; }
  .card-body   { padding: 0 20px 28px; }
  .card-title  { font-size: 17px; }

  .field-password {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .password-actions {
    align-items: flex-start;
    width: 100%;
  }
}
</style>
