<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChevronDown } from 'lucide-vue-next';

// Store
import { useTinjauPeminjamanStore } from '@/stores/tinjauPeminjaman';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

// Component
import ConfirmationModal from '@/components/ConfirmationModal.vue';

const route = useRoute();
const router = useRouter();
const store = useTinjauPeminjamanStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const idPeminjaman = computed(() => route.params.idPeminjaman as string);
const ddOpen = ref(false);
const showConfirmModal = ref(false);
const errorMessage = ref("");

const form = reactive({
  statusPeminjaman: '',
  alasan: ''
});

const STATUS_LABEL: Record<string, string> = {
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};

const formattedAset = computed(() => {
  if (!store.current) return '-';
  const { kode_aset, nama_aset, merk_aset } = store.current;
  return merk_aset ? `${kode_aset} - ${nama_aset} - ${merk_aset}` : `${kode_aset} - ${nama_aset}`;
});

const formattedPeminjam = computed(() => {
  if (!store.current) return '-';
  const { nama_peminjam, role_peminjam, unit_asal } = store.current;
  if (role_peminjam === 'ADMIN') {
    return `${nama_peminjam} (${role_peminjam})`;
  }
  return `${nama_peminjam} (${role_peminjam} ${unit_asal})`;
});

watch(() => form.statusPeminjaman, (val) => { if (val) errorMessage.value = ""; });
watch(() => form.alasan, (val) => { if (val) errorMessage.value = ""; });

function selectStatus(status: string) {
  form.statusPeminjaman = status;
  ddOpen.value = false;
}

const triggerConfirm = () => {
  errorMessage.value = "";
  if (!form.statusPeminjaman) {
    errorMessage.value = "Status wajib diisi";
    return;
  }
  if (!form.alasan) {
    errorMessage.value = "Alasan wajib diisi";
    return;
  }
  showConfirmModal.value = true;
};

const handleSave = async () => {
  showConfirmModal.value = false;
  try {
    await store.createTinjauan(idPeminjaman.value, {
      statusPeminjaman: form.statusPeminjaman,
      alasan: form.alasan
    });
    toastStore.success('Success', 'Peninjauan peminjaman aset berhasil tersimpan');
    router.push('/peminjaman'); 
  } catch (error: any) {
    toastStore.error('Error', error || 'Gagal menyimpan peninjauan');
  }
};

const formatDate = (date: string | null | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const onDocClick = (e: Event) => {
  if (!(e.target as HTMLElement).closest(".dd")) ddOpen.value = false;
};

onMounted(() => {
  document.addEventListener("click", onDocClick);
  if (idPeminjaman.value) store.fetchByPeminjamanId(idPeminjaman.value);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
});
</script>

<template>
  <div class="page">
    <h1 class="title">Tinjau Pengajuan Peminjaman Aset</h1>

    <div class="main-card card-shadow">
      <div v-if="store.current" class="info-section">
        <h3 class="section-subtitle">Detail Pengajuan</h3>

        <div class="info-grid-2-col">
          <div class="info-column">
            <div class="row-data">
              <span class="label">Aset</span>
              <span>:</span>
              <span class="value">{{ formattedAset }}</span>
            </div>
            <div class="row-data">
              <span class="label">Tujuan Peminjaman</span>
              <span>:</span>
              <span class="value">{{ store.current.tujuan_peminjaman }}</span>
            </div>
            <div class="row-data">
              <span class="label">Nama Peminjam</span>
              <span>:</span>
              <span class="value">{{ formattedPeminjam }}</span>
            </div>
          </div>

          <div class="info-column">
            <div class="row-data">
              <span class="label">Tanggal Peminjaman</span>
              <span>:</span>
              <span class="value">{{ formatDate(store.current.waktu_peminjaman) }}</span>
            </div>
            <div class="row-data">
              <span class="label">Tanggal Pengembalian</span>
              <span>:</span>
              <span class="value">{{ formatDate(store.current.waktu_pengembalian) }}</span>
            </div>
            <div v-if="authStore.userRole === 'ADMIN'" class="row-data">
              <span class="label">Unit Tujuan</span>
              <span>:</span>
              <span class="value">{{ store.current.unit_tujuan || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="review-section">
        <h3 class="section-subtitle">Form Peninjauan</h3>

        <div class="review-grid">
          <div class="field">
            <label class="label">Status <span class="required-star">*</span></label>
            <div class="dd" :class="{ open: ddOpen }">
              <button
                type="button"
                class="dd-btn"
                :disabled="store.isLoading"
                @click="ddOpen = !ddOpen"
              >
                <span :class="{ 'placeholder-color': !form.statusPeminjaman }">
                  {{ form.statusPeminjaman ? STATUS_LABEL[form.statusPeminjaman] : "Pilih status" }}
                </span>
                <ChevronDown class="dd-icon" />
              </button>

              <div v-if="ddOpen" class="dd-menu">
                <button
                  v-for="s in ['DISETUJUI', 'DITOLAK']"
                  :key="s"
                  type="button"
                  class="dd-item"
                  @click="selectStatus(s)"
                >
                  {{ STATUS_LABEL[s] }}
                </button>
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">Alasan <span class="required-star">*</span></label>
            <textarea
              v-model="form.alasan"
              class="textarea"
              placeholder="Masukkan alasan anda"
              rows="3"
              :disabled="store.isLoading"
            />
          </div>

          <div v-if="errorMessage" class="lock-banner">
            {{ errorMessage }}
          </div>
        </div>

        <div class="actions">
          <button
            type="button"
            class="btn-cancel"
            @click="router.back()"
            :disabled="store.isLoading"
          >
            Batal
          </button>

          <button
            type="button"
            class="btn-submit"
            @click="triggerConfirm"
            :disabled="store.isLoading"
          >
            {{ store.isLoading ? "Menyimpan..." : "Simpan" }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <ConfirmationModal
    :show="showConfirmModal"
    title="Konfirmasi Peninjauan"
    message="Apakah Anda yakin data yang dimasukkan sudah benar?"
    confirm-text="Ya, Simpan"
    cancel-text="Batal"
    :is-loading="store.isLoading"
    @confirm="handleSave"
    @cancel="showConfirmModal = false"
  />
</template>

<style scoped>
.page {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 24px;
}

.title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 24px;
}

.main-card {
  background: white;
  padding: 40px;
  border-radius: 24px;
  border: 1px solid #eee;
}

.section-subtitle {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #111827;
}

/* Detail Pengajuan - 2 Kolom */
.info-grid-2-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.row-data {
  display: grid;
  grid-template-columns: 160px 10px 1fr;
  column-gap: 8px;
  margin-bottom: 12px;
  align-items: start;
}

.label {
  font-weight: 700;
  font-size: 14px;
  color: #111827;
}

.value {
  font-size: 14px;
  color: #4B5563;
  word-break: break-word;
}

.review-section {
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid #E5E7EB;
}

.review-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: start;
}

.field .label {
  display: block;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #111827;
}

.dd { position: relative; }
.dd-btn {
  width: 100%;
  height: 56px;
  padding: 0 16px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 14px;
}
.placeholder-color { color: #9CA3AF !important; }
.dd-icon { width: 18px; height: 18px; color: #6B7280; }
.dd-menu {
  position: absolute;
  left: 0; right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  overflow: hidden;
}
.dd-item {
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  border: none;
  background: white;
  cursor: pointer;
}
.dd-item:hover { background: #F9FAFB; }

.textarea {
  width: 100%;
  min-height: 240px;
  border: 1px solid #D1D5DB;
  border-radius: 12px;
  padding: 14px 16px;
  resize: vertical;
  outline: none;
  font-size: 14px;
}
.textarea::placeholder { color: #9CA3AF; opacity: 1; }
.textarea:focus { border-color: #00588F; }

.actions {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 48px;
}

.btn-submit {
  background-color: #00588F;
  color: white;
  border: none;
  padding: 14px 60px;
  border-radius: 40px;
  font-weight: 700;
  cursor: pointer;
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

.lock-banner {
  grid-column: span 2;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #b91c1c;
  padding: 14px 18px;
  border-radius: 12px;
  font-weight: 600;
}

.card-shadow {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.required-star { color: #DC3545; }

@media (max-width: 860px) {
  .info-grid-2-col, .review-grid { grid-template-columns: 1fr; }
}
</style>