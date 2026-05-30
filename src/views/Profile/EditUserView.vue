<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserManagementStore } from '@/stores/userManagementStore';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { ArrowLeft, ChevronDown, User, Lock } from 'lucide-vue-next';
import ConfirmationModal from '@/components/ConfirmationModal.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserManagementStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const userId = computed(() => route.params.id as string);
const loading = ref(true);
const isSubmitting = ref(false);
const showConfirmModal = ref(false);
const emailError = ref('');

const isSelfEdit = computed(() => userId.value === authStore.user?.id);

const form = reactive({
  email: '',
  nama_lengkap: '',
  nomor_telepon: '',
  role: '',
  unit: '',
  nisn: '',
  kelas: ''
});

const isSarpras = computed(() => authStore.userRole === 'SARPRAS');
const isAdmin = computed(() => authStore.userRole === 'ADMIN');
const isSiswa = computed(() => form.role === 'SISWA');

const units = [
  { label: 'KB-TK', value: 'KB-TK' },
  { label: 'SD', value: 'SD' },
  { label: 'SMP', value: 'SMP' },
  { label: 'SMA', value: 'SMA' }
];

const displayRole = computed(() => {
  if (!form.role) return '';
  return form.role.charAt(0).toUpperCase() + form.role.slice(1).toLowerCase();
});

const allRoles = [
  { label: 'Sarpras', value: 'SARPRAS' },
  { label: 'Kepsek', value: 'KEPSEK' },
  { label: 'Guru', value: 'GURU' },
  { label: 'Siswa', value: 'SISWA' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Yayasan', value: 'YAYASAN' }
];

const roles = computed(() => {
  if (isSarpras.value) {
    return allRoles.filter(r => r.value !== 'ADMIN' && r.value !== 'YAYASAN');
  }
  return allRoles;
});

const isFormValid = computed(() => {
  const basic = form.email && form.nama_lengkap && form.role;
  const needsUnit = isAdmin.value && form.role !== 'ADMIN' && form.role !== 'YAYASAN';
  const unitValid = needsUnit ? !!form.unit : true;
  if (form.role === 'SISWA') {
    return !!(basic && unitValid && form.nisn && form.kelas && /^[0-9]+$/.test(form.nisn));
  }
  return !!(basic && unitValid);
});

onMounted(async () => {
  if (!userId.value) {
    toastStore.error('Error', 'User ID tidak ditemukan');
    router.push({ name: 'pengelolaan-akun' });
    return;
  }
  try {
    loading.value = true;
    const response = await userStore.fetchUserDetail(userId.value);
    if (response.success && response.data) {
      const data = response.data;
      form.email = data.email || '';
      form.nama_lengkap = data.nama_lengkap || '';
      form.nomor_telepon = data.nomor_telepon || '';
      form.role = data.role || '';
      form.unit = data.unit || '';
      form.nisn = (data as any).nisn || '';
      form.kelas = (data as any).kelas || '';
    } else {
      toastStore.error('Error', 'Gagal memuat data pengguna');
      router.push({ name: 'pengelolaan-akun' });
    }
  } catch {
    toastStore.error('Error', 'Gagal memuat data pengguna');
    router.push({ name: 'pengelolaan-akun' });
  } finally {
    loading.value = false;
  }
});

watch(() => form.role, (newRole, oldRole) => {
  if (newRole !== 'SISWA') {
    form.nisn = '';
    form.kelas = '';
  }
  const wasLocked = oldRole === 'ADMIN' || oldRole === 'YAYASAN';
  const isNowLocked = newRole === 'ADMIN' || newRole === 'YAYASAN';
  if (wasLocked && !isNowLocked && isAdmin.value) {
    form.unit = '';
  }
});

const handleBack = () => {
  router.push({ name: 'pengelolaan-akun' });
};

const handleChangePassword = () => {
  router.push({ name: 'change-user-password', params: { id: userId.value } });
};

const openConfirmModal = () => {
  if (!isFormValid.value) return;
  emailError.value = '';
  showConfirmModal.value = true;
};

const submitForm = async () => {
  showConfirmModal.value = false;
  isSubmitting.value = true;
  try {
    const payload: any = {
      email: form.email,
      nama_lengkap: form.nama_lengkap,
      nomor_telepon: form.nomor_telepon,
      role: form.role,
    };
    if (form.role === 'SISWA') {
      payload.nisn = form.nisn;
      payload.kelas = form.kelas;
    }
    if (isAdmin.value && form.role !== 'ADMIN' && form.role !== 'YAYASAN') {
      payload.unit = form.unit;
    }
    const result = await userStore.updateUser(userId.value, payload);
    if (!result.success) {
      const msg = result.message?.toLowerCase() || '';
      if (msg.includes('email')) {
        emailError.value = result.message || 'Email sudah terdaftar';
      }
    } else {
      router.back();
    }
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="edit-akun-page">
    <div class="layout">
      <button @click="handleBack" class="back-btn" title="Kembali">
        <ArrowLeft :size="20" color="white" />
      </button>

      <div class="form-container">
      <!-- Loading state -->
      <div v-if="loading" class="form-card loading-card">
        <div class="spinner" />
        <p class="loading-text">Memuat data pengguna...</p>
      </div>

      <div v-else class="form-card">
        <div class="card-header">
          <User :size="22" class="header-icon" />
          <h1 class="form-title">Detail Profile - {{ displayRole }}</h1>
        </div>

        <form @submit.prevent="openConfirmModal">
          <!-- NISN (SISWA only) -->
          <Transition name="fade">
            <div v-if="isSiswa" class="form-group">
              <label class="label-text">NISN <span class="required">*</span></label>
              <input
                v-model="form.nisn"
                type="text"
                placeholder="1234567890"
                class="form-input"
                pattern="^[0-9]+$"
              />
            </div>
          </Transition>

          <!-- Email -->
          <div class="form-group">
            <label class="label-text">Email <span class="required">*</span></label>
            <input
              v-model="form.email"
              type="email"
              placeholder="Masukkan email aktif pengguna"
              class="form-input"
              :class="{ 'border-error': emailError }"
              @input="emailError = ''"
            />
            <Transition name="fade">
              <p v-if="emailError" class="error-text">{{ emailError }}</p>
            </Transition>
          </div>

          <!-- Nama Lengkap -->
          <div class="form-group">
            <label class="label-text">Nama Lengkap <span class="required">*</span></label>
            <input
              v-model="form.nama_lengkap"
              type="text"
              placeholder="Masukkan nama lengkap"
              class="form-input"
            />
          </div>

          <!-- No Telepon -->
          <div class="form-group">
            <label class="label-text">No Telepon</label>
            <input
              v-model="form.nomor_telepon"
              type="tel"
              placeholder="Masukkan nomor telepon aktif"
              class="form-input"
            />
          </div>

          <!-- Role -->
          <div class="form-group">
            <label class="label-text">
              Role <span class="required">*</span>
              <Lock v-if="isSelfEdit" :size="12" class="label-lock-icon" />
            </label>
            <div class="custom-select">
              <select
                v-model="form.role"
                :class="{ placeholder: !form.role, disabled: isSelfEdit }"
                :disabled="isSelfEdit"
              >
                <option value="" disabled>Pilih role</option>
                <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
            <p v-if="isSelfEdit" class="field-hint">
              Role tidak dapat diubah pada akun sendiri. Minta Sarpras lain di unit Anda atau Superadmin untuk mengubahnya.
            </p>
          </div>

          <!-- Kelas (SISWA only) -->
          <Transition name="fade">
            <div v-if="isSiswa" class="form-group">
              <label class="label-text">Kelas <span class="required">*</span></label>
              <input
                v-model="form.kelas"
                type="text"
                placeholder="Contoh: X MIPA 1"
                class="form-input"
              />
            </div>
          </Transition>

          <!-- Unit (always visible; locked to Superadmin for ADMIN/YAYASAN roles) -->
          <div class="form-group">
            <label class="label-text">
              Unit<span v-if="isAdmin && form.role !== 'ADMIN' && form.role !== 'YAYASAN'" class="required"> *</span>
              <Lock v-if="isSarpras" :size="12" class="label-lock-icon" />
            </label>
            <div class="custom-select">
              <select v-if="form.role === 'ADMIN'" disabled class="disabled">
                <option value="SUPERADMIN">Superadmin</option>
              </select>
              <select v-else-if="form.role === 'YAYASAN'" disabled class="disabled">
                <option value="YAYASAN">Yayasan</option>
              </select>
              <select
                v-else-if="isAdmin"
                v-model="form.unit"
                :class="{ placeholder: !form.unit }"
              >
                <option value="" disabled>Pilih unit</option>
                <option v-for="u in units" :key="u.value" :value="u.value">{{ u.label }}</option>
              </select>
              <select v-else v-model="form.unit" disabled class="disabled">
                <option :value="form.unit">{{ form.unit }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
            <p v-if="isSarpras" class="field-hint">
              Sebagai Sarpras, Anda hanya memiliki wewenang untuk mengelola akun di unit Anda sendiri.
            </p>
          </div>

          <!-- Ubah Password button -->
          <div class="change-password-section">
            <button type="button" class="btn-change-password" @click="handleChangePassword">
              <span>Ubah Password</span>
              <span class="arrow">&rsaquo;</span>
            </button>
            <router-link
              :to="{ name: 'password-history', query: { userId: userId } }"
              class="history-link"
            >
              Lihat Riwayat Perubahan Password
            </router-link>
          </div>

          <p class="required-legend"><span class="required">*</span>Wajib diisi</p>

          <div class="button-group">
            <button type="button" @click="handleBack" class="btn-cancel">Batal</button>
            <button
              type="submit"
              class="btn-submit"
              :disabled="!isFormValid || isSubmitting"
            >
              {{ isSubmitting ? 'Memproses...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>

    <ConfirmationModal
      :show="showConfirmModal"
      title="Konfirmasi Edit Akun"
      message="Apakah Anda yakin ingin menyimpan perubahan data akun ini?"
      confirmText="Ya, Simpan"
      cancelText="Batal"
      :isLoading="isSubmitting"
      @confirm="submitForm"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<style scoped>
.edit-akun-page {
  background-color: #FAFAFA;
  min-height: calc(100vh - 80px);
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
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
}

.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 48px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #E5E7EB;
  border-top-color: #00588F;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #6B7280;
  font-size: 14px;
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

.form-group {
  margin-bottom: 18px;
}

.label-text {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}

.label-lock-icon {
  color: #9CA3AF;
  margin-left: 4px;
}

.field-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
  background-color: #F9FAFB;
  border-left: 3px solid #00588F;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 8px 0 0;
  line-height: 1.5;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid #D1D5DB;
  font-size: 14px;
  color: #374151;
  outline: none;
  transition: all 0.2s;
  background-color: white;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #9CA3AF;
}

.form-input:focus {
  border-color: #00588F;
  box-shadow: 0 0 0 3px rgba(0, 88, 143, 0.05);
}

.form-input.border-error {
  border-color: #EF4444 !important;
  background-color: #FFF5F5;
}

.error-text {
  color: #EF4444;
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
}

.custom-select {
  position: relative;
}

.custom-select select {
  width: 100%;
  padding: 12px 16px;
  padding-right: 44px;
  border-radius: 10px;
  border: 1px solid #D1D5DB;
  font-size: 14px;
  appearance: none;
  outline: none;
  background: white;
  cursor: pointer;
  color: #374151;
  box-sizing: border-box;
}

.custom-select select:focus {
  border-color: #00588F;
}

.custom-select select.placeholder {
  color: #9CA3AF;
}

.custom-select select.disabled {
  background-color: #F3F4F6;
  cursor: not-allowed;
  color: #6B7280;
}

.select-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6B7280;
  pointer-events: none;
  width: 18px;
  height: 18px;
}

.required {
  color: #EF4444;
  margin-left: 2px;
}

.required-legend {
  color: #6B7280;
  font-size: 13px;
  margin-top: 4px;
  margin-bottom: 0;
}

/* Ubah Password section */
.change-password-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0 12px;
  gap: 8px;
}

.btn-change-password {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-radius: 12px;
  border: 1.5px solid #00588F;
  background-color: #EBF4FB;
  color: #00588F;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-change-password:hover {
  background-color: #D6EAF8;
}

.btn-change-password .arrow {
  font-size: 20px;
  font-weight: 400;
  line-height: 1;
}

.history-link {
  font-size: 13px;
  color: #00588F;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s;
}

.history-link:hover {
  color: #004470;
}

.button-group {
  display: flex;
  gap: 16px;
  padding-top: 20px;
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
  transition: all 0.2s;
}

.btn-cancel:hover {
  background-color: #E5E7EB;
}

.btn-submit {
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

.btn-submit:hover:not(:disabled) {
  background-color: #004470;
  box-shadow: 0 6px 14px rgba(0, 88, 143, 0.15);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 600px) {
  .edit-akun-page {
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
