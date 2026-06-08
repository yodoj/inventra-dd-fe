<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserManagementStore } from '@/stores/userManagementStore';
import { ArrowLeft, User, Eye, EyeOff } from 'lucide-vue-next';
import ConfirmationModal from '@/components/ConfirmationModal.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserManagementStore();

const userId = computed(() => route.params.id as string);
const isLoading = ref(false);
const showConfirmModal = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const form = ref({
  new_password: '',
  confirm_password: ''
});

const passwordChecks = computed(() => {
  const p = form.value.new_password;
  return {
    hasUpper: /[A-Z]/.test(p),
    hasLower: /[a-z]/.test(p),
    hasNumber: /[0-9]/.test(p),
    hasSpecial: /[^A-Za-z0-9]/.test(p),
    hasLength: p.length >= 8
  };
});

const isPasswordValid = computed(() => {
  const c = passwordChecks.value;
  return c.hasUpper && c.hasLower && c.hasNumber && c.hasSpecial && c.hasLength;
});

const isFormValid = computed(() =>
  !!form.value.new_password &&
  !!form.value.confirm_password &&
  form.value.new_password === form.value.confirm_password &&
  isPasswordValid.value
);

const handleBack = () => {
  router.push({ name: 'edit-user', params: { id: userId.value } });
};

const openConfirmModal = () => {
  if (isFormValid.value) {
    showConfirmModal.value = true;
  }
};

const submitForm = async () => {
  showConfirmModal.value = false;
  isLoading.value = true;
  try {
    const result = await userStore.changeUserPassword(userId.value, {
      new_password: form.value.new_password,
      confirm_password: form.value.confirm_password
    });
    if (result.success) {
      router.replace({ name: 'detail-user', params: { id: userId.value } });
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="change-pw-page">
    <div class="layout">
      <button @click="handleBack" class="back-btn" title="Kembali">
        <ArrowLeft :size="20" color="white" />
      </button>

      <div class="form-container">
      <div class="form-card">
        <div class="card-header">
          <User :size="22" class="header-icon" />
          <h1 class="form-title">Ubah Password</h1>
        </div>

        <form @submit.prevent="openConfirmModal">
          <!-- New Password -->
          <div class="form-row">
            <label class="form-label">New Password</label>
            <div class="password-input-wrapper">
              <input
                :type="showNewPassword ? 'text' : 'password'"
                v-model="form.new_password"
                placeholder="Masukkan password baru"
                class="form-input"
              />
              <button type="button" @click="showNewPassword = !showNewPassword" class="toggle-btn">
                <Eye v-if="showNewPassword" class="icon-toggle" />
                <EyeOff v-else class="icon-toggle" />
              </button>
            </div>

            <!-- Password checklist (same as ChangePasswordView) -->
            <div class="password-requirements mt-3">
              <p class="text-xs font-semibold mb-2 text-gray-500">KRITERIA PASSWORD:</p>
              <ul class="requirements-list">
                <li :class="{ valid: passwordChecks.hasUpper }">
                  <span class="dot"></span> Uppercase letter
                </li>
                <li :class="{ valid: passwordChecks.hasLower }">
                  <span class="dot"></span> Lowercase letter
                </li>
                <li :class="{ valid: passwordChecks.hasNumber }">
                  <span class="dot"></span> Number
                </li>
                <li :class="{ valid: passwordChecks.hasSpecial }">
                  <span class="dot"></span> Special character (e.g. !?&lt;&gt;@#$%)
                </li>
                <li :class="{ valid: passwordChecks.hasLength }">
                  <span class="dot"></span> 8 characters or more
                </li>
              </ul>
            </div>
          </div>

          <!-- Confirm Password -->
          <div class="form-row">
            <label class="form-label">Confirm Password</label>
            <div class="password-input-wrapper">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="form.confirm_password"
                placeholder="Konfirmasi password baru"
                class="form-input"
              />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="toggle-btn">
                <Eye v-if="showConfirmPassword" class="icon-toggle" />
                <EyeOff v-else class="icon-toggle" />
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-save" :disabled="!isFormValid || isLoading">
              {{ isLoading ? 'Menyimpan...' : 'Simpan' }}
            </button>
            <button type="button" @click="handleBack" class="btn-cancel">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>

    <ConfirmationModal
      :show="showConfirmModal"
      title="Konfirmasi Ubah Password"
      message="Apakah Anda yakin ingin mengubah password pengguna ini?"
      confirm-text="Ya, Ubah Password"
      cancel-text="Batal"
      type="confirm"
      :is-loading="isLoading"
      @confirm="submitForm"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<style scoped>
.change-pw-page {
  min-height: calc(100vh - 80px);
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 56px 24px 80px;
}

.layout {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  max-width: 544px;
}

.back-btn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  margin-top: 30px;
  border-radius: 50%;
  background-color: #00588F;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
  box-shadow: 0 4px 14px rgba(0, 88, 143, 0.35);
}

.back-btn:hover {
  background-color: #004d7a;
  transform: scale(1.05);
}

.form-container {
  flex: 1;
  min-width: 0;
  margin-bottom: 40px;
}

.form-card {
  background: white;
  border-radius: 20px;
  padding: 40px 48px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}

.header-icon {
  color: #00588F;
}

.form-title {
  font-size: 20px;
  font-weight: 800;
  color: #111827;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-row {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.password-input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 12px 44px 12px 16px;
  border: 1px solid #D1D5DB;
  border-radius: 10px;
  font-size: 14px;
  color: #374151;
  outline: none;
  transition: border-color 0.2s;
  background: white;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #9CA3AF;
}

.form-input:focus {
  border-color: #00588F;
  box-shadow: 0 0 0 3px rgba(0, 88, 143, 0.05);
}

.toggle-btn {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6B7280;
  display: flex;
  align-items: center;
  padding: 0;
}

.icon-toggle {
  width: 18px;
  height: 18px;
}

/* Password checklist — identical to ChangePasswordView */
.password-requirements {
  margin-top: 12px;
}

.text-xs {
  font-size: 11px;
}

.font-semibold {
  font-weight: 600;
}

.mb-2 {
  margin-bottom: 8px;
}

.text-gray-500 {
  color: #6B7280;
}

.mt-3 {
  margin-top: 12px;
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
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #9CA3AF;
  transition: color 0.2s;
}

.requirements-list li.valid {
  color: #16A34A;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #D1D5DB;
  flex-shrink: 0;
  transition: background-color 0.2s;
}

.requirements-list li.valid .dot {
  background-color: #16A34A;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}

.btn-save {
  flex: 1;
  padding: 12px 20px;
  border-radius: 40px;
  background-color: #00588F;
  color: white;
  font-weight: 700;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(0, 88, 143, 0.1);
}

.btn-save:hover:not(:disabled) {
  background-color: #004470;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  flex: 1;
  padding: 12px 20px;
  border-radius: 40px;
  background-color: #F3F4F6;
  color: #4B5563;
  font-weight: 700;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover {
  background-color: #E5E7EB;
}

@media (max-width: 600px) {
  .change-pw-page {
    padding: 32px 16px 48px;
  }

  .layout {
    gap: 12px;
    max-width: 100%;
  }

  .back-btn {
    margin-top: 0;
  }

  .form-card {
    padding: 28px 20px;
    border-radius: 16px;
  }
}
</style>
