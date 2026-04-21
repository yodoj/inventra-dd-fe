<script setup lang="ts">
import { onMounted, ref, computed } from "vue"
import SearchIcon from "@/components/icons/SearchIcon.vue"
import { ChevronDown } from "lucide-vue-next"
import "primeicons/primeicons.css"

import { usePenggantianBarangRusakStore } from "@/stores/penggantianBarangRusak"
import { useRouter } from "vue-router"
import { Plus, Trash2, Pencil } from "lucide-vue-next"
import { useToastStore } from "@/stores/toast"
import ConfirmationModal from "@/components/ConfirmationModal.vue"
const showDeleteModal = ref(false)
const selectedId = ref<string | null>(null)
const router = useRouter()
const toastStore = useToastStore()

type TableRow = {
  idPenggantian: string
  namaPengaju: string
  rolePengaju: string
  unitPengaju: string
  gambar: string
  namaBarang: string
  merk: string
  qty: number
  tanggal: string
  status: string
  keterangan: string
  alasan: string
  reviewCreatedAt: string
  reviewUpdatedAt: string
  reviewerRole: string
  namaReviewer: string
}

const store = usePenggantianBarangRusakStore()

const q = ref("")
const statusFilter = ref("ALL")
const sortKey = ref("")
const sortOrder = ref("asc")

const statuses = [
  { label: "Semua Status", value: "ALL" },
  { label: "Diajukan", value: "DIAJUKAN" },
  { label: "Disetujui", value: "DISETUJUI" },
  { label: "Ditolak", value: "DITOLAK" },
]

function getSortIcon(column: string) {
  if (sortKey.value !== column) return "pi-sort-alt unsorted"
  return sortOrder.value === "asc"
    ? "pi-sort-amount-up-alt active-sort"
    : "pi-sort-amount-down active-sort"
}

function sortBy(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc"
  } else {
    sortKey.value = key
    sortOrder.value = "asc"
  }
}

function getStatusClass(status: string) {
  const map: Record<string, string> = {
    DIAJUKAN: "status-diajukan",
    DISETUJUI: "status-disetujui",
    DITOLAK: "status-ditolak",
  }
  return map[status] || ""
}

function formatStatus(status: string) {
  return String(status || "").replace(/_/g, " ")
}

function formatDate(date: string | null) {
  if (!date) return "-"
  const d = date.slice(0, 10)
  const [y, m, day] = d.split("-")
  return `${day}/${m}/${y}`
}

function formatRole(role: string) {
  if (!role) return ''
  const r = String(role).toLowerCase()
  if (r === 'sarpras') return 'sarpras'
  if (r === 'admin') return 'admin'
  return role
}

async function fetchAll() {
  try {
    await store.fetchAll({
      status: statusFilter.value === "ALL" ? null : statusFilter.value,
      search: q.value || null
    })
  } catch (e) {
    console.error(e)
  }
}

const handleApplyFilter = () => fetchAll()

const handleReset = () => {
  q.value = ""
  statusFilter.value = "ALL"
  fetchAll()
}

onMounted(fetchAll)

const tableRows = computed(() => {
  const data = store.items.map((it) => ({
    idPenggantian: it.idPenggantian ?? "",
    namaPengaju: it.namaPengaju ?? "-",
    unitPengaju: it.unitPengaju ?? "-",
    rolePengaju: it.rolePengaju ?? "-",
    gambar: it.contohBarang ?? "",
    namaBarang: it.namaBarang ?? "",
    merk: it.merk ?? "",
    qty: it.quantity ?? 0,
    tanggal: it.waktuPenggantian ?? "",
    status: it.status ?? "DIAJUKAN",
    keterangan: it.keterangan ?? "-",
    alasan: it.alasan ?? "-",
    reviewCreatedAt: it.reviewCreatedAt ?? "",
    reviewUpdatedAt: it.reviewUpdatedAt ?? "",
    reviewerRole: it.reviewerRole ?? "",
    namaReviewer: it.namaReviewer ?? "",
  }))

  if (sortKey.value) {
    data.sort((a, b) => {
      let aVal = (a as any)[sortKey.value] ?? ""
      let bVal = (b as any)[sortKey.value] ?? ""

      if (typeof aVal === "string") aVal = aVal.toLowerCase()
      if (typeof bVal === "string") bVal = bVal.toLowerCase()

      if (aVal < bVal) return sortOrder.value === "asc" ? -1 : 1
      if (aVal > bVal) return sortOrder.value === "asc" ? 1 : -1
      return 0
    })
  }

  return data
})

function handleDelete(idPenggantian: string) {
  selectedId.value = idPenggantian
  showDeleteModal.value = true
}

async function confirmDelete() {

  if (!selectedId.value) return

  try {

    await store.deletePengajuan(selectedId.value)

    toastStore.success(
      "Success",
      "Pengajuan berhasil dihapus"
    )

  } catch (err: any) {

    toastStore.error(
      "Error",
      err.message || "Gagal menghapus pengajuan"
    )

  } finally {

    showDeleteModal.value = false
    selectedId.value = null

  }
}
function canEditDelete(status: string) {
  return status === "DIAJUKAN"
}
</script>

<template>
  <main class="page">
    <h1 class="title">Pengajuan Penggantian Barang Rusak</h1>

    <div class="filter-card mb-20">
      <h3 class="filter-title">Filter Pengajuan</h3>

      <div class="filter-grid">

        <div class="filter-item">
          <label class="filter-label">Status</label>

          <div class="custom-select">
            <select v-model="statusFilter">
              <option
                v-for="st in statuses"
                :key="st.value"
                :value="st.value"
              >
                {{ st.label }}
              </option>
            </select>

            <ChevronDown class="select-icon"/>
          </div>
        </div>

        <div class="filter-item flex-grow">
          <label class="filter-label">Cari</label>

          <div class="search-box">
            <SearchIcon class="search-icon"/>

            <input
              v-model="q"
              type="text"
              placeholder="Cari nama barang atau merk"
              @keyup.enter="handleApplyFilter"
            />
          </div>
        </div>

      </div>

      <div class="filter-actions">
        <button @click="handleApplyFilter" class="btn-apply">
          Terapkan Filter
        </button>

        <button @click="handleReset" class="btn-reset">
          Reset
        </button>
      </div>
    </div>

     <div class="create-wrapper">
      <button
        @click="router.push('/penggantian/create')"
        class="btn-add"
      >
        <Plus class="w-5 h-5"/> Buat Pengajuan
      </button>
    </div>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th @click="sortBy('namaBarang')" class="sortable">
              Nama Barang
            </th>

            <th>Merk</th>

            <th>Contoh Gambar</th>

            <th>Qty</th>

            <th @click="sortBy('tanggal')" class="sortable">
              Tanggal
            </th>

            <th>Keterangan</th>

            <th @click="sortBy('status')" class="sortable">
              Status
            </th>

            <th class="center">
              Aksi
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in tableRows" :key="row.idPenggantian">

            <td class="bold">
              {{ row.namaBarang }}
            </td>

            <td>
              {{ row.merk }}
            </td>

            <td>
              <div class="img-box">
                <img :src="`https://inventra-dd-be.onrender.com/uploads/contoh-gambar/${row.gambar}`" />
              </div>
            </td>

            <td class="center">
              {{ row.qty }}
            </td>

            <td>
              {{ formatDate(row.tanggal) }}
            </td>

            <td>
              {{ row.keterangan }}
            </td>

            <td>
              <div class="alasan-wrapper">
                <div class="status-main">
                  <span :class="['badge', getStatusClass(row.status)]">
                  {{ formatStatus(row.status) }}
                </span>
                </div>
                <div v-if="row.status !== 'DIAJUKAN'" class="reviewer-info">
                  Alasan: <span class="highlight">{{ row.alasan }}</span>
                </div>
              </div>
            </td>

            <td class="center">
              <div v-if="canEditDelete(row.status)" class="action-buttons">

                <button
                  class="btn-circle edit-btn"
                  @click="router.push(`/penggantian/edit/${row.idPenggantian}`)"
                >
                  <Pencil size="14"/>
                </button>

                <button
                  class="btn-circle delete-btn"
                  @click="handleDelete(row.idPenggantian)"
                >
                  <Trash2 size="14"/>
                </button>

              </div>

              <span v-else class="no-action-text">
                Tidak ada aksi
              </span>
            </td>

          </tr>

          <tr v-if="tableRows.length === 0">
            <td colspan="8" class="empty">
              Tidak ada data ditemukan
            </td>
          </tr>
          </tbody>
      </table>
    </div>
  </main>
  <ConfirmationModal
    :show="showDeleteModal"
    title="Konfirmasi Penghapusan Pengajuan Penggantian Barang Rusak"
    message="Apakah Anda yakin ingin menghapus pengajuan ini?"
    confirm-text="Ya, Hapus"
    cancel-text="Batal"
    type="danger"
    @confirm="confirmDelete"
    @cancel="showDeleteModal = false"
  />
</template>


<style scoped>
.page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
}

.filter-card {
  background: white;
  padding: 24px 28px 20px;
  border-radius: 16px;
  border: 1px solid #eeeeee;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.filter-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #111827;
}

.filter-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-item.flex-grow {
  flex: 1;
  min-width: 240px;
}

.filter-label {
  font-size: 12px;
  color: #374151;
  margin-bottom: 8px;
  font-weight: 500;
}


.custom-select {
  position: relative;
  min-width: 220px;
}

.custom-select select {
  width: 100%;
  padding: 11px 40px 11px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  outline: none;
  appearance: none;
  color: #111827;
  cursor: pointer;
}

.custom-select select:focus {
  border-color: rgba(0, 88, 143, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 88, 143, 0.1);
}

.placeholder-color {
  color: #9ca3af !important;
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  pointer-events: none;
  color: #6b7280;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 11px 16px 11px 40px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  color: #111827;
  box-sizing: border-box;
}

.search-box input:focus {
  border-color: rgba(0, 88, 143, 0.5);
  box-shadow: 0 0 0 3px rgba(0, 88, 143, 0.1);
}

.search-box input::placeholder {
  color: #9ca3af;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.btn-apply {
  background-color: #00588f;
  color: white;
  padding: 10px 28px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 88, 143, 0.2);
  transition: background 0.2s;
}

.btn-apply:hover {
  background-color: #004a78;
}

.btn-reset {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 10px 28px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-reset:hover {
  background-color: #f9fafb;
}

.table-wrapper {
  background: white;
  border-radius: 12px;
  border: 1px solid #eeeeee;
  overflow-x: auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

table {
  width: 100%;
  min-width: 1000px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

thead {
  background: #00588f;
  color: white;
}

th {
  font-weight: 500;
  font-size: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  text-align: center;
  cursor: pointer;
}

td {
  font-weight: 400;
  font-size: 12px;
  padding: 14px 12px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.5;
  vertical-align: middle;
}

tbody tr:hover {
  background-color: #f0f7ff;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.img-box {
  width: 80px;
  height: 60px;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid #eee;
}

.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bold {
  font-weight: 600;
}

.center {
  text-align: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.6px;
}

.status-diajukan { background: #F8FDD0; color: #9C9A23; }
.status-disetujui   { background: #ecf8fd; color: #1fa2ff; }
.status-ditolak  { background: #fbe5e6; color: #dc3545; }

.alasan-wrapper { display: flex; flex-direction: column; min-height: 40px; }

.alasan-main    { margin-bottom: 16px; word-break: normal; }

.empty {
  text-align: center;
  padding: 20px;
  color: #777;
}

.th-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-circle {
  width: 30px;
  height: 30px;
  min-width: 30px;
  min-height: 30px;
  border-radius: 50%;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}

.edit-btn   {
  background: #00588f;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.edit-btn:hover  {
  background: #244d7a;
  transform: translateY(-1px);
}

.btn-add {
  background-color: #00588f;
  color: white;
  padding: 12px 24px;
  border-radius: 40px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 88, 143, 0.2);
  transition: background 0.2s;
}

.btn-add:hover {
  background-color: #004a78;
}

.create-wrapper{
  display:flex;
  justify-content:flex-end;
  margin-bottom:24px;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.no-action-text {
  color: #9ca3af;
  font-size: 11px;
  font-style: italic;
}

.sortable { cursor: pointer; user-select: none; }

.sort-icon { flex: 0 0 auto; font-size: 12px; transition: 0.2s ease; }
.unsorted  { color: #cbd5e1; }
.active-sort { color: #ffffff; }

.status-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 40px; }

.status-main    {
  margin-bottom: 16px;
  word-break: normal;
}
.date-column span {
  display: block;
  max-width: 100%;
  word-break: normal;
}

.reviewer-info {
  font-size: 10px;
  color: #64748b;
  font-style: italic;
  border-top: 1px dashed #e2e8f0;
  padding-top: 4px;
  line-height: 1.4;
}

.highlight { font-weight: 600; color: #00588f; }

.pengaju-wrapper { display: flex; flex-direction: column; gap: 2px; }
.role-text { font-size: 10px; color: #94a3b8; font-weight: 400; text-transform: uppercase; }

th:nth-child(1), td:nth-child(1) { width: 160px; }
th:nth-child(2), td:nth-child(2) { width: 120px; }
th:nth-child(3), td:nth-child(3) { width: 100px; }
th:nth-child(4), td:nth-child(4) { width: 70px; }
th:nth-child(5), td:nth-child(5) { width: 110px; }
th:nth-child(6), td:nth-child(6) { width: 220px; }
th:nth-child(7), td:nth-child(7) { width: 120px; }
th:nth-child(8), td:nth-child(8) { width: 90px; }

</style>
