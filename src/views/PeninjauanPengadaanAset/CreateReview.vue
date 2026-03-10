<template>
  <div class="page">
    <h1 class="title">Tinjau Pengajuan Pengadaan Aset</h1>

    <div class="review-card">
      <div class="review-grid">
        <div class="field">
          <label class="label">Status</label>

          <div class="dd" :class="{ open: ddOpen, disabled: isLocked }">
            <button
              type="button"
              class="dd-btn"
              :disabled="isLocked || store.isLoading"
              @click="ddOpen = !ddOpen"
            >
              <span :class="{ placeholder: !form.statusPengadaan }">
                {{ form.statusPengadaan ? STATUS_LABEL[form.statusPengadaan] : "Pilih status" }}
              </span>

              <svg class="dd-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6.7 9.3a1 1 0 0 1 1.4 0L12 13.2l3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4z"
                />
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
              </button>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="label">Alasan</label>
          <textarea
            v-model="form.alasan"
            class="textarea"
            placeholder="Masukkan alasan anda"
            rows="3"
            :disabled="store.isLoading"
          />
        </div>
           <p v-if="store.errorMessage" class="err">{{ store.errorMessage }}</p>
           <p v-if="statusError" class="err">{{ statusError }}</p>
            <div v-if="isLocked && lockMessage" class="lock-banner">
              <svg class="lock-icon" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <span>{{ lockMessage }}</span>
          </div>
      </div>

      <div class="actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="onCancel"
          :disabled="store.isLoading"
        >
          Batal
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="triggerConfirm"
          :disabled="store.isLoading"
        >
          {{ store.isLoading ? "Menyimpan..." : "Simpan" }}
        </button>
      </div>
    </div>
  </div>

  <div v-if="showConfirmModal" class="modal-overlay">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Konfirmasi Peninjauan</h3>
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

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const store = useTinjauPengadaanStore();
const statusError = ref("");
const ALL_ROUTE = "/pengadaan/pengajuan/tinjau";
const pengadaanId = computed(() => (route.params.pengadaanId));
const form = reactive({ statusPengadaan: "", alasan: "" });
const showConfirmModal = ref(false);
const loading = ref(true);

const STATUS_LABEL = {
  DIAJUKAN: "Diajukan",
  DISETUJUI_KEPSEK: "Disetujui Kepsek",
  DISETUJUI_YAYASAN: "Disetujui Yayasan",
  DITOLAK: "Ditolak",
  DIBELI: "Dibeli",
};

const ddOpen = ref(false);
const statusSebelumnya = computed(() => store.statusSebelumnya);

function selectStatus(s) {
  form.statusPengadaan = s;
  ddOpen.value = false;
}

function onDocClick(e) {
  if (!e.target.closest(".dd")) ddOpen.value = false;
}

onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
const allowedNextStatuses = computed(() => {
  switch (statusSebelumnya.value) {
    case "DIAJUKAN":
      return ["DISETUJUI_KEPSEK", "DITOLAK"];
    case "DISETUJUI_KEPSEK":
      return ["DISETUJUI_YAYASAN", "DITOLAK"];
    case "DISETUJUI_YAYASAN":
      return [];
    default:
      return [];
  }
});

const lockMessage = computed(() => {
  if (store.isLoading) return "";

  const curr = store.current;
  const userRole = auth.userRole;
  const status = statusSebelumnya.value;

  // RULE: Yayasan tidak bisa review jika Kepsek belum review
  if (userRole === 'YAYASAN' && status === 'DIAJUKAN') {
    return "Menunggu persetujuan Kepala Sekolah sebelum dapat ditinjau oleh Yayasan.";
  }

  // RULE: Jika role tersebut sudah pernah review (Double Create Prevention)
  if (userRole === 'KEPSEK' && curr?.kepsekFirstReviewedAt) {
    return "Anda sudah memberikan penilaian untuk pengajuan ini.";
  }
  if (userRole === 'YAYASAN' && curr?.yayasanFirstReviewedAt) {
    return "Pihak Yayasan sudah memberikan penilaian untuk pengajuan ini.";
  }

  // RULE: Berdasarkan alur status (Case Locked)
  if (isLocked.value) {
    switch (status) {
      case "DISETUJUI_YAYASAN":
        return "Pengajuan sudah disetujui oleh Yayasan (Tahap Akhir).";
      case "DITOLAK":
        return "Pengajuan ini telah ditolak.";
      case "DIBELI":
        return "Aset sudah dibeli, data tidak dapat diubah lagi.";
      default:
        // Jika Kepsek mencoba masuk saat status sudah disetujui kepsek (menunggu yayasan)
        if (userRole === 'KEPSEK' && status === 'DISETUJUI_KEPSEK') {
          return "Pengajuan sudah Anda setujui dan sedang menunggu verifikasi Yayasan.";
        }
        return "Status saat ini tidak memungkinkan untuk dilakukan peninjauan.";
    }
  }
  return "";
});

const isLocked = computed(() => {
  const curr = store.current;
  const userRole = auth.userRole;
  const status = statusSebelumnya.value;

  // Cek apakah Yayasan mencoba create sebelum kepsek
  const yayasanCuriStart = (userRole === 'YAYASAN' && status === 'DIAJUKAN');

  // Cek apakah sudah pernah review
  const alreadyReviewed = (userRole === 'KEPSEK' && curr?.kepsekFirstReviewedAt) ||
                          (userRole === 'YAYASAN' && curr?.yayasanFirstReviewedAt);

  return allowedNextStatuses.value.length === 0 || alreadyReviewed || yayasanCuriStart;
});


watch(
  () => statusSebelumnya.value,
  () => {
    if (!allowedNextStatuses.value.includes(form.statusPengadaan)) form.statusPengadaan = "";
    if (store.current?.alasan != null) form.alasan = store.current.alasan || "";
  },
  { immediate: true }
);

async function load() {
  try {
    await store.fetchByPengadaanId(pengadaanId.value);
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Request gagal";
    throw new Error(msg);
  } finally {
    loading.value = false;
  }


  form.alasan = "";
  form.statusPengadaan = "";
}

onMounted(load);

function goToAll() {
  router.push(ALL_ROUTE);
}

function onCancel() {
  goToAll();
}

function triggerConfirm() {
  statusError.value = "";

  if (!form.statusPengadaan) {
    statusError.value = "Pilih status terlebih dahulu!";
    return;
  }
  showConfirmModal.value = true;
}

async function confirmSave() {
  try {
    showConfirmModal.value = false;
    await store.createTinjauan((pengadaanId.value), {
      statusPengadaan: form.statusPengadaan,
      alasan: form.alasan,
    });
    alert("Berhasil membuat peninjauan!");
    router.push("/pengadaan/pengajuan/tinjau");
  } catch (err) {
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
.lock-banner {
  grid-column: span 2;
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #b91c1c;
  padding: 14px 18px;
  border-radius: 12px;
  font-weight: 600;
  margin-top: 10px;
}

.lock-icon {
  width: 20px;
  height: 20px;
  fill: #b91c1c;
  flex-shrink: 0;
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
</style>
