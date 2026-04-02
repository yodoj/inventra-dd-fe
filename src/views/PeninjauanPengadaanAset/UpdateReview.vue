<template>
  <div class="page">
    <h1 class="title">Tinjau Pengajuan Pengadaan Aset</h1>

    <div class="review-card">
      <div class="review-grid">
        <div class="field">
          <label class="label">Status <span class="text-red-500">*</span></label>

          <div class="dd" :class="{ open: ddOpen, disabled: isLocked }">
            <button
              type="button"
              class="dd-btn"
              :disabled="isLocked"
              @click="ddOpen = !ddOpen"
            >
              <span :class="{ placeholder: !form.statusPengadaan }">
                {{ form.statusPengadaan ? STATUS_LABEL[form.statusPengadaan] : "Pilih status" }}
              </span>

              <svg class="dd-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6.7 9.3a1 1 0 0 1 1.4 0L12 13.2l3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4z"/>
              </svg>
            </button>

            <div v-if="ddOpen" class="dd-menu">
              <button
                v-for="s in allowedNextStatuses"
                :key="s"
                type="button"
                class="dd-item"
                @click="selectStatus(s)"
              >
                {{ STATUS_LABEL[s] }}
                <span v-if="s === store.current?.statusPengadaan"></span>
              </button>
            </div>
          </div>
        </div>


        <div class="field">
          <label class="label">Alasan <span class="text-red-500">*</span></label>
          <textarea
            v-model="form.alasan"
            class="textarea"
            placeholder="Masukkan alasan anda"
            rows="3"
            :disabled="isLocked"
          />
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
        <button type="button" class="btn btn-primary" @click="triggerConfirm">
          Simpan
        </button>
      </div>
    </div>
  </div>
  <div v-if="showConfirmModal" class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Konfirmasi Ubah Peninjauan</h3>
      <button class="close-btn" @click="showConfirmModal = false">×</button>
    </div>

    <div class="modal-body">
      <div class="info-icon-box">
        <svg viewBox="0 0 24 24" class="info-svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      <p>Apakah Anda yakin data yang dimasukkan sudah benar?</p>
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

<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTinjauPengadaanStore } from "@/stores/tinjauPengadaanStore";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
const route = useRoute();
const router = useRouter();

const store = useTinjauPengadaanStore();
const auth = useAuthStore();

const pengadaanId = computed(() => (route.params.pengadaanId));
const role = computed(() => auth.userRole);
const showConfirmModal = ref(false);
const error = ref("");

const form = reactive({
  statusPengadaan: "",
  alasan: "",
});


async function load() {
  if (!pengadaanId.value) return;

  try {
    await store.fetchByPengadaanId((pengadaanId.value));

    if (store.current) {
      const curr = store.current;
      const userRole = auth.userRole;

      // Cek apakah role sekarang sudah pernah mengisi review ini sebelumnya
      const hasReviewed = (userRole === 'KEPSEK' && curr.kepsekFirstReviewedAt) ||
                          (userRole === 'YAYASAN' && curr.yayasanFirstReviewedAt);

      if (hasReviewed) {
        form.statusPengadaan = curr.statusPengadaan || "";
        form.alasan = curr.alasan || "";
      } else {
        // Jika belum (mode create untuk role ini), biarkan form kosong
        form.statusPengadaan = "";
        form.alasan = "";
      }
    }
  } catch (err) {
    console.error("Gagal memuat data peninjauan", err);
  }
}

onMounted(load);

const STATUS_LABEL = {
  DIAJUKAN: "Diajukan",
  DISETUJUI_KEPSEK: "Disetujui Kepsek",
  DISETUJUI_YAYASAN: "Disetujui Yayasan",
  DITOLAK: "Ditolak",
  DIBELI: "Dibeli",
};


const ddOpen = ref(false);

function selectStatus(s) {
  if (isLocked.value) return;
  form.statusPengadaan = s;
  ddOpen.value = false;
}

const ddRef = ref(null);

function onDocClick(e) {
  if (!ddRef.value) return;
  if (!ddRef.value.contains(e.target)) ddOpen.value = false;
}
onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));

function withinDays(fromISO, days = 2) {
  if (!fromISO) return false;

  const from = new Date(fromISO).getTime();
  const now = Date.now();
  const diffDays = (now - from) / (1000 * 60 * 60 * 24);

  return diffDays <= days;
}

const canUpdate = computed(() => {
  if (!store.current) return false;

  const curr = store.current;
  const r = role.value;

  if (r === "KEPSEK") {
    if (!curr.kepsekFirstReviewedAt) return false;

    const masaGaransi = withinDays(curr.kepsekFirstReviewedAt, 2);
    // Kepsek boleh update jika:
    //    Masih dalam 2 hari DAN Yayasan belum menyetujui/menolak (melangkah ke tahap berikutnya)
    const yayasanBelumReview = !curr.yayasanFirstReviewedAt;

    return masaGaransi && yayasanBelumReview;
  }

  if (r === "YAYASAN") {
    if (!curr.yayasanFirstReviewedAt) return false;

    const masaGaransi = withinDays(curr.yayasanFirstReviewedAt, 2);
    // Yayasan boleh update status (termasuk mengubah Ditolak jadi Setuju)
    //    asalkan masih dalam 2 hari dan aset belum dibeli (final)
    const belumDibeli = curr.statusPengadaan !== "DIBELI";

    return masaGaransi && belumDibeli;
  }

  return false;
});

const isLocked = computed(() => store.isLoading || !canUpdate.value);

const lockMessage = computed(() => {
  if (!store.current) return "";
  const curr = store.current;
  const r = role.value;

  if (store.isLoading) return "";

  // Pesan spesifik berdasarkan Rule
  if (r === "KEPSEK") {
    if (!curr.kepsekFirstReviewedAt) return "Tidak bisa mengubah hasil tinjau. Data belum pernah ditinjau oleh Kepala Sekolah.";

    if (!withinDays(curr.kepsekFirstReviewedAt, 2)) {
      return "Batas waktu perubahan (2 hari) telah berakhir.";
    }
    if (curr.yayasanFirstReviewedAt) {
      return "Data sudah diproses oleh Yayasan dan tidak dapat diubah lagi.";
    }
  }

  if (r === "YAYASAN") {
    if (!curr.yayasanFirstReviewedAt) return "Tidak bisa mengubah hasil tinjau. Data belum pernah ditinjau oleh Yayasan.";

    if (!withinDays(curr.yayasanFirstReviewedAt, 2)) {
      return "Batas waktu perubahan (2 hari) telah berakhir.";
    }
    if (curr.statusPengadaan === "DIBELI") {
      return "Aset sudah dalam status DIBELI dan tidak dapat diubah.";
    }
  }

  if (!canUpdate.value && (curr.kepsekFirstReviewedAt || curr.yayasanFirstReviewedAt)) {
    return "Akses pengeditan dikunci.";
  }

  return "";
});
const allowedNextStatuses = computed(() => {
  if (!store.current) return [];

  const r = role.value;
  if (r === "KEPSEK") return ["DISETUJUI_KEPSEK", "DITOLAK"];
  if (r === "YAYASAN") return ["DISETUJUI_YAYASAN", "DITOLAK"];

  return ["DITOLAK"];
});


function onCancel() {
  if (!store.current) return;
  form.statusPengadaan = store.current.statusPengadaan || "";
  form.alasan = store.current.alasan || "";
}


function triggerConfirm() {
  error.value = "";

  if (!form.statusPengadaan) {
    error.value = "Pilih status terlebih dahulu!";
    return;
  }
  if (!form.alasan) {
    error.value = "Masukkan alasan terlebih dahulu!";
    return;
  }
  showConfirmModal.value = true;
}

async function confirmSave() {
  try {
    showConfirmModal.value = false;
    await store.updateTinjauan((pengadaanId.value), {
      statusPengadaan: form.statusPengadaan,
      alasan: form.alasan,
    });
    toastStore.success(
      "Success",
      "Berhasil memperbarui peninjauan."
    )
    router.push("/pengadaan/pengajuan/tinjau");
  } catch (err) {
    toastStore.error(
      "Error",
      "Gagal memperbarui peninjauan."
    );
  }
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

.bold {
  font-weight: 600;
}

.center {
  text-align: center;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #777;
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

.field .label {
  display: block;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 12px;
  color: #111827;
}

.select-wrap {
  position: relative;
}

.status-select-lg {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  background: #fff;
  appearance: none;
  padding-right: px;
}

.chev {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  fill: #6b7280;
  pointer-events: none;
}

.textarea {
  width: 100%;
  min-height: 240px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 16px;
  resize: vertical;
  outline: none;
}

.textarea:focus,
.status-select:focus {
  border-color: rgba(0, 88, 143, 0.35);
  box-shadow: 0 0 0 3px rgba(0, 88, 143, 0.12);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 26px;
  margin-top: 34px;
}

.textarea::placeholder {
  color: #9ca3af;
  opacity: 1;
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

.dd { position: relative; }

.dd-btn{
  width:100%;
  height:56px;
  padding:0 16px;
  border:1px solid #e5e7eb;
  border-radius:14px;
  background:#fff;
  display:flex;
  align-items:center;
  justify-content:space-between;
  cursor:pointer;
  font-size:16px;
}

.dd-btn:focus{
  outline:none;
  border-color:rgba(0,88,143,.45);
  box-shadow:0 0 0 4px rgba(0,88,143,.12);
}

.dd-btn .placeholder{ color:#9ca3af; }

.dd-icon{ width:18px; height:18px; fill:#6b7280; }

.dd-menu{
  position:absolute;
  left:0; right:0;
  margin-top:10px;
  background:#fff;
  border:1px solid #e5e7eb;
  border-radius:14px;
  box-shadow:0 12px 30px rgba(0,0,0,.10);
  overflow:hidden;
  z-index:50;
}

.dd-item{
  width:100%;
  text-align:left;
  padding:14px 16px;
  background:#fff;
  border:0;
  cursor:pointer;
  font-size:15px;
}

.dd-item:hover{
  background: rgba(0, 88, 143, 0.08);
}

.dd.disabled .dd-btn{
  background:#f3f4f6;
  color:#9ca3af;
  cursor:not-allowed;
}

@media (max-width: 860px) {
  .review-grid {
    grid-template-columns: 1fr;
  }

  .btn {
    width: 100%;
    min-width: 0;
  }

  .actions {
    flex-direction: column;
  }
  .err {
    margin-top: 10px;
    color: #b91c1c;
    font-size: 14px;
  }
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

.textarea:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
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

.modal-body p {
  font-size: 15px;
  color: #475569;
  line-height: 1.5;
  margin: 0;
  font-weight: 500;
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

.btn-confirm:hover {
  background: #1e3a5f;
}

@media (max-width: 860px) {
  .lock-banner {
    grid-column: span 1;
  }

}
</style>
