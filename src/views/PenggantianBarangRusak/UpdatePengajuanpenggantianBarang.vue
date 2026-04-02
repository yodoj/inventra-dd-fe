<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { usePenggantianBarangRusakStore } from '@/stores/penggantianBarangRusak'

import ConfirmationModal from '@/components/ConfirmationModal.vue'
const error = ref("")
const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const store = usePenggantianBarangRusakStore()
const route = useRoute()

const isSubmitting = ref(false)
const showConfirmModal = ref(false)

const fotoFile = ref<File | null>(null)
const previewUrl = ref("")

const id = route.params.idPenggantian as string
const form = ref({
  namaBarang: '',
  merk: '',
  quantity: 1,
  waktuPenggantian: '',
  unitPengaju: authStore.user?.unit || '',
  keterangan: ''
})

onMounted(async () => {
  try {

    const data = await store.getPengajuanById(id)

    form.value.namaBarang = data.namaBarang
    form.value.merk = data.merk
    form.value.quantity = data.quantity
    form.value.waktuPenggantian = data.waktuPenggantian?.split("T")[0]
    form.value.unitPengaju = data.unitPengaju
    form.value.keterangan = data.keterangan || ""

    if (data.contohBarang) {
      previewUrl.value = `http://localhost:8080/uploads/contoh-gambar/${data.contohBarang}`
    }

  } catch (err) {
    toastStore.error("Error", "Gagal mengambil data pengajuan")
  }
})

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0] || null

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)

  fotoFile.value = file
  previewUrl.value = file ? URL.createObjectURL(file) : ""
}

function removeFile() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  fotoFile.value = null
  previewUrl.value = ""
}

function triggerConfirm() {
  error.value=""

  if (!form.value.namaBarang) {
    error.value= 'Nama barang wajib diisi'
    return
  }

  if (!form.value.merk) {
    error.value= 'Merk wajib diisi'
    return
  }

  if (form.value.quantity <= 0) {
    error.value= 'Kuantitas harus lebih dari 0'
    return
  }

  if (!form.value.waktuPenggantian) {
    error.value = 'Tanggal penggantian wajib diisi'
    return
  } else {
    const today = new Date()
    const selectedDate = new Date(form.value.waktuPenggantian)
    today.setHours(0, 0, 0, 0)
    selectedDate.setHours(0, 0, 0, 0)

    if (selectedDate <= today) {
      error.value = 'Waktu penggantian tidak boleh hari ini atau sebelumnya'
      return
    }
  }

  if (!fotoFile.value && !previewUrl.value) {
    error.value = 'Contoh barang wajib diupload'
    return
  }

  showConfirmModal.value = true
}

async function confirmSave() {

  showConfirmModal.value = false
  isSubmitting.value = true

  try {

    const payload = new FormData()

    payload.append("namaBarang", form.value.namaBarang)
    payload.append("merk", form.value.merk)
    payload.append("quantity", String(form.value.quantity))

    payload.append(
      "waktuPenggantian",
      form.value.waktuPenggantian
    )
    payload.append("unitPengaju", form.value.unitPengaju)
    if (form.value.keterangan) {
      payload.append("keterangan", form.value.keterangan)
    }
    if (fotoFile.value) {
      payload.append("contohBarang", fotoFile.value as File)
    }

    for (const pair of payload.entries()) {
      console.log(pair[0], pair[1])
    }
    await store.updatePengajuan(id, payload)

    toastStore.success('Success', 'Pengajuan penggantian barang rusak berhasil diperbarui')

    router.push('/pengadaan/rusak')

  } catch (error:any) {

    toastStore.error('Error', error || 'Gagal memperbarui pengajuan')

  } finally {

    isSubmitting.value = false

  }

}


const displayMessage = computed(()=>{

  if(error.value) return error.value

  if(store.errorMessage) return store.errorMessage

  return ""

})

</script>

<template>
  <div class="page">
    <div class="mb-8 flex items-center gap-3 margin-bottom: 32px;">
      <ArrowLeft class="cursor-pointer" @click="router.back()" />
      <h1 class="title m-0">Perbarui Pengajuan Penggantian Barang Rusak</h1>
    </div>

    <div class="review-card">
        <div class="form-grid-3">

          <div class="column">
            <div class="field">
              <label class="label">Nama Barang <span class="text-red-500">*</span></label>
              <input v-model="form.namaBarang" type="text" class="form-input-lg" placeholder="Contoh: Laptop" />
            </div>
            <div class="field">
              <label class="label">Tanggal Penggantian <span class="text-red-500">*</span></label>
              <input v-model="form.waktuPenggantian" type="date" class="form-input-lg" />
            </div>
            <div class="field">
              <label class="label">Merk <span class="text-red-500">*</span></label>
              <input v-model="form.merk" type="text" class="form-input-lg" placeholder="Contoh: Dell" />
            </div>
          </div>

          <div class="column">
            <div class="field">
              <label class="label">Unit</label>
              <input v-model="form.unitPengaju" type="text" class="form-input-lg" disabled />
            </div>
            <div class="field">
              <label class="label">Kuantitas <span class="text-red-500">*</span></label>
              <input v-model.number="form.quantity" type="number" class="form-input-lg" />
            </div>
            <div class="field">
              <label class="label">Keterangan</label>
              <textarea
                v-model="form.keterangan"
                class="textarea"
                placeholder="Masukan keterangan singkat"
                rows="1"
              ></textarea>
            </div>
          </div>

          <div class="column">
            <div class="field">
              <label class="label">Contoh Barang <span class="text-red-500">*</span></label>
              <label class="dropzone">
                <input class="file-hidden" type="file" accept="image/*" @change="onFileChange" />
                <div v-if="!previewUrl" class="dz-content">
                  <div class="dz-icon-circle"><span class="dz-plus">+</span></div>
                  <h3 class="dz-title-custom">Upload Foto Barang</h3>
                </div>
                <div v-else class="dz-preview-box">
                  <img class="dz-img-fluid" :src="previewUrl"/>
                  <button type="button" class="dz-remove" @click.prevent="removeFile">Hapus</button>
                </div>
              </label>
            </div>
            </div>
          </div>
          <div v-if="displayMessage" class="lock-banner">
          {{ displayMessage }}
        </div>

        <div class="actions">
          <button type="button" @click="router.back()" class="btn btn-secondary">Batal</button>
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
  <ConfirmationModal
    :show="showConfirmModal"
    title="Konfirmasi Pengajuan"
    message="Apakah Anda yakin ingin memperbarui penggantian barang rusak ini?"
    confirm-text="Ya, Simpan"
    cancel-text="Batal"
    :is-loading="isSubmitting"
    @confirm="confirmSave"
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
  color: #111827;
}

.review-card {
  margin-top: 24px;
  background: #fff;
  border-radius: 20px;
  padding: 38px 34px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);
}

.top-fields-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.bottom-fields-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;
  align-items: stretch;
}

.field .label {
  display: block;
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #111827; }

.textarea {
  width: 100%;
  min-height: 40px;
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
  margin-top: 60px; }

.btn {
  min-width: 200px;
  height: 50px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 18px;
  cursor: pointer;
}

.add-page {
  background: #F9FAFB;
  min-height: 100vh;
}

.form-card {
  background: white;
  padding: 40px;
  border-radius: 24px;
  max-width: 1200px;
  margin: auto;
}

.top-fields-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.bottom-fields-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  align-items: stretch;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.label {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 8px;
  color: #111827;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #D1D5DB;
  border-radius: 10px;
  font-size: 14px;
}

.textarea-field {
  height: 100%;
  min-height: 180px;
  resize: none;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.textarea {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  resize: none;
  font-size: 14px;
}

.dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #CBD5E1;
  border-radius: 16px;
  min-height: 200px;
  cursor: pointer;
  background: #FAFAFA;
}

.dz-title-custom { font-size: 14px; font-weight: 700; color: #6b7280; }

.actions {
  display: flex;
  justify-content: center;
  gap: 26px;
  margin-top: 60px;
}

.form-input-lg {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
}

.dz-icon-circle {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.dz-plus {
  font-size: 22px;
  color: #002D5D;
  font-weight: bold;
}

.dz-title {
  font-size: 16px;
  font-weight: 800;
  color: #1F2937;
  margin-bottom: 4px;
}

.dz-sub {
  color: #6B7280;
  font-size: 12px;
}

.dz-img {
  max-width: 100%;
  max-height: 120px;
  border-radius: 8px;
  object-fit: cover;
}

.dz-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.dz-remove {
  border: none;
  background: rgba(0, 88, 143, 0.08);
  color: #00588f;
  font-weight: 800;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  margin-right: 12px;
  margin-bottom: 10px;
  align-self: flex-end;
  float: right
}

.dz-remove:hover {
  filter: brightness(0.95);
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.btn-primary {
  background: #00588F;
  color: #fff;
  font-weight: 700;
}

.btn-primary:hover {
  filter: brightness(0.9);
}

.btn-secondary {
  background: #F2F4F5;
  color: #75777D;
  border-color: #C1C3C6;
}

.btn-secondary:hover {
  filter: brightness(0.9);
}

.btn-cancel:hover {
  filter: brightness(0.9);
}

.file-hidden {
  display: none;
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
</style>
