<script setup lang="ts">
import { X, AlertCircle, CheckCircle } from 'lucide-vue-next';

interface Props {
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'danger' | 'success';
  isLoading?: boolean;
  hideCancel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Konfirmasi',
  cancelText: 'Batal',
  type: 'confirm',
  isLoading: false,
  hideCancel: false
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content card-shadow">
      <div class="modal-header">
        <h3 class="s1-subtitle">{{ title }}</h3>
        <button @click="emit('cancel')" class="close-btn" :disabled="isLoading">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="modal-body py-6">
        <div class="flex items-start gap-4">
          <div :class="['icon-container', type]">
            <AlertCircle v-if="type === 'danger' || type === 'confirm'" class="w-6 h-6" />
            <CheckCircle v-if="type === 'success'" class="w-6 h-6" />
          </div>
          <p class="b2-body text-gray-600">{{ message }}</p>
        </div>
      </div>

      <div class="modal-footer flex justify-end gap-3 pt-4">
        <button
          v-if="!hideCancel"
          @click="emit('cancel')"
          class="btn-secondary"
          :disabled="isLoading"
        >
          {{ cancelText }}
        </button>
        <button
          @click="emit('confirm')"
          :class="['btn-main', type]"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Memproses...' : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 24px;
  max-width: 440px;
  width: 100%;
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #9CA3AF;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover:not(:disabled) {
  background-color: #F3F4F6;
  color: #374151;
}

.icon-container {
  padding: 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-container.confirm { background-color: #ECF8FD; color: #00588F; }
.icon-container.danger { background-color: #FBE5E6; color: #DC3545; }
.icon-container.success { background-color: #ECFDF5; color: #10B981; }

.btn-secondary {
  padding: 10px 24px;
  border-radius: 40px;
  background: #F3F4F6;
  color: #4B5563;
  border: none;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}

.btn-main {
  padding: 10px 24px;
  border-radius: 40px;
  border: none;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  color: white;
}

.btn-main.confirm { background-color: #00588F; }
.btn-main.danger { background-color: #DC3545; }
.btn-main.success { background-color: #10B981; }

.btn-main:disabled, .btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-shadow {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>
