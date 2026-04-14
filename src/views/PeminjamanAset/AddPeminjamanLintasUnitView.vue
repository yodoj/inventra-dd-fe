<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePeminjamanStore } from '@/stores/peminjaman';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { ArrowLeft, ChevronDown } from 'lucide-vue-next';
import ConfirmationModal from '@/components/ConfirmationModal.vue';
import dayjs from 'dayjs';

const router = useRouter();
const peminjamanStore = usePeminjamanStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const form = ref({
  unitAsalAset: '',
  unitTujuan: authStore.user?.unit || '',
  idAset: '',
  waktuPeminjaman: '',
  waktuPengembalian: '',
  tujuanPeminjaman: '',
  qty: 1
});

const allUnits = ['KB-TK', 'SD', 'SMP', 'SMA'];
const unitsAsal = allUnits.filter(u => u !== authStore.user?.unit);


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

// Watch for unit change to fetch assets
watch(() => form.value.unitAsalAset, async (newUnit) => {
  form.value.idAset = '';
  borrowableAssets.value = [];
  if (newUnit) {
    isLoadingAssets.value = true;
    try {
      const assets = await peminjamanStore.fetchBorrowableAssets(newUnit);
      // Only Non-consumable items and rooms are borrowable
      borrowableAssets.value = assets.filter(a => a.kategoriAset !== 'BARANG_HABIS_PAKAI');
      
      if (borrowableAssets.value.length === 0) {
        toastStore.error('Warning', `Tidak ada aset tersedia untuk dipinjam di unit ${newUnit}`);
      }
    } catch (err) {
      toastStore.error('Error', 'Gagal memuat daftar aset unit tujuan');
    } finally {
      isLoadingAssets.value = false;
    }
  }
});

watch(() => form.value.qty, (newVal) => {
  if (newVal > maxQty.value) {
    form.value.qty = maxQty.value;
  }
});

const validateForm = () => {
    if (!form.value.unitAsalAset || !form.value.unitTujuan || !form.value.idAset || !form.value.waktuPeminjaman || !form.value.waktuPengembalian || !form.value.tujuanPeminjaman || !form.value.qty) {
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
    await peminjamanStore.createLoanLintasUnit(form.value);
    toastStore.success('Success', 'Pengajuan peminjaman lintas unit berhasil dibuat');
    router.push('/peminjaman');
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'Gagal membuat pengajuan lintas unit';
    toastStore.error('Error', errorMsg);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="add-peminjaman-page">
    <div class="container py-16">
      <div class="flex items-center gap-4 mb-20">
        <button @click="router.back()" class="btn-back">
          <ArrowLeft class="w-6 h-6" />
        </button>
        <h1 class="h2-headline">Buat Pengajuan Lintas Unit</h1>
      </div>

      <div class="form-card card-shadow">
        <form @submit.prevent="confirmSubmit" class="peminjaman-form">
          <div class="form-grid">
            <!-- Unit Asal Aset -->
            <div class="form-group col-span-1">
              <label class="s2-subtitle mb-2 block">Unit Asal Aset <span class="required-star">*</span></label>
              <div class="custom-select">
                <select v-model="form.unitAsalAset" class="form-input" :class="{ 'placeholder-color': !form.unitAsalAset }" required>
                  <option value="" disabled>Pilih unit asal aset</option>
                  <option v-for="u in unitsAsal" :key="u" :value="u">{{ u }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>

            <!-- Unit Tujuan -->
            <div class="form-group col-span-1">
              <label class="s2-subtitle mb-2 block">Unit Tujuan <span class="required-star">*</span></label>
              <div class="custom-select">
                <select v-model="form.unitTujuan" class="form-input" :class="{ 'placeholder-color': !form.unitTujuan }" required>
                  <option value="" disabled>Pilih unit tujuan</option>
                  <option v-for="u in allUnits" :key="u" :value="u">{{ u }}</option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>

            <div class="form-group col-span-1"></div>

            <!-- Aset Selection -->
            <div class="form-group col-span-2">
              <label class="s2-subtitle mb-2 block">Pilih Aset <span class="required-star">*</span></label>
              <div class="custom-select">
                <select v-model="form.idAset" class="form-input" :class="{ 'placeholder-color': !form.idAset }" :disabled="!form.unitAsalAset || isLoadingAssets" required>
                  <option value="" disabled>{{ !form.unitAsalAset ? 'Pilih unit asal terlebih dahulu' : 'Pilih aset yang ingin dipinjam' }}</option>
                  <option v-for="asset in borrowableAssets" :key="asset.idAset" :value="asset.idAset">
                    [{{ asset.kodeAset }}] {{ asset.namaAset }}{{ asset.merkAset ? ` - ${asset.merkAset}` : '' }} (Tersedia: {{ asset.qtyTersedia }})
                  </option>
                </select>
                <ChevronDown class="select-icon" />
              </div>
            </div>

            <!-- Kuantitas -->
            <div class="form-group">
              <label class="s2-subtitle mb-2 block">Kuantitas <span class="required-star">*</span></label>
              <input 
                v-model.number="form.qty" 
                type="number" 
                min="1" 
                :max="maxQty"
                class="form-input" 
                placeholder="0"
                required 
              />
            </div>

            <!-- Waktu Peminjaman -->
            <div class="form-group">
              <label class="s2-subtitle mb-2 block">Waktu Peminjaman <span class="required-star">*</span></label>
              <input v-model="form.waktuPeminjaman" type="datetime-local" class="form-input" required />
            </div>

            <!-- Waktu Pengembalian -->
            <div class="form-group">
              <label class="s2-subtitle mb-2 block">Waktu Pengembalian <span class="required-star">*</span></label>
              <input v-model="form.waktuPengembalian" type="datetime-local" class="form-input" required />
            </div>

            <!-- Tujuan Peminjaman -->
            <div class="form-group col-span-3">
              <label class="s2-subtitle mb-2 block">Tujuan Peminjaman <span class="required-star">*</span></label>
              <textarea 
                v-model="form.tujuanPeminjaman" 
                class="form-textarea" 
                placeholder="Jelaskan keperluan peminjaman lintas unit ini..."
                rows="4"
                required
              ></textarea>
            </div>
          </div>

          <div class="form-actions mt-24">
            <button type="button" @click="router.back()" class="btn-cancel">Batal</button>
            <button type="submit" class="btn-submit btn-secondary-theme" :disabled="isSubmitting">
              {{ isSubmitting ? 'Mengirim...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
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
</template>

<style scoped>
.add-peminjaman-page {
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
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 32px;
}

.form-group {
    margin-bottom: 0px;
}

.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }

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
  resize: vertical;
}

.form-input:focus, .form-textarea:focus, .custom-select select:focus {
  border-color: #00588F;
}

.placeholder-color {
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

.btn-submit {
  background-color: #00588F;
  color: white;
  border: none;
  padding: 14px 60px;
  border-radius: 40px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary-theme {
    background-color: #0088CC;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
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

.required-star {
  color: #DC3545;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}

.py-16 { padding-top: 2rem; padding-bottom: 2rem; }
.mb-20 { margin-bottom: 2.5rem; }

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
