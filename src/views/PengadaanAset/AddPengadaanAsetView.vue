<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronDown, ArrowLeft } from 'lucide-vue-next';

// Store import
import { usePengadaanStore } from '@/stores/pengadaanAset';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

// Component Import
import ConfirmationModal from '@/components/ConfirmationModal.vue';

const router = useRouter();
const pengadaanStore = usePengadaanStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const form = ref({
  namaAset: '',
  merk: '',
  qty: 1,
  estimasiHarga: null,
  waktuPengadaan: '',
  kategoriAset: '',
  unit: authStore.userRole === 'ADMIN' ? '' : (authStore.user?.unit || ''),
  linkGambar: ''
});

const fotoFile = ref<File | null>(null);
const previewUrl = ref('');
const fileError = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0] || null;

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    fileError.value = 'File harus berupa gambar';
    if (fileInput.value) fileInput.value.value = '';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    fileError.value = 'Ukuran file maksimal 2MB';
    if (fileInput.value) fileInput.value.value = '';
    return;
  }

  fileError.value = '';
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);

  fotoFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
  form.value.linkGambar = '';
};

const removeFile = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  fotoFile.value = null;
  previewUrl.value = '';
  if (fileInput.value) fileInput.value.value = '';
};


// Mengecek apakah role user diperbolehkan membuat pengadaan
const isAuthorized = computed(() => {
  return ['ADMIN', 'SARPRAS', 'GURU'].includes(authStore.userRole || '');
});
const isSubmitting = ref(false);
const showConfirmModal = ref(false);
const isSuperadmin = computed(() => authStore.userRole === 'ADMIN');

const categories = [
  { label: 'Barang Habis Pakai', value: 'BARANG_HABIS_PAKAI' },
  { label: 'Barang Tidak Habis Pakai', value: 'BARANG_TIDAK_HABIS_PAKAI' }
];

const units = ['KB-TK', 'SD', 'SMP', 'SMA'];

watch(() => authStore.user, (newUser) => {
  if (newUser?.unit && !form.value.unit && authStore.userRole !== 'ADMIN') {
    form.value.unit = newUser.unit;
  }
}, { immediate: true });

// Validasi sebelum menampilkan modal konfirmasi
const confirmSubmit = () => {
  if (form.value.qty <= 0 || (form.value.estimasiHarga && form.value.estimasiHarga <= 0)) {
    toastStore.error('Error', 'Kuantitas dan Estimasi Harga harus lebih dari 0');
    return;
  }

// Validasi tanggal pengadaan tidak boleh hari ini atau lampau
const today = new Date().toISOString().split('T')[0] ?? ''; 
  if (form.value.waktuPengadaan <= today) {
    toastStore.error('Error', 'Tanggal pengadaan tidak boleh hari ini atau lampau');
    return;
  }

  if (form.value.linkGambar && fotoFile.value) {
    toastStore.error('Error', 'Pilih salah satu metode upload: gunakan link URL atau upload file, jangan keduanya');
    return;
  }

  if (!form.value.linkGambar && !fotoFile.value) {
    toastStore.error('Error', 'Gambar aset wajib diisi, pilih URL atau upload file');
    return;
  }

  if (fileError.value) {
    toastStore.error('Error', fileError.value);
    return;
  }
  
  showConfirmModal.value = true;
};

// Fungsi untuk mengirim data ke backend setelah konfirmasi
const handleSubmit = async () => {
  showConfirmModal.value = false;
  isSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append('namaAset', form.value.namaAset);
    formData.append('merk', form.value.merk);
    formData.append('qty', form.value.qty.toString());
    if (form.value.estimasiHarga) formData.append('estimasiHarga', form.value.estimasiHarga.toString());
    formData.append('waktuPengadaan', form.value.waktuPengadaan);
    formData.append('kategoriAset', form.value.kategoriAset);
    formData.append('unit', form.value.unit);
    
    if (fotoFile.value) {
      formData.append('gambarFile', fotoFile.value);
    } else {
      formData.append('linkGambar', form.value.linkGambar);
    }

    await pengadaanStore.createPengadaan(formData);
    toastStore.success('Success', 'Pengajuan pengadaan berhasil diajukan');
    router.push('/pengadaan/pengajuan');
  } catch (error: any) {
    toastStore.error('Gagal', error || 'Gagal mengirim pengajuan');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div v-if="isAuthorized" class="add-pengadaan-page">
    <div class="container py-16">
      <div class="flex items-center gap-4 mb-20">
        <button @click="router.back()" class="btn-back">
          <ArrowLeft class="w-6 h-6" />
        </button>
        <h1 class="h2-headline">Buat Pengajuan Pengadaan Aset</h1>
      </div>

      <div class="form-card card-shadow">
        <form @submit.prevent="confirmSubmit" class="pengadaan-form">
          <div class="form-grid">
            <div class="form-column">
              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Nama Aset <span class="required-star">*</span></label>
                <input v-model="form.namaAset" type="text" placeholder="Contoh: Proyektor Kelas" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Merk <span class="required-star">*</span></label>
                <input v-model="form.merk" type="text" placeholder="Contoh: Epson" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Kuantitas (Per Item)<span class="required-star">*</span></label>
                <input v-model.number="form.qty" type="number" placeholder="Contoh: 1" class="form-input" min="1" required />
              </div>
            </div>

            <div class="form-column">
              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Estimasi Harga (Rp) <span class="required-star">*</span></label>
                <input v-model.number="form.estimasiHarga" type="number" placeholder="Contoh: 5000000" class="form-input" min="1" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Waktu Pengadaan <span class="required-star">*</span></label>
                <input v-model="form.waktuPengadaan" type="date" class="form-input" :class="{ 'placeholder-color': !form.waktuPengadaan }" required />
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
            </div>

            <div class="form-column">
              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Unit <span class="required-star">*</span></label>
                <div v-if="!isSuperadmin">
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

              <div class="form-group gambar-upload-group mt-6">
                <label class="s2-subtitle mb-2 block">Gambar <span class="required-star">*</span></label>
                
                <div class="upload-options">
                  <label class="dropzone" :class="{ 'dz-disabled': isSubmitting }">
                    <input
                      ref="fileInput"
                      class="file-hidden"
                      type="file"
                      accept="image/*"
                      :disabled="isSubmitting"
                      @change="onFileChange"
                    />

                    <div v-if="!previewUrl" class="dz-empty">
                      <div class="dz-icon">+</div>
                      <div class="dz-title">Upload Foto</div>
                      <div class="dz-sub">Klik untuk pilih file</div>
                    </div>

                    <div v-else class="dz-filled">
                      <img class="dz-img" :src="previewUrl" alt="Preview" />
                      <div class="dz-bar">
                        <div class="dz-name">{{ fotoFile?.name }}</div>
                        <button
                          type="button"
                          class="dz-remove"
                          @click.prevent="removeFile"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </label>

                  <div class="url-option mt-4">
                    <p class="c2-caption mb-3 text-gray-500">Atau masukkan link URL:</p>
                    <input v-model="form.linkGambar" type="text" placeholder="https://contoh.com/gambar.jpg" class="form-input full-width" :disabled="!!fotoFile" autocomplete="off" />
                  </div>
                </div>
                <p v-if="fileError" class="text-xs text-red-500 mt-1">{{ fileError }}</p>
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

  <div v-else class="forbidden-simple-wrapper">
    <p class="forbidden-text">Anda tidak memiliki izin untuk mengakses halaman ini</p>
  </div>

  <ConfirmationModal
    :show="showConfirmModal"
    title="Konfirmasi Pengajuan"
    message="Apakah Anda yakin ingin mengajukan pengadaan aset ini?"
    confirm-text="Ya, Simpan"
    cancel-text="Batal"
    :is-loading="isSubmitting"
    @confirm="handleSubmit"
    @cancel="showConfirmModal = false"
  />
</template>

<style scoped>
.add-pengadaan-page {
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
  grid-template-columns: 1fr 1fr 1fr;
  gap: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-input, .custom-select select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  outline: none;
  appearance: none; 
  -webkit-appearance: none;
  -moz-appearance: none;
}

.form-input:focus {
  border-color: #00588F;
}

.form-input::placeholder {
  color: #9CA3AF !important;
}

.placeholder-color {
  color: #9CA3AF !important;
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

.forbidden-simple-wrapper {
  padding-top: 150px; 
  text-align: center;
  width: 100%;
  min-height: 100vh;
  background-color: #FAFAFA; 
}

.forbidden-text {
  font-size: 16px;
  font-weight: 500;
  color: #000000; 
}

.py-16 {
  padding-top: 32px;
  padding-bottom: 32px;
}

.mb-20 {
  margin-bottom: 40px;
}

.mt-12 {
  margin-top: 48px;
}

.required-star {
  color: #DC3545;
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

/* Upload Styles */
.file-hidden {
  display: none;
}

.dropzone {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 160px;
  padding: 20px;
  border: 2px dashed #D1D5DB;
  border-radius: 12px;
  background: #F9FAFB;
  cursor: pointer;
  transition: all 0.2s;
}

.dropzone:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
}

.dz-empty {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
}

.dz-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #E5E7EB;
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 700;
  color: #00588F;
  background: white;
}

.dz-title {
  font-size: 14px;
  font-weight: 700;
  color: #1F2937;
}

.dz-sub {
  font-size: 11px;
  color: #6B7280;
}

.dz-img {
  width: 100%;
  max-height: 100px;
  object-fit: contain;
  border-radius: 8px;
}

.dz-bar {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.dz-name {
  font-size: 12px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dz-remove {
  border: none;
  background: #FEE2E2;
  color: #DC2626;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.mt-4 {
  margin-top: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}
</style>