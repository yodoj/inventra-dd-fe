<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronLeft, Edit2, Trash2, ArrowLeft, Loader } from 'lucide-vue-next';
import type { UserPerUnit } from '@/services/userManagementService';

interface Props {
  show: boolean;
  user: UserPerUnit | null;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
});
const emit = defineEmits<{
  close: [];
  edit: [];
  delete: [];
}>();

const showDeleteConfirm = ref(false);

const displayRole = computed(() => {
  if (!props.user?.role) return '-';
  return props.user.role.charAt(0).toUpperCase() + props.user.role.slice(1).toLowerCase();
});

const isSiswa = computed(() => props.user?.role === 'SISWA');

const handleDelete = () => {
  showDeleteConfirm.value = true;
};

const confirmDelete = () => {
  showDeleteConfirm.value = false;
  emit('delete');
};
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content slide-in">
      <!-- Header -->
      <div class="modal-header">
        <button class="btn-back" @click="emit('close')" title="Kembali">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h2 class="modal-title">Detail Profile - {{ displayRole }}</h2>
        <div class="modal-actions">
          <button
            :disabled="loading"
            class="btn-icon btn-edit"
            @click="emit('edit')"
            title="Edit"
          >
            <Edit2 class="w-4 h-4" />
          </button>
          <button
            :disabled="loading"
            class="btn-icon btn-delete"
            @click="handleDelete"
            title="Delete"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div v-if="user && !loading" class="modal-body">
        <!-- Siswa specific fields -->
        <div v-if="isSiswa" class="detail-field">
          <label class="field-label">NISN</label>
          <p class="field-value">{{ (user as any).nisn || '-' }}</p>
        </div>

        <!-- Email -->
        <div class="detail-field">
          <label class="field-label">Email</label>
          <p class="field-value">{{ user.email }}</p>
        </div>

        <!-- Nama Lengkap -->
        <div class="detail-field">
          <label class="field-label">Nama Lengkap</label>
          <p class="field-value">{{ user.nama_lengkap }}</p>
        </div>

        <!-- No Telepon -->
        <div class="detail-field">
          <label class="field-label">No Telepon</label>
          <p class="field-value">{{ user.nomor_telepon }}</p>
        </div>

        <!-- Role -->
        <div class="detail-field">
          <label class="field-label">Role</label>
          <p class="field-value">{{ displayRole }}</p>
        </div>

        <!-- Siswa specific fields -->
        <div v-if="isSiswa" class="detail-field">
          <label class="field-label">Kelas</label>
          <p class="field-value">{{ (user as any).kelas || '-' }}</p>
        </div>

        <!-- Unit (if applicable) -->
        <div v-if="user.unit" class="detail-field">
          <label class="field-label">Unit</label>
          <p class="field-value">{{ user.unit }}</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="modal-body loading-state">
        <div class="loading-spinner">
          <Loader class="animate-spin" />
          <p>Memuat data detail...</p>
        </div>
      </div>

      <!-- Delete Confirmation -->
      <div v-if="showDeleteConfirm && !loading" class="delete-confirmation">
        <p>Apakah Anda yakin ingin menghapus akun ini?</p>
        <div class="confirmation-buttons">
          <button
            class="btn btn-secondary"
            @click="showDeleteConfirm = false"
          >
            Batal
          </button>
          <button
            class="btn btn-danger"
            @click="confirmDelete"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  gap: 12px;
}

.btn-back {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-back:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon.btn-edit {
  color: #0ea5e9;
}

.btn-icon.btn-edit:hover {
  background-color: #e0f2fe;
  border-color: #0ea5e9;
}

.btn-icon.btn-delete {
  color: #ef4444;
}

.btn-icon.btn-delete:hover {
  background-color: #fee2e2;
  border-color: #ef4444;
}

.modal-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-field {
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-field:last-child {
  border-bottom: none;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.field-value {
  font-size: 14px;
  color: #1f2937;
  margin: 0;
}

.delete-confirmation {
  padding: 24px;
  background-color: #fef2f2;
  border-top: 1px solid #fecaca;
  text-align: center;
}

.delete-confirmation p {
  margin: 0 0 16px 0;
  color: #991b1b;
  font-weight: 500;
}

.confirmation-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #1f2937;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner svg {
  width: 32px;
  height: 32px;
  color: #0ea5e9;
}

.loading-spinner p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .modal-title {
    font-size: 18px;
  }
}
</style>
