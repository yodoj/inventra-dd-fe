<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Eye, EyeOff, X } from 'lucide-vue-next';
import axios from 'axios';
import ConfirmationModal from '@/components/ConfirmationModal.vue';
import { useToastStore } from '@/stores/toast';

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

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
const showConfirmModal = ref(false);

const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
  if (field === 'current') showCurrentPassword.value = !showCurrentPassword.value;
  if (field === 'new') showNewPassword.value = !showNewPassword.value;
  if (field === 'confirm') showConfirmPassword.value = !showConfirmPassword.value;
};

const handleChangePassword = async () => {
  // Validation
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

  // Strong password validation
  const p = formData.value.newPassword;
  const hasEightChars = p.length >= 8;
  const hasUpper = /[A-Z]/.test(p);
  const hasLower = /[a-z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const hasSpecial = /[^A-Za-z0-9]/.test(p);

  if (!hasEightChars || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    errorMessage.value = 'Password baru tidak memenuhi kriteria keamanan';
    return;
  }

  showConfirmModal.value = true;
};

const submitChangePassword = async () => {
  showConfirmModal.value = false;
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await axios.put(
      'http://localhost:8080/api/users/profile/password',
      {
        currentPassword: formData.value.currentPassword,
        newPassword: formData.value.newPassword,
        confirmPassword: formData.value.confirmPassword
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      }
    );

    successMessage.value = 'Password berhasil diubah!';
    setTimeout(() => {
      emit('close');
      router.push('/profile');
    }, 1500);
  } catch (err: any) {
    console.error('Error changing password:', err);
    if (err.response?.status === 401) {
      router.push('/login');
    } else {
      errorMessage.value =
        err.response?.data?.message || 'Gagal mengubah password. Silakan coba lagi.';
    }
  } finally {
    isLoading.value = false;
  }
};

const handleCancel = () => {
  emit('close');
};
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Ubah Password</h2>
        <button @click="handleCancel" class="close-btn" title="Tutup">
          <X class="icon-sm" />
        </button>
      </div>

      <!-- Alert Messages -->
      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <form @submit.prevent="handleChangePassword" class="password-form">
        <!-- Current Password -->
        <div class="form-group">
          <label class="form-label required">Password Saat Ini</label>
          <div class="password-input-wrapper">
            <input
              :type="showCurrentPassword ? 'text' : 'password'"
              v-model="formData.currentPassword"
              placeholder="Masukkan password saat ini"
              class="form-input"
              required
            />
            <button
              type="button"
              @click="togglePasswordVisibility('current')"
              class="toggle-password-btn"
            >
              <Eye v-if="showCurrentPassword" class="icon-xs" />
              <EyeOff v-else class="icon-xs" />
            </button>
          </div>
        </div>

        <!-- New Password -->
        <div class="form-group">
          <label class="form-label required">Password Baru</label>
          <div class="password-input-wrapper">
            <input
              :type="showNewPassword ? 'text' : 'password'"
              v-model="formData.newPassword"
              placeholder="Masukkan password baru"
              class="form-input"
              required
            />
            <button
              type="button"
              @click="togglePasswordVisibility('new')"
              class="toggle-password-btn"
            >
              <Eye v-if="showNewPassword" class="icon-xs" />
              <EyeOff v-else class="icon-xs" />
            </button>
          </div>
          <!-- Real-time Validation Checklist -->
          <div class="password-requirements mt-3">
            <p class="text-xs font-semibold mb-2 text-gray-500">KRITERIA PASSWORD:</p>
            <ul class="requirements-list">
              <li :class="{ 'valid': /[A-Z]/.test(formData.newPassword) }">
                <span class="dot"></span> Uppercase letter
              </li>
              <li :class="{ 'valid': /[a-z]/.test(formData.newPassword) }">
                <span class="dot"></span> Lowercase letter
              </li>
              <li :class="{ 'valid': /[0-9]/.test(formData.newPassword) }">
                <span class="dot"></span> Number
              </li>
              <li :class="{ 'valid': /[^A-Za-z0-9]/.test(formData.newPassword) }">
                <span class="dot"></span> Special character (e.g. !?<>@#$%)
              </li>
              <li :class="{ 'valid': formData.newPassword.length >= 8 }">
                <span class="dot"></span> 8 characters or more
              </li>
            </ul>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label class="form-label required">Konfirmasi Password Baru</label>
          <div class="password-input-wrapper">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="formData.confirmPassword"
              placeholder="Konfirmasi password baru"
              class="form-input"
              required
            />
            <button
              type="button"
              @click="togglePasswordVisibility('confirm')"
              class="toggle-password-btn"
            >
              <Eye v-if="showConfirmPassword" class="icon-xs" />
              <EyeOff v-else class="icon-xs" />
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Mengubah...' : 'Ubah Password' }}
          </button>
          <button type="button" @click="handleCancel" class="btn btn-ghost">
            Batal
          </button>
        </div>
      </form>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :show="showConfirmModal"
      title="Konfirmasi Ubah Password"
      message="Apakah Anda yakin ingin mengubah password Anda?"
      confirm-text="Ya, Ubah Password"
      cancel-text="Batal"
      type="confirm"
      :is-loading="isLoading"
      @confirm="submitChangePassword"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease-in;
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
  border-radius: 12px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
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

.close-btn:hover {
  color: #333;
}

/* Alert Messages */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.alert-error {
  background-color: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

.alert-success {
  background-color: #efe;
  color: #3c3;
  border: 1px solid #cfc;
}

/* Form */
.password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-label.required::after {
  content: ' *';
  color: #e53935;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #00588f;
  box-shadow: 0 0 0 3px rgba(0, 88, 143, 0.1);
}

.toggle-password-btn {
  position: absolute;
  right: 12px;
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

.toggle-password-btn:hover {
  color: #00588f;
}

.field-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;
}

.btn-primary {
  background-color: #00588f;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #003f5a;
  box-shadow: 0 4px 12px rgba(0, 88, 143, 0.3);
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-ghost {
  background-color: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-ghost:hover {
  background-color: #f5f5f5;
}

/* Password Requirements Checklist */
.password-requirements {
  background-color: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.requirements-list li {
  font-size: 11px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.requirements-list li .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #d1d5db;
  transition: all 0.3s ease;
}

.requirements-list li.valid {
  color: #10b981;
  font-weight: 500;
}

.requirements-list li.valid .dot {
  background-color: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.mt-3 {
  margin-top: 12px;
}

/* Responsive */
@media (max-width: 480px) {
  .modal-content {
    padding: 20px;
  }

  .modal-title {
    font-size: 18px;
  }

  .btn {
    padding: 10px 16px;
    font-size: 12px;
  }
}
</style>
