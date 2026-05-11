<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserManagementStore } from '@/stores/userManagementStore';
import { useToastStore } from '@/stores/toast';
import { Edit2, Trash2, ArrowLeft, User } from 'lucide-vue-next';
import type { UserPerUnit } from '@/services/userManagementService';
import ConfirmationModal from '@/components/ConfirmationModal.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserManagementStore();
const toastStore = useToastStore();

const user = ref<UserPerUnit | null>(null);
const loading = ref(true);
const showDeleteConfirm = ref(false);

const userId = computed(() => route.params.id as string);

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
  toastStore.info('Info', 'Fitur edit sedang dikembangkan');
};

const handleDelete = () => {
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  showDeleteConfirm.value = false;
  try {
    const result = await userStore.deleteUser(userId.value);
    if (result.success) {
      toastStore.success('Success', 'Akun pengguna berhasil dihapus');
      router.push('/profile/pengelolaan-akun');
    }
  } catch (error) {
    toastStore.error('Error', 'Gagal menghapus akun pengguna');
  }
};
</script>

<template>
  <div class="page">
    <div class="layout">

      <!-- Back Button -->
      <button class="btn-back" @click="router.back()" title="Kembali">
        <ArrowLeft :size="24" color="white" />
      </button>

      <!-- Card -->
      <div class="card">

        <!-- Edit & Delete — floating top-right above card -->
        <div class="card-actions">
          <button class="btn-action btn-edit" :disabled="loading" @click="handleEdit" title="Edit">
            <Edit2 :size="18" />
          </button>
          <button class="btn-action btn-delete" :disabled="loading" @click="handleDelete" title="Hapus">
            <Trash2 :size="18" />
          </button>
        </div>

        <!-- Header -->
        <div class="card-header">
          <User :size="22" class="header-icon" />
          <span class="card-title">Detail Profile - {{ displayRole }}</span>
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
      title="Konfirmasi Hapus"
      message="Apakah Anda yakin ingin menghapus akun pengguna ini?"
      confirm-text="Ya, Hapus"
      cancel-text="Batal"
      type="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
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
  max-width: 590px; /* 52px btn + 20px gap + ~520px card */
}

/* ── Back Button ──────────────────────────────────────── */
.btn-back {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  margin-top: 30px;          /* aligns vertically with card header text */
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
  position: relative;
  flex: 1;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 35px rgba(0, 0, 0, 0.08);
  overflow: visible; /* let action buttons peek above */
}

/* ── Edit & Delete buttons ────────────────────────────── */
.card-actions {
  position: absolute;
  top: -19px;
  right: 16px;
  display: flex;
  gap: 6px;
  z-index: 5;
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

.btn-edit   { background-color: #0ea5e9; color: #fff; }
.btn-delete { background-color: #9e232f; color: #fff; }

/* ── Card Header ──────────────────────────────────────── */
.card-header {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 32px 40px 20px;
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
    width: 44px;
    height: 44px;
  }

  .card-header { padding: 28px 20px 16px; }
  .card-body   { padding: 0 20px 28px; }
  .card-title  { font-size: 17px; }
}
</style>
