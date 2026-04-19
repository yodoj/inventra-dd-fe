<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { usePeminjamanStore } from '@/stores/peminjaman';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { ChevronDown } from 'lucide-vue-next';
import ConfirmationModal from '@/components/ConfirmationModal.vue';
import SearchableSelect from '@/components/SearchableSelect.vue';
import dayjs from 'dayjs';

const router = useRouter();
const route = useRoute();
const peminjamanStore = usePeminjamanStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const loanId = route.params.id as string;

const form = ref({
  idAset: '',
  waktuPeminjaman: '',
  waktuPengembalian: '',
  tujuanPeminjaman: '',
  qty: 1,
  unitTujuan: ''
});

const borrowableAssets = ref<any[]>([]);
const isLoadingAssets = ref(false);
const isLoadingData = ref(true);
const showConfirmModal = ref(false);
const isSubmitting = ref(false);

const isAdmin = computed(() => authStore.userRole === 'ADMIN');
const loanOriginalData = ref<any>(null);

const selectedAsset = computed(() => {
  return borrowableAssets.value.find(a => a.idAset === form.value.idAset);
});

const maxQty = computed(() => {
  if (!selectedAsset.value) return 1;
  // If it's the same asset as originally selected, include the current loan's qty in max
  return selectedAsset.value.qtyTersedia || 1;
});

const assetOptions = computed(() => {
  return borrowableAssets.value.map(asset => ({
    id: asset.idAset,
    label: `${asset.kodeAset} - ${asset.namaAset}${asset.merkAset ? ` - ${asset.merkAset}` : ''} (Tersedia: ${asset.qtyTersedia})`
  }));
});

watch(() => form.value.qty, (newVal) => {
  if (newVal > maxQty.value) {
    form.value.qty = maxQty.value;
  }
});

const fetchAssets = async (unit: string) => {
  isLoadingAssets.value = true;
  try {
    const assets = await peminjamanStore.fetchBorrowableAssets(unit);
    borrowableAssets.value = assets.filter(a => a.kategoriAset !== 'BARANG_HABIS_PAKAI');
  } catch (err) {
    toastStore.error('Error', 'Gagal memuat daftar aset unit Anda');
  } finally {
    isLoadingAssets.value = false;
  }
};

onMounted(async () => {
  try {
    const loanData = await peminjamanStore.fetchLoanById(loanId);
    loanOriginalData.value = loanData;
    
    if (loanData.status_peminjaman !== 'DIAJUKAN') {
        toastStore.error('Error', 'Hanya pengajuan dengan status DIAJUKAN yang dapat diubah');
        router.push('/peminjaman');
        return;
    }

    form.value = {
      idAset: loanData.id_aset,
      waktuPeminjaman: dayjs(loanData.waktu_peminjaman).format('YYYY-MM-DDTHH:mm'),
      waktuPengembalian: dayjs(loanData.waktu_pengembalian).format('YYYY-MM-DDTHH:mm'),
      tujuanPeminjaman: loanData.tujuan_peminjaman,
      qty: loanData.qty,
      unitTujuan: loanData.unit_peminjam
    };
    
    await fetchAssets(loanData.unit_peminjam);
  } catch (err) {
    toastStore.error('Error', 'Gagal memuat data peminjaman');
    router.push('/peminjaman');
  } finally {
    isLoadingData.value = false;
  }
});

const validateForm = () => {
  if (!form.value.idAset || !form.value.waktuPeminjaman || !form.value.waktuPengembalian || !form.value.tujuanPeminjaman || !form.value.qty) {
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
    await peminjamanStore.updateLoan(loanId, form.value);
    toastStore.success('Success', 'Pengajuan peminjaman berhasil diperbarui');
    if (isAdmin.value) {
      router.push('/peminjaman/guru-siswa');
    } else {
      router.push('/peminjaman');
    }
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'Gagal memperbarui pengajuan';
    toastStore.error('Error', errorMsg);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="update-peminjaman-page">
    <div class="container py-16">
      <h1 class="h2-headline">Update Pengajuan Peminjaman Aset</h1>

      <div v-if="isLoadingData" class="flex justify-center py-20">
          <p>Memuat data...</p>
      </div>
      <div v-else class="form-card card-shadow">
        <form @submit.prevent="confirmSubmit" class="peminjaman-form">
          <div class="form-grid">
            <!-- Requester Info (Admin only) -->
            <template v-if="isAdmin && loanOriginalData">
              <div class="form-group col-span-1">
                <label class="s2-subtitle mb-2 block text-gray-400">Nama Pengaju</label>
                <div class="form-input-readonly">{{ loanOriginalData.nama_peminjam }}</div>
              </div>
              <div class="form-group col-span-1">
                <label class="s2-subtitle mb-2 block text-gray-400">Unit Pengaju</label>
                <div class="form-input-readonly">{{ loanOriginalData.unit_peminjam }}</div>
              </div>
              <div></div> <!-- Spacer -->
            </template>

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
              <input v-model="form.waktuPeminjaman" type="datetime-local" class="form-input" required />
            </div>

            <!-- Waktu Pengembalian -->
            <div class="form-group col-span-1">
              <label class="s2-subtitle mb-2 block">Waktu Pengembalian <span class="required-star">*</span></label>
              <input v-model="form.waktuPengembalian" type="datetime-local" class="form-input" required />
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
      title="Konfirmasi Perubahan"
      message="Apakah Anda yakin ingin memperbarui pengajuan peminjaman ini? Pastikan data sudah benar."
      confirm-text="Ya, Simpan"
      cancel-text="Batal"
      :is-loading="isSubmitting"
      @confirm="handleSubmit"
      @cancel="showConfirmModal = false"
    />
  </div>
</template>

<style scoped>
.update-peminjaman-page {
  background-color: #FAFAFA;
  min-height: calc(100vh - 80px);
}

.form-card {
  background: white;
  padding: 40px 60px;
  border-radius: 24px;
  max-width: 1200px;
  margin: 40px auto 0;
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
.row-span-2 { grid-row: span 2; }

.form-input-readonly {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  background: #F9FAFB;
  font-size: 14px;
  color: #6B7280;
}

.form-input {
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

.form-input:focus, .form-textarea:focus {
  border-color: #00588F;
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

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}
</style>
