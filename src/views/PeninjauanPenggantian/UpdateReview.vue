<template>
  <div class="page">
    <div class="container py-32">
      <h1 class="title">Ubah Tinjau Pengajuan Penggantian</h1>

      <div class="main-card">
        <div class="card-header-container">
          <h2 class="asset-display-title">
            {{ data?.idPenggantian }}
          </h2>
        </div>

        <div v-if="data" class="info-section">
          <h3 class="section-subtitle">Detail Pengajuan</h3>

          <div class="info-grid-3-col">
            <div>
              <div class="row-data">
                <span class="label">Nama Pengaju</span>
                <span>:</span>
                <span class="value">{{ data.namaPengaju }}</span>
              </div>
              <div class="row-data">
                <span class="label">Unit</span>
                <span>:</span>
                <span class="value">{{ data.unitPengaju }}</span>
              </div>
              <div class="row-data">
                <span class="label">Role</span>
                <span>:</span>
                <span class="value">{{ data.rolePengaju }}</span>
              </div>
            </div>

            <div>
              <div class="row-data">
                <span class="label">Nama Barang</span>
                <span>:</span>
                <span class="value">{{ data.namaAset }}</span>
              </div>
              <div class="row-data">
                <span class="label">Merk</span>
                <span>:</span>
                <span class="value">{{ data.merk }}</span>
              </div>
              <div class="row-data">
                <span class="label">Qty</span>
                <span>:</span>
                <span class="value">{{ data.qty }}</span>
              </div>
            </div>
            <div v-if="data.linkGambar" class="image-showcase">
              <div class="label">Contoh Gambar: </div>
              <img
                :src="`https://inventra-dd-be.onrender.com/uploads/contoh-gambar/${data.linkGambar}`"
                class="asset-img-large"
              />
            </div>
          </div>
        </div>

        <div class="review-section">
          <h3 class="section-subtitle">Form Peninjauan</h3>

          <div class="review-grid">

            <div class="field">
              <label class="label">Status <span class="text-red-500">*</span></label>

              <div class="dd" :class="{ open: ddOpen, disabled: isLocked }">
                <button
                  type="button"
                  class="dd-btn"
                  :disabled="isLocked || store.isLoading"
                  @click="ddOpen = !ddOpen"
                >
                  <span :class="{ placeholder: !form.statusPenggantian }">
                {{ form.statusPenggantian ? STATUS_LABEL[form.statusPenggantian] : "Pilih status" }}
                  </span>

                  <svg class="dd-icon" viewBox="0 0 24 24">
                    <path d="M6.7 9.3a1 1 0 0 1 1.4 0L12 13.2l3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4z"/>
                  </svg>
                </button>

                <div v-if="ddOpen" class="dd-menu">
                  <button
                    v-for="s in allowedNextStatuses"
                    :key="s"
                    class="dd-item"
                    @click="selectStatus(s)"
                  >
                    {{ STATUS_LABEL[s] }}
                  </button>
                </div>
              </div>
            </div>

            <div class="field">
              <label class="label">Alasan <span class="text-red-500">*</span></label>
              <textarea
                v-model="form.alasan"
                class="textarea"
                placeholder="Masukkan alasan..."
                :disabled="isLocked || store.isLoading"
              />
            </div>

            <div v-if="displayMessage" class="lock-banner">
              {{ displayMessage }}
            </div>
          </div>


          <div class="actions">
            <button class="btn btn-secondary" @click="onCancel">
              Batal
            </button>

            <button class="btn btn-primary" @click="triggerConfirm">
              Simpan
            </button>
          </div>
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
    :is-loading="isSubmitting"
    @confirm="confirmSave"
    @cancel="showConfirmModal = false"
  />


</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTinjauPenggantianStore } from "@/stores/tinjauPenggantianStore";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from '@/stores/toast'
import ConfirmationModal from "@/components/ConfirmationModal.vue"

const toastStore = useToastStore()
const route = useRoute();
const router = useRouter();
const store = useTinjauPenggantianStore();
const auth = useAuthStore();
const isSubmitting = ref(false)

const penggantianId = computed(() => (route.params.penggantianId));
const role = computed(() => auth.userRole);
const showConfirmModal = ref(false);
const error = ref("");
const data = computed(() => store.current)

const form = reactive({
  statusPenggantian: "",
  alasan: "",
});


async function load() {
  if (!penggantianId.value) return;

  try {
    await store.fetchByPenggantianId((penggantianId.value));

    if (store.current) {
      const curr = store.current;

      // Cek apakah role sekarang sudah pernah mengisi review ini sebelumnya
      const hasReviewed = (curr.createdAt);

      if (hasReviewed) {
        form.statusPenggantian = curr.statusPenggantian || "";
        form.alasan = curr.alasan || "";
      } else {
        // Jika belum (mode create untuk role ini), biarkan form kosong
        form.statusPenggantian = "";
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
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
};


const ddOpen = ref(false);

function selectStatus(s) {
  if (isLocked.value) return;
  form.statusPenggantian = s;
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

  if (!curr.createdAt) return false;

  if (withinDays(curr.createdAt, 2)) {
    return true;
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
  if (!curr.createdAt) return "Tidak bisa mengubah hasil tinjau. Data belum pernah ditinjau.";

  if (!withinDays(curr.createdAt, 2)) {
    return "Batas waktu perubahan (2 hari) telah berakhir.";
  }

  if (!canUpdate.value && (curr.createdAt)) {
    return "Akses pengeditan dikunci.";
  }

  return "";
});
const allowedNextStatuses = computed(() => {
  if (!store.current) return [];

  return ["DISETUJUI", "DITOLAK"];
});


function onCancel(){
  router.push("/pengadaan/rusak/tinjau")
}


function triggerConfirm() {
  error.value = "";

  if (!form.statusPenggantian) {
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
    isSubmitting.value = true
    await store.updateTinjauan((penggantianId.value), {
      statusPenggantian: form.statusPenggantian,
      alasan: form.alasan,
    });
    toastStore.success(
      "Success",
      "Berhasil memperbarui peninjauan."
    )
    router.push("/pengadaan/rusak/tinjau");
  } catch (err) {
    toastStore.error(
      "Error",
      "Gagal memperbarui peninjauan."
    );
    isSubmitting.value = false
  }
}

</script>

<style scoped>
.container {
  max-width: 1100px;
  margin: 0 auto;
}

.main-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  border: 1px solid #eee;
}

.card-header-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-subtitle {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}

.info-grid-3-col {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 40px;
}

.row-data {
  display: grid;
  grid-template-columns: 140px 10px 1fr;
  column-gap: 8px;
  margin-bottom: 6px;
}

.label {
  min-width: 140px;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 6px;
}

.value {
  flex: 1;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.image-showcase {
  display: flex;
  flex-direction: column;
  align-items: left;
  justify-content: center;
}

.asset-img-large {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: 8px;
}

.review-section {
  margin-top: 32px;
  border-top: 1px solid #eee;
  padding-top: 24px;
}



.textarea {
  width: 100%;
  min-height: 120px;
  border-radius: 8px;
  border: 1px solid #ddd;
  padding: 10px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 26px;
  margin-top: 34px;
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
  gap: 24px;
  align-items: start;
}

.field .label {
  display: block;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
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

.recap-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.recap-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}

.recap-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
  font-size: 14px;
}

.recap-grid .full {
  grid-column: span 2;
}

.recap-img {
  width: 200px;
  border-radius: 10px;
  margin-top: 8px;
  border: 1px solid #ddd;
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
