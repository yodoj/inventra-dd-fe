<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { usePengadaanStore } from '@/stores/pengadaanAset';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { ChevronDown, ArrowLeft } from 'lucide-vue-next';
import ConfirmationModal from '@/components/ConfirmationModal.vue';

const router = useRouter();
const route = useRoute();
const pengadaanStore = usePengadaanStore();
const authStore = useAuthStore();
const toastStore = useToastStore();
const isAuthorized = computed(() => {
  return ['ADMIN', 'SARPRAS', 'GURU'].includes(authStore.userRole || '');
});

const id_pengadaan = route.params.idPengadaan as string;

const form = ref({
  namaAset: '',
  merk: '',
  qty: 1,
  estimasiHarga: 0,
  waktuPengadaan: '',
  kategoriAset: '',
  unit: '',
  linkGambar: ''
});

const isSubmitting = ref(false);
const isLoadingData = ref(true);
const showConfirmModal = ref(false);

const categories = [
  { label: 'Barang Habis Pakai', value: 'BARANG_HABIS_PAKAI' },
  { label: 'Barang Tidak Habis Pakai', value: 'BARANG_TIDAK_HABIS_PAKAI' }
];

const units = ['KB-TK', 'SD', 'SMP', 'SMA'];
const isSuperadmin = computed(() => authStore.userRole === 'ADMIN');

onMounted(async () => {
  try {
    const data = await pengadaanStore.fetchPengadaanById(id_pengadaan);
    
    // Validasi status pengajuan
    if (data.status_pengadaan !== 'DIAJUKAN' && data.status_pengadaan !== 'DITOLAK') {
      toastStore.error('Akses Ditolak', 'Hanya pengajuan berstatus DIAJUKAN atau DITOLAK yang bisa diubah');
      router.push('/pengadaan/pengajuan');
      return;
    }

    // Prefill form
    form.value = {
      namaAset: data.nama_aset,
      merk: data.merk,
      qty: data.qty,
      estimasiHarga: data.estimasi_harga,
      waktuPengadaan: data.tanggal_pengadaan,
      kategoriAset: data.kategori,
      unit: data.unit,
      linkGambar: data.link_gambar
    };
  } catch (error) {
    toastStore.error('Error', 'Gagal mengambil data pengajuan');
    router.push('/pengadaan/pengajuan');
  } finally {
    isLoadingData.value = false;
  }
});

const confirmSubmit = () => {
  if (form.value.qty <= 0 || form.value.estimasiHarga <= 0) {
    toastStore.error('Error', 'Kuantitas dan Estimasi Harga harus lebih dari 0');
    return;
  }
  const today = new Date().toISOString().split('T')[0] ?? ''; 
  
  if (form.value.waktuPengadaan <= today) {
    toastStore.error('Error', 'Tanggal pengadaan tidak boleh hari ini atau lampau');
    return;
  }
  showConfirmModal.value = true;
};

const handleSubmit = async () => {
  showConfirmModal.value = false;
  isSubmitting.value = true;
  try {
    await pengadaanStore.updatePengadaan(id_pengadaan, form.value);
    toastStore.success('Success', 'Pengajuan pengadaan berhasil diupdate');
    router.push('/pengadaan/pengajuan');
  } catch (error: any) {
    toastStore.error('Gagal', error || 'Gagal mengupdate pengajuan');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div v-if="isAuthorized" class="update-pengadaan-page">
    <div class="container py-16">
      <div class="flex items-center gap-4 mb-20">
        <button @click="router.back()" class="btn-back">
          <ArrowLeft class="w-6 h-6" />
        </button>
        <h1 class="h2-headline">Update Pengajuan Pengadaan Aset</h1>
      </div>

      <div class="form-card card-shadow">
        <form @submit.prevent="confirmSubmit" class="pengadaan-form">
          <div class="form-grid">
            <div class="form-column">
              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Nama Aset <span class="required-star">*</span></label>
                <input v-model="form.namaAset" type="text" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Merk <span class="required-star">*</span></label>
                <input v-model="form.merk" type="text" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Kuantitas <span class="required-star">*</span></label>
                <input v-model.number="form.qty" type="number" class="form-input" min="1" required />
              </div>
            </div>

            <div class="form-column">
              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Estimasi Harga (Rp) <span class="required-star">*</span></label>
                <input v-model.number="form.estimasiHarga" type="number" class="form-input" min="1" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Waktu Pengadaan <span class="required-star">*</span></label>
                <input v-model="form.waktuPengadaan" type="date" class="form-input" required />
              </div>

              <div class="form-group">
                <label class="s2-subtitle mb-2 block">Kategori <span class="required-star">*</span></label>
                <div class="custom-select">
                  <select v-model="form.kategoriAset" class="form-input" required>
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
                  <select v-model="form.unit" class="form-input" required>
                    <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
                  </select>
                  <ChevronDown class="select-icon" />
                </div>
              </div>

              <div class="form-group-full mt-6">
                <label class="s2-subtitle mb-2 block">Link Gambar <span class="required-star">*</span></label>
                <input v-model="form.linkGambar" type="url" class="form-input full-width" required />
              </div>
            </div>
          </div>

          <div class="form-actions mt-12">
            <button type="button" @click="router.back()" class="btn-cancel">Batalkan</button>
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
    title="Konfirmasi Perubahan"
    message="Apakah Anda yakin ingin memperbarui data pengajuan pengadaan ini?"
    confirm-text="Ya, Simpan"
    cancel-text="Batal"
    :is-loading="isSubmitting"
    @confirm="handleSubmit"
    @cancel="showConfirmModal = false"
  />
</template>

<style scoped>
.update-pengadaan-page {
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
}

.bg-gray-50 {
  background-color: #F9FAFB;
}

.cursor-not-allowed {
  cursor: not-allowed;
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
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.py-16 { padding-top: 32px; padding-bottom: 32px; }
.mb-20 { margin-bottom: 40px; }
.mt-12 { margin-top: 48px; }
.required-star { color: #DC3545; }

@media (max-width: 1024px) { .form-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } }
</style>