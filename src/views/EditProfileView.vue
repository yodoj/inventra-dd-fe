<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import api from '@/services/api';

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();

const formData = ref({
  name: '',
  email: '',
  role: '',
  unit: '',
  phoneNumber: '',
  nisn: '',
  kelas: '',
});

const isLoading = ref(false);
const isSaving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const showCancelModal = ref(false); // ← modal state

const isSiswa = computed(() => formData.value.role === 'SISWA');

const kelasOptionsMap: Record<string, string[]> = {
  'KB-TK': ['KB', 'TK A', 'TK B'],
  'SD':    ['1', '2', '3', '4', '5', '6'],
  'SMP':   ['7', '8', '9'],
  'SMA':   ['10', '11', '12'],
};

const kelasOptions = computed(() => kelasOptionsMap[formData.value.unit] ?? []);

function mapKelasToOption(kelas: string, unit: string): string {
  const opts = kelasOptionsMap[unit] ?? [];
  if (!kelas) return '';
  if (opts.includes(kelas)) return kelas;
  const romanToNum: [string, string][] = [
    ['XII', '12'], ['XI', '11'], ['X', '10'],
    ['IX', '9'], ['VIII', '8'], ['VII', '7'],
    ['VI', '6'], ['V', '5'], ['IV', '4'],
    ['III', '3'], ['II', '2'], ['I', '1'],
  ];
  const upper = kelas.trim().toUpperCase();
  for (const [roman, num] of romanToNum) {
    if (upper.startsWith(roman) && opts.includes(num)) return num;
  }
  return '';
}

watch(() => formData.value.unit, (newUnit) => {
  if (isSiswa.value) {
    formData.value.kelas = mapKelasToOption(formData.value.kelas, newUnit);
  }
});

const isFormDirty = computed(() => {
  return (
    formData.value.name !== authStore.user?.name ||
    formData.value.phoneNumber !== authStore.user?.phoneNumber ||
    (isSiswa.value && formData.value.nisn !== authStore.user?.nisn) ||
    (isSiswa.value && formData.value.kelas !== authStore.user?.kelas)
  );
});

const fetchProfile = async () => {
  if (!authStore.token) { router.push('/login'); return; }
  isLoading.value = true;
  try {
    const response = await api.get('/api/profile');
    const data = response.data.data;
    formData.value = {
      name: data.name || '',
      email: data.email || '',
      role: data.role || '',
      unit: data.unit || '',
      phoneNumber: data.phoneNumber || '',
      nisn: data.nisn || '',
      kelas: mapKelasToOption(data.kelas || '', data.unit || ''),
    };
    // Update auth store with complete profile data
    authStore.setAuth(data, authStore.token!);
  } catch {
    errorMessage.value = 'Gagal memuat data profil. Silakan coba lagi.';
  } finally {
    isLoading.value = false;
  }
};

const handleSaveProfile = async () => {
  // Validation: Name
  if (!formData.value.name.trim()) {
    errorMessage.value = 'Nama Lengkap tidak boleh kosong';
    return;
  }

  // Validation: Phone Number
  if (!formData.value.phoneNumber.trim()) {
    errorMessage.value = 'No Telepon tidak boleh kosong';
    return;
  }
  // Strip spasi, -, ., (, ) lalu normalisasi prefix +62/62 → 08
  let cleanedPhone = formData.value.phoneNumber.replace(/[\s\-.\(\)]/g, '');
  if (cleanedPhone.startsWith('+62')) {
    cleanedPhone = '0' + cleanedPhone.substring(3);
  } else if (cleanedPhone.startsWith('62') && cleanedPhone.length > 5) {
    cleanedPhone = '0' + cleanedPhone.substring(2);
  }
  if (!/^08[0-9]{6,13}$/.test(cleanedPhone)) {
    errorMessage.value = 'No Telepon tidak valid. Gunakan format 08xx, +62xx, atau 62xx dengan panjang 8-15 digit';
    return;
  }

  // Validation: For SISWA role only
  if (isSiswa.value) {
    if (!formData.value.nisn.trim()) {
      errorMessage.value = 'NISN tidak boleh kosong untuk Siswa';
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.value.nisn)) {
      errorMessage.value = 'NISN harus tepat 10 digit angka';
      return;
    }
    if (!formData.value.kelas.trim()) {
      errorMessage.value = 'Kelas tidak boleh kosong untuk Siswa';
      return;
    }
  } else {
    // Non-SISWA cannot have NISN or KELAS
    if (formData.value.nisn?.trim()) {
      errorMessage.value = 'NISN hanya dapat diisi oleh Siswa';
      return;
    }
    if (formData.value.kelas?.trim()) {
      errorMessage.value = 'Kelas hanya dapat diisi oleh Siswa';
      return;
    }
  }

  isSaving.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const payload: Record<string, string | undefined> = {
      name: formData.value.name,
      phoneNumber: formData.value.phoneNumber
    };

    if (isSiswa.value) {
      payload.nisn = formData.value.nisn;
      payload.kelas = formData.value.kelas;
    }

    const response = await api.put('/api/profile', payload);

    const updatedUser = { ...authStore.user, ...response.data.data };
    authStore.setAuth(updatedUser, authStore.token!);

    toastStore.success('Success', 'Profil berhasil diperbarui!');
    setTimeout(() => router.push('/profile'), 1500);
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    errorMessage.value = axiosErr.response?.data?.message || 'Gagal menyimpan profil. Silakan coba lagi.';
    // Error notification is now handled by components using premium toastStore
    toastStore.error('Error', errorMessage.value);
  } finally {
    isSaving.value = false;
  }
};

const handleCancel = () => {
  if (isFormDirty.value) {
    showCancelModal.value = true; // ← tampilkan modal, bukan confirm()
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

const handleOpenChangePassword = () => {
  router.push('/profile/change-password');
};

const handleViewPasswordHistory = () => {
  router.push('/profile/password-history');
};

onMounted(() => { fetchProfile(); });
</script>

<template>
  <div class="edit-page">

    <!-- Back Button -->
    <button @click="() => router.push('/profile')" class="back-btn" title="Kembali">
      <img src="@/assets/button_back.png" alt="Back" class="back-icon" />
    </button>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <p>Memuat data profil...</p>
    </div>

    <!-- Main Card -->
    <div v-else class="edit-card">

      <!-- Card Header -->
      <div class="card-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        <h2 class="card-title">Informasi Diri</h2>
      </div>

      <!-- Alerts -->
      <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <form @submit.prevent="handleSaveProfile" class="form">

        <!-- Email (read-only) -->
        <div class="form-row">
          <label class="form-label form-label-disabled">Email</label>
          <p class="form-readonly">{{ formData.email }}</p>
        </div>

        <!-- Nama Lengkap (editable) -->
        <div class="form-row">
          <label class="form-label">Nama Lengkap</label>
          <input
            type="text"
            v-model="formData.name"
            placeholder="Masukkan nama lengkap"
            class="form-input"
            required
          />
        </div>

        <!-- Role (read-only) -->
        <div class="form-row">
          <label class="form-label form-label-disabled">Role</label>
          <p class="form-readonly">{{ formData.role }}</p>
        </div>

        <!-- Unit (read-only) -->
        <div class="form-row">
          <label class="form-label form-label-disabled">Unit</label>
          <p class="form-readonly">{{ formData.unit }}</p>
        </div>

        <!-- NISN - Siswa only -->
        <div v-if="isSiswa" class="form-row">
          <label class="form-label">NISN</label>
          <small class="form-hint">NISN harus tepat 10 digit angka</small>
          <input
            type="text"
            v-model="formData.nisn"
            placeholder="Masukkan NISN"
            class="form-input"
            pattern="[0-9]{10}"
          />
        </div>

        <!-- Kelas - Siswa only -->
        <div v-if="isSiswa" class="form-row">
          <label class="form-label">Kelas</label>
          <select v-model="formData.kelas" class="form-input kelas-select">
            <option value="" disabled>Pilih kelas</option>
            <option v-for="opt in kelasOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>

        <!-- No Telepon (editable) -->
        <div class="form-row">
          <label class="form-label">No Telepon</label>
          <small class="form-hint">Format yang diterima: 08xx, +62xx, atau 62xx (8-15 digit)</small>
          <input
            type="tel"
            v-model="formData.phoneNumber"
            placeholder="Contoh: 08123456789, +62 812-3456-7890"
            class="form-input"
            required
          />
        </div>

        <!-- Ubah Password -->
        <div class="form-row">
          <button
            type="button"
            @click="handleOpenChangePassword"
            class="change-password-btn"
          >
            <span>Ubah Password</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <a href="javascript:void(0)" @click="handleViewPasswordHistory" class="password-history-link">
            Lihat Riwayat Perubahan Password
          </a>
        </div>

        <!-- Read-only fields note -->
        <p class="read-only-note">* Email, Role, dan Unit tidak dapat diubah. Hubungi Sarpras untuk informasi lebih lanjut.</p>

        <!-- Actions -->
        <div class="form-actions">
          <button
            type="submit"
            class="btn-save"
            :disabled="isSaving || !isFormDirty"
          >
            {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
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
.edit-page {
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
.edit-card {
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

/* ── FORM ROWS ── */
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
.form-label-disabled {
  color: #999;
}
.form-readonly {
  font-size: 14px;
  color: #888;
  margin: 0;
}
.form-hint {
  font-size: 12px;
  color: #bbb;
  margin: 0;
  font-style: italic;
}

/* ── READ-ONLY NOTE ── */
.read-only-note {
  font-size: 12px;
  color: #999;
  margin: 16px 0;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

/* ── EDITABLE INPUT ── */
.form-input {
  font-size: 14px;
  color: #333;
  border: none;
  outline: none;
  background: transparent;
  padding: 0;
  font-family: inherit;
  transition: color 0.2s;
}
.kelas-select {
  width: 100%;
  cursor: pointer;
  appearance: none;
}
.form-input::placeholder {
  color: #bbb;
}
.form-input:focus {
  color: #1565a8;
}
.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

/* ── UBAH PASSWORD BUTTON ── */
.change-password-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: #EEF4FF;
  border: 1.5px solid #C7DCFF;
  border-radius: 10px;
  padding: 13px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1565a8;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  font-family: inherit;
}
.change-password-btn:hover {
  background: #DDE9FF;
  border-color: #1565a8;
}

/* ── PASSWORD HISTORY LINK ── */
.password-history-link {
  font-size: 13px;
  color: #1565a8;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
  text-align: center;
}
.password-history-link:hover {
  color: #0d3f72;
  text-decoration: underline;
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

/* ── LOADING ── */
.loading-state {
  margin: auto;
  color: #666;
  font-size: 14px;
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
  .edit-page {
    padding: 24px 16px;
  }
  .edit-card {
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
