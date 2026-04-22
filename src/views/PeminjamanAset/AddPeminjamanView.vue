<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePeminjamanStore } from '@/stores/peminjaman';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { ArrowLeft, ChevronDown } from 'lucide-vue-next';
import ConfirmationModal from '@/components/ConfirmationModal.vue';
import SearchableSelect from '@/components/SearchableSelect.vue';
import dayjs from 'dayjs';

const router = useRouter();
const peminjamanStore = usePeminjamanStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const form = ref({
  idAset: '',
  waktuPeminjaman: '',
  waktuPengembalian: '',
  tujuanPeminjaman: '',
  qty: 1,
  unitTujuan: authStore.user?.unit || ''
});

const isSarprasOrAdmin = computed(() => {
  return ['SARPRAS', 'ADMIN', 'SUPERADMIN'].includes(authStore.userRole || '');
});

const units = ['KB-TK', 'SD', 'SMP', 'SMA'];

const borrowableAssets = ref<any[]>([]);
const isLoadingAssets = ref(false);
const showConfirmModal = ref(false);
const isSubmitting = ref(false);

const selectedAsset = computed(() => {
  return borrowableAssets.value.find(a => a.idAset === form.value.idAset);
});

const maxQty = computed(() => {
  if (!selectedAsset.value) return 1;
  return selectedAsset.value.qtyTersedia || 1;
});

const assetOptions = computed(() => {
  return borrowableAssets.value.map(asset => ({
    id: asset.idAset,
    label: `${asset.kodeAset} - ${asset.namaAset}${asset.merkAset ? ` - ${asset.merkAset}` : ''} (Tersedia: ${asset.qtyTersedia})`
  }));
});

// Ensure qty doesn't exceed stock
watch(() => form.value.qty, (newVal) => {
  if (newVal > maxQty.value) {
    form.value.qty = maxQty.value;
  }
});

const fetchAssets = async (unit: string) => {
  isLoadingAssets.value = true;
  try {
    const assets = await peminjamanStore.fetchBorrowableAssets(unit);
    // Only Non-consumable items and rooms are borrowable
    borrowableAssets.value = assets.filter(a => a.kategoriAset !== 'BARANG_HABIS_PAKAI');
  } catch (err) {
    toastStore.error('Error', 'Gagal memuat daftar aset unit Anda');
  } finally {
    isLoadingAssets.value = false;
  }
};

// Handle initial load and refreshes
watch(() => authStore.user?.unit, (newUnit) => {
  if (newUnit) {
    fetchAssets(newUnit);
    if (!form.value.unitTujuan) {
      form.value.unitTujuan = newUnit;
    }
  }
}, { immediate: true });

const validateForm = () => {
  if (!form.value.idAset || !form.value.waktuPeminjaman || !form.value.waktuPengembalian || !form.value.tujuanPeminjaman || !form.value.qty || (isSarprasOrAdmin.value && !form.value.unitTujuan)) {
    toastStore.error('Error', 'Semua field wajib diisi');
    return false;
  }

  const start = dayjs(form.value.waktuPeminjaman);
  const end = dayjs(form.value.waktuPengembalian);

  if (end.isBefore(start) || end.isSame(start)) {
    toastStore.error('Error', 'Waktu pengembalian harus setelah waktu peminjaman');
    return false;
  }

  return true;
};

const confirmSubmit = () => {
  if (validateForm()) {
    showConfirmModal.value = true;
  }
};

const handleSubmit = async () => {
  showConfirmModal.value = false;
  isSubmitting.value = true;
  try {
    await peminjamanStore.createLoan(form.value);
    toastStore.success('Success', 'Pengajuan peminjaman berhasil dibuat');
    router.push('/peminjaman');
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'Gagal membuat pengajuan';
    toastStore.error('Error', errorMsg);
  } finally {
    isSubmitting.value = false;
  }
};
onMounted(() => {
  if (authStore.userRole === 'ADMIN') {
    toastStore.error('Unauthorized', 'Admin hanya dapat melakukan pengajuan lintas unit');
    router.push('/peminjaman');
  }
});
</script>

<template>
  <div class="add-peminjaman-page">
    <div class="container py-16">
      <h1 class="h2-headline">Buat Pengajuan Peminjaman Aset</h1>

      <div class="form-card card-shadow">
        <form @submit.prevent="confirmSubmit" class="peminjaman-form">
          <div class="form-grid">
            <!-- Nama Aset -->
            <div class="form-group col-span-1">
              <label class="s2-subtitle mb-2 block">Nama Aset <span class="required-star">*</span></label>
              <SearchableSelect 
                v-model="form.idAset"
                :options="assetOptions"
                placeholder="Kode - Nama Aset - Merk"
                :loading="isLoadingAssets"
              />
            </div>

            <!-- Kuantitas -->
            <div class="form-group col-span-1">
              <label class="s2-subtitle mb-2 block">Kuantitas <span class="required-star">*</span></label>
              <input 
                v-model.number="form.qty" 
                type="number" 
                min="1" 
                :max="maxQty"
                class="form-input" 
                placeholder="Contoh: 1"
                required 
              />
            </div>

            <!-- Tujuan Peminjaman (Full height) -->
            <div class="form-group col-span-1 row-span-2">
              <label class="s2-subtitle mb-2 block">Tujuan Peminjaman <span class="required-star">*</span></label>
              <textarea 
                v-model="form.tujuanPeminjaman" 
                class="form-textarea full-height" 
                placeholder="Jelaskan tujuan peminjaman"
                required
              ></textarea>
            </div>

            <!-- Waktu Peminjaman -->
            <div class="form-group col-span-1">
              <label class="s2-subtitle mb-2 block">Waktu Peminjaman <span class="required-star">*</span></label>
              <input v-model="form.waktuPeminjaman" type="datetime-local" class="form-input" placeholder="DD/MM/YY HH:mm" required />
            </div>

            <!-- Waktu Pengembalian -->
            <div class="form-group col-span-1">
              <label class="s2-subtitle mb-2 block">Waktu Pengembalian <span class="required-star">*</span></label>
              <input v-model="form.waktuPengembalian" type="datetime-local" class="form-input" placeholder="DD/MM/YYYY HH:mm" required />
            </div>
          </div>

          <div class="form-actions mt-100">
            <button type="button" @click="router.back()" class="btn-cancel">Batalkan</button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmationModal
      :show="showConfirmModal"
      title="Konfirmasi Pengajuan"
      message="Apakah Anda yakin ingin mengajukan peminjaman aset ini? Pastikan data sudah benar."
      confirm-text="Ya, Simpan"
      cancel-text="Batal"
      :is-loading="isSubmitting"
      @confirm="handleSubmit"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<style scoped>
.add-peminjaman-page {
  background-color: #FAFAFA;
  min-height: calc(100vh - 80px);
}

.form-card {
  background: white;
  padding: 80px;
  border-radius: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 60px 80px;
}

.form-grid > * {
  min-width: 0;
}

.form-group {
    margin-bottom: 0px;
}

.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.row-span-2 { grid-row: span 2; }

/* ... existing logic styles ... */
.form-input, .custom-select select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  outline: none;
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  resize: none;
}

.full-height {
  height: 100%;
  min-height: 120px;
}

.form-input:focus, .form-textarea:focus, .custom-select select:focus {
  border-color: #00588F;
}

.placeholder-color,
.form-input::placeholder,
.form-textarea::placeholder {
  color: #9CA3AF;
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

.mt-100 {
  margin-top: 100px;
}

.btn-submit {
  background-color: #00588F;
  color: white;
  border: none;
  padding: 14px 60px;
  border-radius: 40px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 200px;
}

.btn-submit:hover:not(:disabled) {
  background-color: #004470;
}

.btn-cancel {
  background-color: #F3F4F6;
  color: #4B5563;
  border: 1px solid #E5E7EB;
  padding: 14px 60px;
  border-radius: 40px;
  font-weight: 700;
  cursor: pointer;
  min-width: 200px;
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

.required-star {
  color: #DC3545;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.py-16 { padding-top: 2rem; padding-bottom: 2rem; }
.mb-20 { margin-bottom: 60px; }

/* Removing default arrow from number input */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}

select {
  background-image: none;
}
</style>
