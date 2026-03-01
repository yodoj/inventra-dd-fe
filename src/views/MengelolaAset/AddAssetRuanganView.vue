<script setup lang="ts">
import { ref, computed, onMounted, watch, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { useAssetStore } from '@/stores/asset';
import { useAuthStore } from '@/stores/auth';
import { ChevronDown, ArrowLeft } from 'lucide-vue-next';
import ConfirmationModal from '@/components/ConfirmationModal.vue';
import { useToastStore } from '@/stores/toast';

const router = useRouter();
const assetStore = useAssetStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const form = ref({
  namaAset: '',
  statusAset: '',
  kategoriAset: '',
  unit: authStore.user?.unit || '',
  gambarUrlAset: '',
  keteranganAset: ''
});

// Watch for user changes to ensure unit is set if auth loads late
watch(() => authStore.user, (newUser) => {
  if (newUser?.unit && !form.value.unit) {
    form.value.unit = newUser.unit;
  }
}, { immediate: true });

// Initialized in ref and watch above

const isSubmitting = ref(false);
const showConfirmModal = ref(false);

const categories = [
  { label: 'Ruang Kelas', value: 'RUANG_KELAS' },
  { label: 'Ruang Non Kelas', value: 'RUANG_NON_KELAS' }
];

const statuses = [
  { label: 'Tersedia', value: 'TERSEDIA' },
  { label: 'Sedang Perbaikan', value: 'SEDANG_PERBAIKAN' },
  { label: 'Sedang Dipinjam', value: 'SEDANG_DIPINJAM' }
];

const units = ['SD', 'SMP', 'SMA', 'KB-TK', 'superadmin', 'yayasan'];



const isYayasanOrAdmin = computed(() => {
  return ['YAYASAN', 'ADMIN'].includes(authStore.userRole || '');
});

const confirmSubmit = () => {
  showConfirmModal.value = true;
};

const handleSubmit = async () => {
  showConfirmModal.value = false;
  isSubmitting.value = true;
  try {
    await assetStore.createAssetRuangan(form.value);
    toastStore.success('Success', 'Aset ruangan berhasil ditambahkan');
    router.push('/assets/kelola');
  } catch (error) {
    console.error('Failed to create asset:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="add-asset-page">
    <div class="container py-16">
      <div class="flex items-center gap-4 mb-20">
        <button @click="router.back()" class="btn-back">
          <ArrowLeft class="w-6 h-6" />
        </button>
        <h1 class="h2-headline">Tambah Aset Ruangan</h1>
      </div>

      <div class="form-card card-shadow">
        <form @submit.prevent="confirmSubmit" class="asset-form">
          <div class="form-grid">
            <!-- Left Column -->
            <div class="form-column">
              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Nama Aset <span class="required-star">*</span></label>
                <input v-model="form.namaAset" type="text" placeholder="Contoh: Lab Komputer" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Kategori <span class="required-star">*</span></label>
                <div class="custom-select">
                  <select v-model="form.kategoriAset" class="form-input" :class="{ 'placeholder-color': !form.kategoriAset }" required>
                    <option value="" disabled>Pilih Kategori</option>
                    <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
                  </select>
                  <ChevronDown class="select-icon" />
                </div>
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Unit <span class="required-star">*</span></label>
                <div v-if="!isYayasanOrAdmin">
                  <input :value="form.unit" type="text" class="form-input bg-gray-50 cursor-not-allowed" disabled />
                </div>
                <div v-else class="custom-select">
                  <select v-model="form.unit" class="form-input" :class="{ 'placeholder-color': !form.unit }" required>
                    <option value="" disabled>Pilih Unit</option>
                    <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
                  </select>
                  <ChevronDown class="select-icon" />
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="form-column">
              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Status <span class="required-star">*</span></label>
                <div class="custom-select" :class="{ 'opacity-50 pointer-events-none': !form.kategoriAset }">
                  <select v-model="form.statusAset" class="form-input" :class="{ 'placeholder-color': !form.statusAset }" :disabled="!form.kategoriAset" required>
                    <option value="" disabled>{{ form.kategoriAset ? 'Pilih Status' : 'Pilih kategori terlebih dahulu' }}</option>
                    <option v-for="st in statuses" :key="st.value" :value="st.value">{{ st.label }}</option>
                  </select>
                  <ChevronDown class="select-icon" />
                </div>
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Link Gambar <span class="required-star">*</span></label>
                <input v-model="form.gambarUrlAset" type="url" placeholder="Masukkan URL gambar" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Keterangan</label>
                <textarea v-model="form.keteranganAset" placeholder="Masukkan keterangan" class="form-textarea" rows="4"></textarea>
              </div>
            </div>
          </div>

          <div class="form-actions mt-12">
            <button type="button" @click="router.back()" class="btn-cancel">Batal</button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <ConfirmationModal
    :show="showConfirmModal"
    title="Konfirmasi Tambah Aset"
    message="Apakah Anda yakin data yang dimasukkan sudah benar?"
    confirm-text="Ya, Simpan"
    cancel-text="Batal"
    :is-loading="isSubmitting"
    @confirm="handleSubmit"
    @cancel="showConfirmModal = false"
  />
</template>

<style scoped>
.add-asset-page {
  background-color: #FAFAFA;
  min-height: calc(100vh - 80px);
}

.form-card {
  background: white;
  padding: 40px;
  border-radius: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-input, .custom-select select {
  width: 100%;
  padding: 12px 16px;
  padding-right: 40px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: none !important;
}

.custom-select select::-ms-expand {
  display: none;
}

.form-input:focus, .custom-select select:focus, .form-textarea:focus {
  border-color: #00588F;
}

.form-input::placeholder, .form-textarea::placeholder {
  color: #9CA3AF;
}

.placeholder-color {
  color: #9CA3AF !important;
}

select option {
  color: #374151;
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 120px;
}

.custom-select {
  position: relative;
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  pointer-events: none;
  color: #6B7280;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.btn-submit {
  background-color: #00588F;
  color: white;
  border: none;
  padding: 14px 60px;
  border-radius: 40px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-submit:hover {
  background-color: #004470;
}

.btn-cancel {
  background-color: #F3F4F6;
  color: #4B5563;
  border: none;
  padding: 14px 60px;
  border-radius: 40px;
  font-weight: 700;
  cursor: pointer;
}

.btn-back {
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
}

.card-shadow {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.py-16 {
  padding-top: 32px;
  padding-bottom: 32px;
}

.mb-16 {
  margin-bottom: 32px;
}

.mb-20 {
  margin-bottom: 40px;
}

@media (max-width: 1024px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
.required-star {
  color: var(--error);
}
</style>
