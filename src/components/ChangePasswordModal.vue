<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { Eye, EyeOff, X } from 'lucide-vue-next';
import axios from 'axios';

const emit = defineEmits<{
  close: [];
}>();

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

  if (formData.value.newPassword.length < 6) {
    errorMessage.value = 'Password baru minimal 6 karakter';
    return;
  }

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
          <p class="field-hint">Minimal 6 karakter</p>
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
