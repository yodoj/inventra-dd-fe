<template>
  <div class="page">
    <h1 class="title">Pembelian Aset</h1>

    <div class="review-card">
      <div class="review-grid">
      <!-- LEFT -->
      <div class="field">
        <label class="label">Harga</label>

        <div class="money">
          <span class="money-prefix">Rp</span>
          <input
            v-model="form.harga"
            class="money-input"
            type="text"
            placeholder="Masukkan harga pembelian"
            inputmode="numeric"
          />
        </div>

        <p class="help">Masukkan nominal tanpa huruf (contoh: 1250000).</p>
      </div>

      <!-- RIGHT -->
      <div class="field">
        <label class="label">Bukti Pembelian</label>

        <label class="dropzone">
          <input
            class="file-hidden"
            type="file"
            accept="image/*"
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
              <button type="button" class="dz-remove" @click.prevent="removeFile">
                Hapus
              </button>
            </div>
          </div>
        </label>
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
import { reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTinjauPengadaanStore } from "@/stores/tinjauPengadaanStore";

const route = useRoute();
const router = useRouter();
const store = useTinjauPengadaanStore();

const pengadaanId = route.params.pengadaanId;

const form = reactive({ harga: "" });
const fotoFile = ref(null);
const previewUrl = ref("");

onMounted(async () => {
  if (pengadaanId) {
    try {
      await store.fetchByPengadaanId(pengadaanId);
    } catch (error) {
      console.error("Gagal mengambil detail pengadaan:", error);
    }
  }
});

function onFileChange(e) {
  const file = e.target.files?.[0] || null;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  fotoFile.value = file;
  previewUrl.value = file ? URL.createObjectURL(file) : "";
}

function removeFile() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  fotoFile.value = null;
  previewUrl.value = "";
}

function onCancel() {
  router.back();
}

async function onSave() {
  if (form.harga === undefined || form.harga === null || form.harga === "") {
    alert("Harga wajib diisi.");
    return;
  }

  const formData = new FormData();
  formData.append("harga", String(form.harga));

  if (fotoFile.value) {
    formData.append("buktiPembelian", fotoFile.value);
  }

  await store.prosesBeli(pengadaanId, form.harga, fotoFile.value);
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


<!-- Buat nanti backend

const formData = new FormData();
formData.append("harga", form.harga);
formData.append("foto", form.foto);

// axios example
await axios.post("/api/upload", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

-->
