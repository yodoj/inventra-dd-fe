<template>
  <div class="page">
    <h1 class="title">Tinjau Pengajuan Pengadaan Aset</h1>

    <div class="review-card">
      <div class="review-grid">
        <!-- LEFT -->
        <div class="field">
          <label class="label">Status</label>
          <div class="select-wrap">
            <select
              v-model="form.status"
              class="status-select status-select-lg"
              :disabled="isLocked"
            >
              <option disabled value="">
                {{ isLocked ? "Status sudah final" : "Pilih status" }}
              </option>

              <option
                v-for="s in allowedNextStatuses"
                :key="s"
                :value="s"
              >
                {{ STATUS_LABEL[s] }}
              </option>
            </select>

            <svg class="chev" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.7 9.3a1 1 0 0 1 1.4 0L12 13.2l3.9-3.9a1 1 0 1 1 1.4 1.4l-4.6 4.6a1 1 0 0 1-1.4 0l-4.6-4.6a1 1 0 0 1 0-1.4z" />
            </svg>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="field">
          <label class="label">Alasan</label>
          <textarea
            v-model="form.alasan"
            class="textarea"
            placeholder="Placeholder"
            rows="3"
          />
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" @click="onCancel">
          Batal
        </button>
        <button type="button" class="btn btn-primary" @click="onSave">
          Simpan
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";

const statusSebelumnya = ref("DISETUJUI_KEPSEK"); // dummy, nanti ambil dari API

const form = reactive({
  status: "",
  alasan: "",
});

const STATUS_LABEL = {
  DIAJUKAN: "Diajukan",
  DISETUJUI_KEPSEK: "Disetujui Kepsek",
  DISETUJUI_YAYASAN: "Disetujui Yayasan",
  DITOLAK: "Ditolak",
};

const allowedNextStatuses = computed(() => {
  switch (statusSebelumnya.value) {
    case "DIAJUKAN":
      return ["DISETUJUI_KEPSEK", "DITOLAK"];
    case "DISETUJUI_KEPSEK":
      return ["DISETUJUI_YAYASAN", "DITOLAK"];
    default:
      // sudah final (yayasan) -> tidak ada opsi
      return [];
  }
});

const isLocked = computed(() => allowedNextStatuses.value.length === 0);

watch(
  () => statusSebelumnya.value,
  () => {
    if (!allowedNextStatuses.value.includes(form.status)) {
      form.status = "";
    }
  },
  { immediate: true }
);

function onCancel() {
  form.status = "";
  form.alasan = "";
}

function onSave() {
  if (isLocked.value) {
    alert("Status sudah final, tidak bisa diubah.");
    return;
  }
  if (!form.status) {
    alert("Pilih status terlebih dahulu.");
    return;
  }
  if (form.status === "ditolak" && !form.alasan.trim()) {
    alert("Jika ditolak, alasan wajib diisi.");
    return;
  }

  // dummy payload
  const payload = {
    status_sebelumnya: statusSebelumnya.value,
    status_baru: form.status,
    alasan: form.alasan,
  };

  console.log("payload:", payload);
  alert("Tersimpan!");
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
  padding-right: 44px;
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

.btn {
  min-width: 200px;
  height: 50px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 700;
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
}

.btn-primary:hover {
  filter: brightness(0.80);
}

.btn-secondary:hover {
  filter: brightness(0.8);
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
}
</style>
