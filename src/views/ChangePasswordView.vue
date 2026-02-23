<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Eye, EyeOff } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import api from '@/services/api';

const router = useRouter();
const authStore = useAuthStore();

const formData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const showCancelModal = ref(false);

const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
  if (field === 'current') showCurrentPassword.value = !showCurrentPassword.value;
  if (field === 'new') showNewPassword.value = !showNewPassword.value;
  if (field === 'confirm') showConfirmPassword.value = !showConfirmPassword.value;
};

const handleSavePassword = async () => {
  if (!formData.value.currentPassword) {
    errorMessage.value = 'Password saat ini tidak boleh kosong';
    return;
  }
  if (!formData.value.newPassword) {
    errorMessage.value = 'Password baru tidak boleh kosong';
    return;
  }
  if (!formData.value.confirmPassword) {
    errorMessage.value = 'Konfirmasi password tidak boleh kosong';
    return;
  }
  if (formData.value.newPassword !== formData.value.confirmPassword) {
    errorMessage.value = 'Password baru dan konfirmasi tidak sesuai';
    return;
  }
  if (formData.value.newPassword === formData.value.currentPassword) {
    errorMessage.value = 'Password baru tidak boleh sama dengan password lama';
    return;
  }
  if (formData.value.newPassword.length < 8) {
    errorMessage.value = 'Password baru minimal 8 karakter';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await api.put('/api/profile/password', {
      currentPassword: formData.value.currentPassword,
      newPassword: formData.value.newPassword,
      confirmPassword: formData.value.confirmPassword
    });

    toast.success('Password berhasil diubah!');
    setTimeout(() => router.push('/profile'), 1500);
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || 'Gagal mengubah password. Silakan coba lagi.';
    toast.error(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  const isDirty =
    formData.value.currentPassword ||
    formData.value.newPassword ||
    formData.value.confirmPassword;

  if (isDirty) {
    showCancelModal.value = true;
  } else {
    router.push('/profile');
  }
};

const dismissCancel = () => {
  showCancelModal.value = false;
};

const confirmCancel = () => {
  showCancelModal.value = false;
  router.push('/profile');
};
</script>

<template>
  <div class="change-password-page">

    <!-- Back Button -->
    <button @click="() => router.push('/profile')" class="back-btn" title="Kembali">
      <img src="@/assets/button_back.png" alt="Back" class="back-icon" />
    </button>

    <!-- Main Card -->
    <div class="password-card">

      <!-- Card Header -->
      <div class="card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 12v2m0 4v.01"/>
        </svg>
        <h2 class="card-title">Ubah Password</h2>
      </div>

      <!-- Alerts -->
      <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <form @submit.prevent="handleSavePassword" class="form">

        <!-- Current Password -->
        <div class="form-row">
          <label class="form-label">Password Saat Ini</label>
          <div class="password-input-wrapper">
            <input
              :type="showCurrentPassword ? 'text' : 'password'"
              v-model="formData.currentPassword"
              placeholder="Masukkan password saat ini"
              class="form-input"
              required
            />
            <button type="button" @click="togglePasswordVisibility('current')" class="toggle-btn">
              <Eye v-if="showCurrentPassword" class="icon-toggle" />
              <EyeOff v-else class="icon-toggle" />
            </button>
          </div>
        </div>

        <!-- New Password -->
        <div class="form-row">
          <label class="form-label">Password Baru</label>
          <div class="password-input-wrapper">
            <input
              :type="showNewPassword ? 'text' : 'password'"
              v-model="formData.newPassword"
              placeholder="Masukkan password baru"
              class="form-input"
              required
            />
            <button type="button" @click="togglePasswordVisibility('new')" class="toggle-btn">
              <Eye v-if="showNewPassword" class="icon-toggle" />
              <EyeOff v-else class="icon-toggle" />
            </button>
          </div>
          <p class="form-hint">Minimal 8 karakter</p>
        </div>

        <!-- Confirm Password -->
        <div class="form-row">
          <label class="form-label">Konfirmasi Password Baru</label>
          <div class="password-input-wrapper">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="formData.confirmPassword"
              placeholder="Konfirmasi password baru"
              class="form-input"
              required
            />
            <button type="button" @click="togglePasswordVisibility('confirm')" class="toggle-btn">
              <Eye v-if="showConfirmPassword" class="icon-toggle" />
              <EyeOff v-else class="icon-toggle" />
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="submit" class="btn-save" :disabled="isLoading">
            {{ isLoading ? 'Menyimpan...' : 'Simpan' }}
          </button>
          <button type="button" @click="handleCancel" class="btn-cancel">
            Cancel
          </button>
        </div>

      </form>
    </div>

    <!-- Cancel Confirmation Modal -->
    <Transition name="modal">
      <div v-if="showCancelModal" class="modal-overlay" @click.self="dismissCancel">
        <div class="modal-box">

          <!-- Icon -->
          <div class="modal-icon-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <!-- Text -->
          <h3 class="modal-title">Batalkan Perubahan?</h3>
          <p class="modal-desc">Anda memiliki perubahan yang belum disimpan. Semua perubahan akan hilang jika Anda keluar sekarang.</p>

          <!-- Actions -->
          <div class="modal-actions">
            <button class="modal-btn modal-btn-keep" @click="dismissCancel">
              Lanjut Edit
            </button>
            <button class="modal-btn modal-btn-discard" @click="confirmCancel">
              Ya, Batalkan
            </button>
          </div>

        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.change-password-page {
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* ── BACK BUTTON ── */
.back-btn {
  background: #00588f;
  border: none;
  cursor: pointer;
  padding: 8px;
  margin-bottom: 24px;
  border-radius: 50%;
  transition: background 0.2s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
}
.back-btn:hover {
  background: #003f5a;
  transform: scale(1.05);
}
.back-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
}

/* ── CARD ── */
.password-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 36px;
  width: 100%;
  max-width: 560px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin: 0 auto;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  color: #1a1a1a;
}
.card-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

/* ── ALERTS ── */
.alert {
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
}
.alert-error {
  background: #fff0f0;
  color: #c0392b;
  border: 1px solid #f5c6c6;
}
.alert-success {
  background: #f0fff4;
  color: #27ae60;
  border: 1px solid #b2dfdb;
}

/* ── FORM ── */
.form {
  display: flex;
  flex-direction: column;
}
.form-row {
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-row:last-of-type {
  border-bottom: none;
}
.form-label {
  font-size: 13px;
  font-weight: 700;
  color: #333;
}
.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.form-input {
  font-size: 14px;
  color: #333;
  border: none;
  outline: none;
  background: transparent;
  padding: 0;
  font-family: inherit;
  width: 100%;
  transition: color 0.2s;
}
.form-input::placeholder {
  color: #bbb;
}
.form-input:focus {
  color: #1565a8;
}
.toggle-btn {
  position: absolute;
  right: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}
.toggle-btn:hover {
  color: #00588f;
}
.icon-toggle {
  width: 18px;
  height: 18px;
}
.form-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}

/* ── ACTION BUTTONS ── */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
.btn-save {
  flex: 1;
  padding: 13px;
  background: #1565a8;
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}
.btn-save:hover:not(:disabled) {
  background: #0d3f72;
}
.btn-save:disabled {
  background: #b0c8e8;
  cursor: not-allowed;
}
.btn-cancel {
  flex: 1;
  padding: 13px;
  background: #f0f2f5;
  color: #555;
  border: none;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}
.btn-cancel:hover {
  background: #e2e6ea;
}

/* ── MODAL ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 24px;
}
.modal-box {
  background: #fff;
  border-radius: 16px;
  padding: 32px 28px 28px;
  max-width: 380px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}
.modal-icon-wrap {
  width: 56px;
  height: 56px;
  background: #fff8e1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
  margin-bottom: 4px;
}
.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}
.modal-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}
.modal-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}
.modal-btn {
  flex: 1;
  padding: 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: background 0.2s;
}
.modal-btn-keep {
  background: #f0f2f5;
  color: #333;
}
.modal-btn-keep:hover {
  background: #e2e6ea;
}
.modal-btn-discard {
  background: #e53e3e;
  color: #fff;
}
.modal-btn-discard:hover {
  background: #c0392b;
}

/* ── MODAL TRANSITION ── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal-box,
.modal-leave-active .modal-box {
  transition: transform 0.2s ease;
}
.modal-enter-from .modal-box,
.modal-leave-to .modal-box {
  transform: scale(0.95);
}

/* ── RESPONSIVE ── */
@media (max-width: 600px) {
  .change-password-page {
    padding: 24px 16px;
  }
  .password-card {
    padding: 24px 20px;
  }
  .form-actions {
    flex-direction: column;
  }
  .modal-actions {
    flex-direction: column;
  }
}
</style>