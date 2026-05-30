<script setup lang="ts">
import { ref, computed, watch, onMounted, markRaw } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAssetStore } from '@/stores/asset';
import { useAuthStore } from '@/stores/auth';
import { ChevronDown, ArrowLeft } from 'lucide-vue-next';
import ConfirmationModal from '@/components/ConfirmationModal.vue';
import { useToastStore } from '@/stores/toast';
import { API_BASE_URL } from '@/services/api';

const router = useRouter();
const route = useRoute();
const assetStore = useAssetStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const id = route.params.id as string;

const form = ref({
  namaAset: '',
  merkAset: '',
  qtyAset: 1,
  qtyTersedia: 0,
  qtyRusak: 0,
  qtyPerbaikan: 0,
  qtyDimusnahkan: 0,
  qtyDipinjam: 0,
  lokasiAset: '',
  statusAset: '',
  kategoriAset: '',
  unit: '',
  gambarUrlAset: '',
  keteranganAset: ''
});

const fotoFile = ref<File | null>(null);
const previewUrl = ref('');
const fileError = ref('');
const originalGambarUrl = ref('');

const getFullImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    return API_BASE_URL + url;
  }
  return url;
};

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0] || null;

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    fileError.value = 'File harus berupa gambar';
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    fileError.value = 'Ukuran file maksimal 2MB';
    return;
  }

  fileError.value = '';
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);

  fotoFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
};

const removeFile = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  fotoFile.value = null;
  previewUrl.value = '';
};

const isSubmitting = ref(false);
const isLoading = ref(true);
const showConfirmModal = ref(false);

const categories = [
  { label: 'Barang Habis Pakai', value: 'BARANG_HABIS_PAKAI' },
  { label: 'Barang Tidak Habis Pakai', value: 'BARANG_TIDAK_HABIS_PAKAI' }
];

const allStatuses = [
  { label: 'Tersedia', value: 'TERSEDIA', categories: ['BARANG_HABIS_PAKAI', 'BARANG_TIDAK_HABIS_PAKAI'] },
  { label: 'Habis', value: 'HABIS', categories: ['BARANG_HABIS_PAKAI'] },
  { label: 'Rusak', value: 'RUSAK', categories: ['BARANG_TIDAK_HABIS_PAKAI'] },
  { label: 'Sedang Perbaikan', value: 'SEDANG_PERBAIKAN', categories: ['BARANG_TIDAK_HABIS_PAKAI'] },
  { label: 'Sedang Dipinjam', value: 'SEDANG_DIPINJAM', categories: ['BARANG_TIDAK_HABIS_PAKAI'] },
  { label: 'Dimusnahkan', value: 'DIMUSNAHKAN', categories: ['BARANG_TIDAK_HABIS_PAKAI'] }
];

const filteredStatuses = computed(() => {
  if (!form.value.kategoriAset) return [];
  return allStatuses.filter(s => s.categories.includes(form.value.kategoriAset));
});

// Reset status if it's not valid for the new category
watch(() => form.value.kategoriAset, (newCat) => {
  if (newCat) {
    const isValid = filteredStatuses.value.some(s => s.value === form.value.statusAset);
    if (!isValid) form.value.statusAset = '';
  }
});

const units = ['KB-TK', 'SD', 'SMP', 'SMA'];

const isYayasanOrAdmin = computed(() => {
  return ['YAYASAN', 'ADMIN'].includes(authStore.userRole || '');
});

onMounted(async () => {
  try {
    const data = await assetStore.fetchAssetBarangById(id);
    originalGambarUrl.value = data.gambar_url_aset || '';
    form.value = {
      namaAset: data.nama_aset,
      merkAset: data.merk_aset,
      qtyAset: data.qty_aset,
      qtyTersedia: data.qty_tersedia || 0,
      qtyRusak: data.qty_rusak || 0,
      qtyPerbaikan: data.qty_perbaikan || 0,
      qtyDimusnahkan: data.qty_dimusnahkan || 0,
      qtyDipinjam: data.qty_dipinjam || 0,
      lokasiAset: data.lokasi_aset,
      statusAset: data.status_aset,
      kategoriAset: data.kategori_aset,
      unit: data.unit,
      gambarUrlAset: data.gambar_url_aset && !data.gambar_url_aset.startsWith('/uploads/') ? data.gambar_url_aset : '',
      keteranganAset: data.keterangan_aset
    };
  } catch (error) {
    console.error('Failed to fetch asset data:', error);
    toastStore.error('Error', 'Gagal mengambil data aset');
    router.push('/assets/kelola');
  } finally {
    isLoading.value = false;
  }
});

const totalQtyDetails = computed(() => {
  return (form.value.qtyTersedia || 0) +
    (form.value.qtyRusak || 0) +
    (form.value.qtyPerbaikan || 0) +
    (form.value.qtyDimusnahkan || 0) +
    (form.value.qtyDipinjam || 0);
});

const isQtySumValid = computed(() => {
  return totalQtyDetails.value === form.value.qtyAset;
});

// Auto-calculate Physical Tersedia based on other states
watch([
  () => form.value.qtyAset,
  () => form.value.qtyRusak,
  () => form.value.qtyPerbaikan,
  () => form.value.qtyDimusnahkan,
  () => form.value.qtyDipinjam
], () => {
  // Physical Tersedia is the total stock minus unusable items
  // Note: qtyDipinjam is currently set by BE as "Active right now", but for the DB save 
  // we want to ensure the sum remains consistent with qtyAset.
  form.value.qtyTersedia = Math.max(0, form.value.qtyAset - (form.value.qtyRusak || 0) - (form.value.qtyPerbaikan || 0) - (form.value.qtyDimusnahkan || 0) - (form.value.qtyDipinjam || 0));
});

const confirmSubmit = () => {
  if (!isQtySumValid.value) {
    toastStore.error('Error', `Jumlah rincian (${totalQtyDetails.value}) harus sama dengan total kuantitas (${form.value.qtyAset})`);
    return;
  }
  showConfirmModal.value = true;
};

const handleSubmit = async () => {
  showConfirmModal.value = false;
  isSubmitting.value = true;
  try {
    const formData = new FormData();
    formData.append('namaAset', form.value.namaAset);
    formData.append('merkAset', form.value.merkAset);
    formData.append('qtyAset', form.value.qtyAset.toString());
    formData.append('qtyTersedia', form.value.qtyTersedia.toString());
    formData.append('qtyRusak', form.value.qtyRusak.toString());
    formData.append('qtyPerbaikan', form.value.qtyPerbaikan.toString());
    formData.append('qtyDimusnahkan', form.value.qtyDimusnahkan.toString());
    formData.append('qtyDipinjam', form.value.qtyDipinjam.toString());
    formData.append('lokasiAset', form.value.lokasiAset);
    formData.append('statusAset', form.value.statusAset || '');
    formData.append('kategoriAset', form.value.kategoriAset);
    formData.append('unit', form.value.unit);
    formData.append('keteranganAset', form.value.keteranganAset);

    if (fotoFile.value) {
      formData.append('gambarFile', fotoFile.value);
    } else {
      formData.append('gambarUrlAset', form.value.gambarUrlAset || originalGambarUrl.value);
    }

    await assetStore.updateAssetBarang(id, formData);
    toastStore.success('Success', 'Aset barang berhasil diperbarui');
    router.push('/assets/kelola');
  } catch (error) {
    console.error('Failed to update asset:', error);
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
        <h1 class="h2-headline">Ubah Aset Barang</h1>
      </div>

      <div v-if="isLoading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>

      <div v-else class="form-card card-shadow">
        <form @submit.prevent="confirmSubmit" class="asset-form">
          <div class="form-grid">
            <!-- Left Column (Nama, Merk, Kuantitas, Lokasi) -->
            <div class="form-column left-column">
              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Nama Aset <span class="required-star">*</span></label>
                <input v-model="form.namaAset" type="text" placeholder="Contoh: Kamera DSLR" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Merk <span class="required-star">*</span></label>
                <input v-model="form.merkAset" type="text" placeholder="Contoh: Sony" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Kuantitas <span class="required-star">*</span></label>
                <input v-model.number="form.qtyAset" type="number" placeholder="Contoh: 1" class="form-input" min="1" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Lokasi <span class="required-star">*</span></label>
                <input v-model="form.lokasiAset" type="text" placeholder="Contoh: Lab Komputer" class="form-input" required />
              </div>
            </div>

            <!-- Middle Column (Kategori, Gambar) -->
            <div class="form-column middle-column">
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

              <!-- Gambar below Kategori -->
              <div class="form-group gambar-upload-group">
                <label class="s2-subtitle mb-2 block">Gambar <span class="required-star">*</span></label>
                
                <div class="upload-options">
                  <label class="dropzone" :class="{ 'dz-disabled': isSubmitting }">
                    <input
                      class="file-hidden"
                      type="file"
                      accept="image/*"
                      :disabled="isSubmitting"
                      @change="onFileChange"
                    />

                    <div v-if="!previewUrl && !form.gambarUrlAset && !originalGambarUrl" class="dz-empty">
                      <div class="dz-icon">+</div>
                      <div class="dz-title">Upload Foto</div>
                      <div class="dz-sub">Klik untuk pilih file</div>
                    </div>

                    <div v-else class="dz-filled">
                      <img class="dz-img" :src="previewUrl || getFullImageUrl(form.gambarUrlAset || originalGambarUrl)" alt="Preview" />
                      <div class="dz-bar">
                        <div class="dz-name">{{ fotoFile ? fotoFile.name : (originalGambarUrl ? 'Gambar saat ini' : 'Gambar saat ini') }}</div>
                        <button
                          v-if="fotoFile"
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
                    <input v-model="form.gambarUrlAset" type="url" placeholder="https://contoh.com/gambar.jpg" class="form-input" :disabled="!!fotoFile" />
                  </div>
                </div>
                <p v-if="fileError" class="text-xs text-red-500 mt-1">{{ fileError }}</p>
              </div>
            </div>

            <!-- Right Column (Unit, Rincian Ketersediaan) -->
            <div class="form-column right-column">
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

              <div v-if="form.kategoriAset === 'BARANG_TIDAK_HABIS_PAKAI'" class="form-group">
                <label class="s2-subtitle mb-10 block">Rincian Ketersediaan <span class="required-star">*</span></label>
                
                <div class="grid grid-cols-2 gap-x-4 gap-y-5">
                  <div class="form-group-sub">
                    <label class="c2-caption mb-2 block">Tersedia</label>
                    <input v-model.number="form.qtyTersedia" type="number" class="form-input-small bg-gray-50 cursor-not-allowed" disabled title="Dihitung otomatis dari Total - (Rusak/Perbaikan/Dipinjam)" />
                  </div>
                  <div class="form-group-sub">
                    <label class="c2-caption mb-2 block">Sedang Dipinjam</label>
                    <input v-model.number="form.qtyDipinjam" type="number" class="form-input-small bg-gray-50 cursor-not-allowed" disabled title="Jumlah yang sedang aktif dipinjam saat ini" />
                  </div>
                  <div class="form-group-sub">
                    <label class="c2-caption mb-2 block">Rusak</label>
                    <input v-model.number="form.qtyRusak" type="number" class="form-input-small" min="0" />
                  </div>
                  <div class="form-group-sub">
                    <label class="c2-caption mb-2 block">Perbaikan</label>
                    <input v-model.number="form.qtyPerbaikan" type="number" class="form-input-small" min="0" />
                  </div>
                  <div class="form-group-sub">
                    <label class="c2-caption mb-2 block">Dimusnahkan</label>
                    <input v-model.number="form.qtyDimusnahkan" type="number" class="form-input-small" min="0" />
                  </div>
                </div>
                <p class="text-[11px] mt-3 text-gray-500">
                  * Kolom Tersedia & Dipinjam dikelola otomatis oleh sistem reservasi.
                </p>
                <p class="text-[11px] mt-1" :class="isQtySumValid ? 'text-gray-500' : 'text-red-500 font-medium'">
                  * {{ isQtySumValid ? 'Total rincian sesuai dengan kuantitas' : 'Total rincian tidak sesuai dengan kuantitas' }}
                </p>
              </div>
              <div v-else-if="form.kategoriAset === 'BARANG_HABIS_PAKAI'" class="form-group">
                <label class="s2-subtitle mb-2 block">Tersedia <span class="required-star">*</span></label>
                <input v-model.number="form.qtyTersedia" type="number" class="form-input" min="0" required />
              </div>
            </div>

            <!-- Full Width Row for Keterangan (Spans columns 1 and 2) -->
            <div class="form-column keterangan-column">
              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Keterangan</label>
                <textarea v-model="form.keteranganAset" placeholder="Masukkan keterangan" class="form-textarea" rows="4"></textarea>
              </div>
            </div>
          </div>

          <div class="form-actions mt-40">
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
    title="Konfirmasi Ubah Aset"
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
  max-width: 1300px;
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

.form-input-small {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
}

.form-group-sub {
  margin-bottom: 0px;
}

.form-group-sub label {
  margin-bottom: 8px !important;
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

.form-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  margin-bottom: 0px;
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

.mt-40 {
  margin-top: 40px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

.left-column {
  grid-column: 1;
  grid-row: 1;
}

.middle-column {
  grid-column: 2;
  grid-row: 1;
}

.right-column {
  grid-column: 3;
  grid-row: 1 / span 2;
}

.keterangan-column {
  grid-column: 1 / span 2;
  grid-row: 2;
}

.keterangan-column .form-textarea {
  min-height: 160px;
}
</style>
