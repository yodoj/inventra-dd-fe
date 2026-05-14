<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserManagementStore } from '@/stores/userManagementStore';
import { useAuthStore } from '@/stores/auth';
import { ChevronLeft, ChevronDown, Eye, EyeOff, Check, X } from 'lucide-vue-next';
import ConfirmationModal from '@/components/ConfirmationModal.vue';

const router = useRouter();
const userStore = useUserManagementStore();
const authStore = useAuthStore();

const isAdmin = computed(() => authStore.userRole === 'ADMIN');
const isSarpras = computed(() => authStore.userRole === 'SARPRAS');
const emailError = ref('');
const phoneError = ref('');

const form = reactive({
  email: '',
  nama_lengkap: '',
  nomor_telepon: '',
  role: '',
  unit: isSarpras.value ? authStore.user?.unit : '',
  password: '',
  nisn: '',
  kelas: ''
});

const showPassword = ref(false);
const showConfirmModal = ref(false);
const isSubmitting = ref(false);

const roles = [
  { label: 'Sarpras', value: 'SARPRAS' },
  { label: 'Kepsek', value: 'KEPSEK' },
  { label: 'Guru', value: 'GURU' },
  { label: 'Siswa', value: 'SISWA' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Yayasan', value: 'YAYASAN' }
].filter(role => {
  if (!isAdmin.value) {
    // Sarpras cannot create Admin or Yayasan
    return role.value !== 'ADMIN' && role.value !== 'YAYASAN';
  }
  return true;
});

const units = [
  { label: 'SD', value: 'SD' },
  { label: 'SMP', value: 'SMP' },
  { label: 'SMA', value: 'SMA' },
  { label: 'KB-TK', value: 'KB-TK' }
];

// Password validation rules
const passwordRules = computed(() => {
  const p = form.password;
  return [
    { label: 'Minimal 8 karakter dan maksimal 64 karakter', valid: p.length >= 8 && p.length <= 64 },
    { label: 'Ada huruf besar', valid: /[A-Z]/.test(p) },
    { label: 'Ada huruf kecil', valid: /[a-z]/.test(p) },
    { label: 'Ada angka', valid: /[0-9]/.test(p) },
    { label: 'Ada simbol', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
    { label: 'Tidak ada whitespace', valid: p.length > 0 && !/\s/.test(p) }
  ];
});

const isPasswordValid = computed(() => {
  const p = form.password;
  const lengthValid = p.length >= 8 && p.length <= 64;
  const noWhitespace = p.length > 0 && !/\s/.test(p);
  
  let categories = 0;
  if (/[A-Z]/.test(p)) categories++;
  if (/[a-z]/.test(p)) categories++;
  if (/[0-9]/.test(p)) categories++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) categories++;
  
  return lengthValid && noWhitespace && categories >= 4;
});

const isPhoneValid = computed(() => {
  const phone = form.nomor_telepon.trim();
  if (!phone) return true;
  return /^08[0-9]+$/.test(phone);
});

const isFormValid = computed(() => {
  const needsUnit = form.role !== 'ADMIN' && form.role !== 'YAYASAN';
  const basicFields = form.email && form.nama_lengkap && form.role && (needsUnit ? form.unit : true) && isPasswordValid.value && isPhoneValid.value;
  if (form.role === 'SISWA') {
    return basicFields && form.nisn && form.kelas && /^[0-9]+$/.test(form.nisn);
  }
  return basicFields;
});

const handleBack = () => {
  router.push('/profile/pengelolaan-akun');
};

const openConfirmModal = () => {
  if (isFormValid.value) {
    showConfirmModal.value = true;
  }
};

const submitForm = async () => {
  showConfirmModal.value = false;
  isSubmitting.value = true;
  
  try {
    const payload = { ...form };
    // Clean up unused fields if not SISWA
    if (form.role !== 'SISWA') {
      delete payload.nisn;
      delete payload.kelas;
    }

    const result = await userStore.createUser(payload);
    if (result.success) {
      // Use await to ensure navigation is processed
      await router.push({ name: 'pengelolaan-akun' });
    } else {
      // Check if it's an email conflict error
      const msg = result.message?.toLowerCase() || '';
      if (msg.includes('email') && msg.includes('terdaftar')) {
        emailError.value = result.message;
      } else if (msg.includes('telepon')) {
        phoneError.value = result.message;
      }
    }
  } catch (error) {
    console.error('Error during user creation or navigation:', error);
  } finally {
    // Ensure flag is reset even if redirect fails
    isSubmitting.value = false;
  }
};

// Reset SISWA fields if role changes
watch(() => form.role, (newRole) => {
  if (newRole !== 'SISWA') {
    form.nisn = '';
    form.kelas = '';
  }
});
</script>

<template>
  <div class="tambah-akun-page">
    <div class="container back-button-section">
      <!-- Back Button -->
      <button @click="handleBack" class="back-btn">
        <ChevronLeft class="w-6 h-6" />
      </button>
    </div>

    <div class="form-container">

      <div class="form-card">
        <h1 class="form-title">Tambah Akun</h1>

        <form @submit.prevent="openConfirmModal">
          <!-- Email -->
          <div class="form-group">
            <label class="label-text">Email <span class="required">*</span></label>
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="Masukkan email aktif pengguna" 
              required
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
              required
              class="form-input"
            />
          </div>

          <!-- No Telepon -->
          <div class="form-group">
            <label class="label-text">Nomor Telepon</label>
            <input 
              v-model.trim="form.nomor_telepon" 
              type="tel" 
              placeholder="08123456789" 
              class="form-input"
              :class="{ 'border-error': phoneError || (form.nomor_telepon && !isPhoneValid) }"
              @input="phoneError = ''"
            />
            <Transition name="fade">
              <p v-if="phoneError" class="error-text">{{ phoneError }}</p>
              <p v-else-if="form.nomor_telepon && !isPhoneValid" class="error-text">Format harus berupa angka dan diawali 08 (contoh: 08123456789)</p>
            </Transition>
          </div>

          <!-- Role -->
          <div class="form-group">
            <label class="label-text">Role <span class="required">*</span></label>
            <div class="custom-select">
              <select v-model="form.role" required :class="{ 'placeholder': !form.role }">
                <option value="" disabled selected>Pilih role</option>
                <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <!-- Conditional Siswa Fields -->
          <Transition name="fade">
            <div v-if="form.role === 'SISWA'">
              <div class="form-group">
                <label class="label-text">NISN <span class="required">*</span></label>
                <input 
                  v-model="form.nisn" 
                  type="text" 
                  placeholder="1234567890" 
                  required
                  pattern="^[0-9]+$"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label class="label-text">Kelas <span class="required">*</span></label>
                <input 
                  v-model="form.kelas" 
                  type="text" 
                  placeholder="12 IPA 1" 
                  required
                  class="form-input"
                />
              </div>
            </div>
          </Transition>

          <!-- Unit -->
          <div v-if="form.role !== 'ADMIN' && form.role !== 'YAYASAN'" class="form-group">
            <label class="label-text">Unit <span class="required">*</span></label>
            <div class="custom-select">
              <select 
                v-model="form.unit" 
                :disabled="isSarpras" 
                required 
                :class="{ 'placeholder': !form.unit, 'disabled': isSarpras }"
              >
                <option value="" disabled selected>Pilih unit</option>
                <option v-for="u in units" :key="u.value" :value="u.value">{{ u.label }}</option>
              </select>
              <ChevronDown class="select-icon" />
            </div>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label class="label-text">Password <span class="required">*</span></label>
            <div class="password-input-wrapper">
              <input 
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="Masukkan password" 
                required
                class="form-input"
              />
              <button 
                type="button" 
                @click="showPassword = !showPassword" 
                class="password-toggle"
              >
                <Eye v-if="!showPassword" class="w-6 h-6" />
                <EyeOff v-else class="w-6 h-6" />
              </button>
            </div>
            
            <!-- Password Rules -->
            <div class="rules-section">
              <p class="rules-title">Kriteria Password:</p>
              <div v-for="rule in passwordRules" :key="rule.label" class="rule-item">
                <div :class="['rule-indicator', { valid: rule.valid, invalid: form.password && !rule.valid }]">
                  <Check v-if="rule.valid" class="w-3 h-3" />
                  <X v-else-if="form.password" class="w-3 h-3" />
                </div>
                <span :class="['rule-text', { 'inactive': !form.password, 'valid': rule.valid, 'invalid': form.password && !rule.valid }]">
                  {{ rule.label }}
                </span>
              </div>
            </div>
          </div>

          <p class="required-legend"><span class="required">*</span>Wajib diisi</p>

          <!-- Buttons -->
          <div class="button-group">
            <button @click="handleBack" type="button" class="btn-cancel">
              Batal
            </button>
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

    <!-- Confirmation Modal -->
    <ConfirmationModal 
      :show="showConfirmModal"
      title="Konfirmasi Tambah Akun"
      message="Apakah Anda yakin ingin menambahkan akun pengguna baru ini?"
      confirmText="Ya, Simpan"
      cancelText="Batal"
      @confirm="submitForm"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<style scoped>
.tambah-akun-page {
  background-color: #FAFAFA;
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.back-button-section {
  width: 100%;
  padding-top: 40px;
  display: flex;
  justify-content: flex-start;
}

.back-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #00588F;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.back-btn:hover {
  background-color: #004470;
  transform: translateX(-4px);
}

.form-container {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin-top: 20px;
}

.form-card {
  background: white;
  border-radius: 20px;
  padding: 40px 48px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
}

.form-title {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  text-align: center;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 18px;
}

.label-text {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  display: block;
  margin-bottom: 6px;
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

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.required {
  color: #EF4444;
  margin-left: 2px;
}

.required-legend {
  color: #6B7280;
  font-size: 13px;
  margin-top: 4px;
}

.rules-section {
  margin-top: 14px;
}

.rules-title {
  font-size: 13px;
  color: #6B7280;
  font-weight: 600;
  margin-bottom: 6px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.rule-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s;
}

.rule-indicator.valid {
  background-color: #10B981;
}

.rule-indicator.invalid {
  background-color: #EF4444;
}

.rule-text {
  font-size: 12px;
  transition: all 0.2s;
}

.rule-text.inactive { color: #9CA3AF; }
.rule-text.valid { color: #059669; }
.rule-text.invalid { color: #DC2626; }

.button-group {
  display: flex;
  gap: 16px;
  padding-top: 24px;
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

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 600px) {
  .back-btn {
    position: static;
    margin-bottom: 20px;
    align-self: flex-start;
  }
  .form-card {
    padding: 30px 20px;
  }
}
</style>
