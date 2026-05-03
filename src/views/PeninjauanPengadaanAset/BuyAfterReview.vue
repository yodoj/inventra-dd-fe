<template>
  <div class="page">
    <h1 class="title">Pembelian Aset</h1>

    <div class="review-card">

      <div class="review-grid">
        <div class="field">
          <label class="label">Harga <span class="text-red-500">*</span> </label>
          <div class="money" :class="{ 'money-disabled': isLocked }">
            <span class="money-prefix">Rp</span>
            <input
              v-model="form.harga"
              class="money-input"
              type="text"
              placeholder="Masukkan harga pembelian"
              inputmode="numeric"
              :disabled="isLocked"
            />
          </div>
          <p class="help">Masukkan nominal tanpa huruf (contoh: 1250000).</p>
        </div>

        <div class="field">
          <label class="label">Bukti Pembelian <span class="text-red-500">*</span> </label>
          <label class="dropzone" :class="{ 'dz-disabled': isLocked }">
            <input
              class="file-hidden"
              type="file"
              accept="image/*"
              :disabled="isLocked"
              @change="onFileChange"
            />

            <div v-if="!previewUrl" class="dz-empty">
              <div class="dz-icon">+</div>
              <div class="dz-title">Masukkan Bukti Pembelian</div>
              <div class="dz-sub">Klik untuk pilih file (JPG/PNG)</div>
            </div>

            <div v-else class="dz-filled">
              <img class="dz-img" :src="previewUrl" alt="Preview" />
              <div class="dz-bar">
                <div class="dz-name">{{ fotoFile?.name }}</div>
                <button
                  v-if="!isLocked"
                  type="button"
                  class="dz-remove"
                  @click.prevent="removeFile"
                >
                  Hapus
                </button>
              </div>
            </div>
          </label>
        </div>
        <div v-if="error" class="lock-banner">
          <span>{{ error }}</span>
        </div>

        <div v-if="store.errorMessage" class="lock-banner">
          <span>{{ store.errorMessage }}</span>
        </div>

          <div v-if="isLocked && lockMessage" class="lock-banner">
          <svg class="lock-icon" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          <span>{{ lockMessage }}</span>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" @click="onCancel">
          Batal
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="isLocked"
          @click="triggerConfirm"
        >
          Simpan
        </button>
      </div>
    </div>
  </div>

  <div v-if="showConfirmModal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Konfirmasi Pembelian</h3>
        <button class="close-btn" @click="showConfirmModal = false">×</button>
      </div>
      <div class="modal-body">
        <div class="info-icon-box">
          <svg viewBox="0 0 24 24" class="info-svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <p>Apakah Anda yakin data pembelian dan bukti sudah benar?</p>
      </div>
      <div class="modal-footer">
        <button class="btn-batal" @click="showConfirmModal = false">Batal</button>
        <button class="btn-confirm" @click="confirmSave" :disabled="store.isLoading">
          {{ store.isLoading ? 'Proses...' : 'Ya, Simpan' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTinjauPengadaanStore } from "@/stores/tinjauPengadaanStore";
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
const route = useRoute();
const router = useRouter();
const store = useTinjauPengadaanStore();

const form = reactive({ harga: "" });
const fotoFile = ref(null);
const previewUrl = ref("");
const showConfirmModal = ref(false);

const pengadaanId = computed(() => route.params.idPengadaan);
const error = ref("")
const fileError = ref("")
const isLocked = computed(() => {
  if (store.isLoading) return true;
  const status = store.current?.statusPengadaan;
  return status === 'DIBELI' || status === 'DITOLAK';
});


const lockMessage = computed(() => {
  const status = store.current?.statusPengadaan;
  if (status === 'DIBELI') return "Aset ini sudah berhasil dibeli dan data telah dikunci.";
  if (status === 'DITOLAK') return "Pengajuan ini ditolak, Anda tidak dapat memproses pembelian.";
  return "";
});

onMounted(async () => {
  if (pengadaanId.value) {
    await store.fetchByPengadaanId(pengadaanId.value);
    if (store.current?.hargaBeli) form.harga = store.current.hargaBeli;
  }
});

async function triggerConfirm() {
  if (isLocked.value) return;

  error.value = "";
  store.errorMessage = "";

  // validasi frontend
  if (!form.harga || Number(form.harga) <= 0) {
    error.value = "Harga harus lebih dari 0";
    return;
  }

  if (!fotoFile.value) {
    error.value = "Bukti pembelian wajib diunggah";
    return;
  }

  try {
    // cek backend dulu
    const formData = new FormData();
    formData.append("harga", form.harga);
    formData.append("buktiPembelian", fotoFile.value);

    await store.prosesBeli(pengadaanId.value, formData);

    // kalau backend tidak error baru buka modal
    showConfirmModal.value = true;

  } catch (err) {
    error.value =
      err.response?.data?.message ||
      err.message ||
      "Terjadi kesalahan.";
  }
}

function onFileChange(e) {
  const file = e.target.files?.[0] || null;

  if (!file) return;

  // validasi tipe
  if (!file.type.startsWith("image/")) {
    fileError.value = "File harus berupa gambar";
    return;
  }

  // validasi size (misal max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    fileError.value = "Ukuran file maksimal 2MB";
    return;
  }

  // reset error
  fileError.value = "";

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);

  fotoFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
}

function removeFile() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  fotoFile.value = null;
  previewUrl.value = "";
}

async function confirmSave() {
  showConfirmModal.value = false;

  toastStore.success(
    "Success",
    "Berhasil memperbarui pembelian."
  );

  router.push("/pengadaan/pengajuan/tinjau");
}

function onCancel() {
  router.back();
}
</script>

<style scoped>
.page {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 24px;
}

.title {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 24px;
}

.review-card {
  background: #fff;
  border-radius: 20px;
  padding: 38px 34px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
}

.review-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 42px;
  align-items: start;
}

.field {
  display: flex;
  flex-direction: column;
}

.field .label {
  display: block;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 12px;
  color: #111827;
}

.money {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 56px;
  padding: 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  box-sizing: border-box;
  width: 100%;
}

.money-prefix {
  font-weight: 800;
  color: #111827;
  font-size: 16px;
  white-space: nowrap;
}

.money-input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 16px;
  padding: 0;
}

.money-input::placeholder {
  color: #9ca3af;
  opacity: 1;
}

.money:focus-within {
  border-color: rgba(0, 88, 143, 0.45);
  box-shadow: 0 0 0 4px rgba(0, 88, 143, 0.12);
}

.help {
  margin: 10px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.file-hidden {
  display: none;
}

.dropzone {
  display: block;
  min-height: 240px;
  padding: 18px;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  background: #fafafa;
  cursor: pointer;
  box-sizing: border-box;
  transition: 0.15s;
}

.dropzone:hover {
  background: #f6f8fb;
  border-color: #94a3b8;
}

.dropzone:focus-within {
  border-color: rgba(0, 88, 143, 0.45);
  box-shadow: 0 0 0 4px rgba(0, 88, 143, 0.12);
}

.dz-empty {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
}

.dz-icon {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 800;
  color: #00588f;
  background: #fff;
}

.dz-title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
}

.dz-sub {
  font-size: 14px;
  color: #6b7280;
}

.dz-img {
  width: 100%;
  max-height: 170px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.dz-bar {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.dz-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dz-remove {
  border: none;
  background: rgba(0, 88, 143, 0.08);
  color: #00588f;
  font-weight: 800;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
}

.dz-remove:hover {
  filter: brightness(0.95);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 26px;
  margin-top: 34px;
}

.btn {
  min-width: 200px;
  height: 50px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 18px;
  cursor: pointer;
}

.btn-secondary {
  background: #F2F4F5;
  color: #75777D;
  border-color: #C1C3C6;
}

.btn-primary {
  background: #00588F;
  color: #fff;
  font-weight: 700;
}

.btn-primary:hover {
  filter: brightness(0.9);
}

.btn-secondary:hover {
  filter: brightness(0.9);
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  width: 100%;
  max-width: 450px;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.info-icon-box {
  width: 48px;
  height: 48px;
  background-color: #f0f9ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-svg {
  width: 26px;
  height: 26px;
  fill: #2b5281;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-batal {
  padding: 10px 24px;
  border-radius: 999px;
  border: none;
  background: #f4f6f8;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm {
  padding: 10px 24px;
  border-radius: 999px;
  border: none;
  background: #2b5281;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.err {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #b91c1c;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 600;
  margin-bottom: 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.err-small {
  color: #b91c1c;
  font-size: 13px;
  margin-top: 6px;
  font-weight: 600;
}

.input-error {
  border-color: #ef4444 !important;
  background-color: #fffafb !important;
}

.modal-body p {
  font-size: 15px;
  color: #475569;
  line-height: 1.5;
  margin: 0;
  font-weight: 500;
}

.lock-banner {
  grid-column: span 2;
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #b91c1c;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 600;
  margin-bottom: 20px;
}

.lock-icon {
  width: 20px;
  height: 20px;
  fill: #b91c1c;
}
.err {
  margin-bottom: 20px;
  color: #b91c1c;
  font-weight: 600;
  font-size: 14px;
  padding: 10px;
  background: #fff5f5;
  border-radius: 8px;
}

.money-disabled {
  background-color: #f3f4f6 !important;
  cursor: not-allowed;
}

.money-disabled .money-input {
  cursor: not-allowed;
  color: #9ca3af;
}

.dz-disabled {
  background-color: #f3f4f6 !important;
  border-style: solid !important;
  cursor: not-allowed !important;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(1);
}



@media (max-width: 860px) {
  .review-grid {
    grid-template-columns: 1fr;
    justify-content: stretch;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    min-width: 0;
  }
}
</style>

