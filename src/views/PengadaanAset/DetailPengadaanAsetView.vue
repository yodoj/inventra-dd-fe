<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { EditIcon, Trash2 } from 'lucide-vue-next';


import defaultImage from '@/assets/no-image.png';

// Store import
import { usePengadaanStore } from '@/stores/pengadaanAset';
import { useToastStore } from '@/stores/toast';
import { useAuthStore } from '@/stores/auth';

// Component Import
import ConfirmationModal from '@/components/ConfirmationModal.vue';
import { API_BASE_URL } from '@/services/api';

const route = useRoute();
const router = useRouter();
const pengadaanStore = usePengadaanStore();
const toastStore = useToastStore();
const authStore = useAuthStore();

const id_pengadaan = route.params.idPengadaan as string;
const pengadaan = ref<any>(null);
const showDeleteModal = ref(false);
const isDeleting = ref(false);

// Mengecek apakah role user diperbolehkan melihat detail pengadaan
const isAuthorized = computed(() => {
  return authStore && ['ADMIN', 'SARPRAS', 'GURU'].includes(authStore.userRole || '');
});

// Mengecek apakah status pengadaan memungkinkan untuk diedit atau dihapus dan merupakan milik user
const canEditDelete = computed(() => {
  const status = pengadaan.value?.status_pengadaan?.toUpperCase();
  const isStatusValid = ['DIAJUKAN', 'DITOLAK'].includes(status);
  const isOwner = authStore.user?.id && pengadaan.value?.user_id && authStore.user.id === pengadaan.value.user_id;
  return isStatusValid && isOwner;
});

onMounted(async () => {
  try {
    // Mengambil data detail berdasarkan ID dari URL parameter
    pengadaan.value = await pengadaanStore.fetchPengadaanById(id_pengadaan);
  } catch (err) {
    toastStore.error('Error', 'Gagal memuat detail pengadaan');
    router.push('/pengadaan/pengajuan');
  }
});

// Fungsi untuk menentukan kelas CSS berdasarkan status pengadaan
const getStatusClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'DIAJUKAN': return 'status-diajukan';
    case 'DITOLAK': return 'status-ditolak';
    case 'DISETUJUI_KEPSEK': return 'status-setuju-kepsek';
    case 'DISETUJUI_YAYASAN': return 'status-setuju-yayasan';
    case 'DIBELI': return 'status-dibeli';
    default: return '';
  }
};

// Fungsi untuk menangani error saat memuat gambar, mengganti dengan gambar default
const onImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (target) {
    target.src = defaultImage;
  }
};

const getFullImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    return API_BASE_URL + url;
  }
  return url;
};

// Fungsi untuk memformat teks status agar lebih mudah dibaca
const formatDisplay = (text: string) => {
  return text?.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Fungsi untuk memformat tanggal dan waktu dengan format yang lebih user-friendly
const formatDateTimeDetail = (dateStr: string) => {
  if (!dateStr) return "-";
  const cleanVal = dateStr.replace('T', ' ');
  const [datePart, timePart] = cleanVal.split(' ');
  
  if (!datePart) return "-";
  
  const [y, m, d] = datePart.split('-');
  const formattedDate = y && m && d ? `${d}-${m}-${y}` : datePart;
  
  let formattedTime = '';
  if (timePart) {
    const timeParts = timePart.split(':');
    formattedTime = timeParts.length >= 2 ? `${timeParts[0]}:${timeParts[1]}` : timePart;
  }
  
  return formattedTime ? `${formattedDate} | ${formattedTime}` : formattedDate;
};

// Fungsi untuk memformat tanggal dengan format yang lebih user-friendly
const formatDateOnly = (dateStr: string) => {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split('-');
  return y && m && d ? `${d}-${m}-${y}` : dateStr;
};

// Fungsi untuk menangani penghapusan pengadaan
const handleDelete = async () => {
  if (!id_pengadaan) return;
  isDeleting.value = true;
  try {
    await pengadaanStore.deletePengadaan(id_pengadaan);
    toastStore.success('Berhasil', 'Pengajuan pengadaan berhasil dihapus');
    showDeleteModal.value = false;
    router.push('/pengadaan/pengajuan');
  } catch (err: any) {
    toastStore.error('Gagal', err.response?.data?.message || 'Gagal menghapus data');
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <div v-if="isAuthorized" class="detail-pengadaan-page">
    <div class="container py-32">
      <div class="header-page-wrapper">
        <h1 class="h2-headline">Detail Pengajuan Pengadaan Aset</h1>
      </div>

      <div v-if="pengadaanStore.isLoading" class="text-center py-20">
        <p>Memuat data detail...</p>
      </div>

      <div v-else-if="pengadaan" class="main-card shadow-lg">
        
        <div class="card-header-container">
          <div class="header-left">
            <h2 class="asset-display-title">
              {{ pengadaan.nama_aset }}
            </h2>
          </div>
          
          <div class="header-right-group">
            <span :class="['badge-status-mini', getStatusClass(pengadaan.status_pengadaan)]">
              {{ formatDisplay(pengadaan.status_pengadaan) }}
            </span>
            
            <div v-if="canEditDelete" class="header-actions">
              <button @click="router.push(`/pengadaan/pengajuan/update/${id_pengadaan}`)" class="action-icon edit-bg" title="Ubah">
                <EditIcon class="w-4 h-4" />
              </button>
              <button @click="showDeleteModal = true" class="action-icon delete-bg" title="Hapus">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="image-showcase">
          <img 
            :src="getFullImageUrl(pengadaan.link_gambar) || defaultImage" 
            @error="onImageError"
            :alt="pengadaan.nama_aset" 
            class="asset-img-large" 
          />
        </div>

        <div class="info-section">
          <h3 class="section-subtitle">Informasi Pengadaan</h3>
          
          <div class="info-grid-2-col">
            <div class="info-column">
              <div class="row-data">
                <span class="label">ID Pengadaan</span>
                <span class="value">: {{ pengadaan.id_pengadaan }}</span>
              </div>
              <div class="row-data">
                <span class="label">Nama Aset</span>
                <span class="value">: {{ pengadaan.nama_aset }}</span>
              </div>
              <div class="row-data">
                <span class="label">Merk Aset</span>
                <span class="value">: {{ pengadaan.merk || '-' }}</span>
              </div>
              <div class="row-data">
                <span class="label">Kuantitas</span>
                <span class="value">: {{ pengadaan.qty }}</span>
              </div>
              <div v-if="authStore.userRole === 'ADMIN'" class="row-data">
                <span class="label">Nama Pengaju</span>
                <span class="value">: {{ pengadaan.nama_pengaju || '-' }}</span>
              </div>
              <div v-if="authStore.userRole === 'ADMIN'" class="row-data">
                <span class="label">Role Pengaju</span>
                <span class="value">: {{ pengadaan.role_pengaju || '-' }}</span>
              </div>
            </div>

            <div class="info-column">
              <div class="row-data">
                <span class="label">Waktu Pengajuan</span>
                <span class="value">: {{ formatDateTimeDetail(pengadaan.waktu_pengajuan) }}</span>
              </div>
              <div class="row-data">
                <span class="label">Estimasi Harga</span>
                <span class="value">: Rp{{ pengadaan.estimasi_harga?.toLocaleString('id-ID') }}</span>
              </div>
              <div class="row-data">
                <span class="label">Tanggal Pengadaan</span>
                <span class="value">: {{ formatDateOnly(pengadaan.tanggal_pengadaan) }}</span>
              </div>
              <div class="row-data">
                <span class="label">Unit</span>
                <span class="value">: {{ pengadaan.unit || '-' }}</span>
              </div>
              <div class="row-data">
                <span class="label">Kategori</span>
                <span class="value">: {{ formatDisplay(pengadaan.kategori) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="review-section mt-32">
          <h3 class="section-subtitle">Review Pengajuan</h3>
          <div class="review-box">
            <p v-if="pengadaan.status_pengadaan === 'DIAJUKAN'" class="review-text italic">
              Pengajuan pengadaan masih dalam tahap diajukan.
            </p>
            <p v-else-if="pengadaan.review_pengajuan" class="review-text">
              {{ pengadaan.review_pengajuan }}
            </p>
            <p v-else class="review-text italic">Belum ada catatan review.</p>
          </div>
        </div>

        <div class="card-footer-action">
          <button @click="router.push('/pengadaan/pengajuan')" class="btn-cancel-gray">
            Kembali
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="forbidden-simple-wrapper">
    <p class="forbidden-text">Anda tidak memiliki izin untuk mengakses halaman ini</p>
  </div>

  <ConfirmationModal
    :show="showDeleteModal"
    title="Konfirmasi Penghapusan Pengajuan Pengadaan"
    message="Apakah Anda yakin ingin menghapus pengajuan ini?"
    confirm-text="Ya, Hapus"
    cancel-text="Batal"
    type="danger"
    :is-loading="isDeleting"
    @confirm="handleDelete"
    @cancel="showDeleteModal = false"
  />
</template>

<style scoped>
.detail-pengadaan-page {
  background-color: #FAFAFA;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.py-32 {
  padding-top: 32px;
  padding-bottom: 48px;
}

.header-page-wrapper {
  margin-bottom: 32px;
}

.main-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 40px;
  border: 1px solid #EEEEEE;
}

.card-header-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-left {
  flex: 1;
}

.asset-display-title {
  font-size: 20px;
  font-weight: 700;
  color: #111111;
  line-height: 1.4;
  margin: 0;
}

.header-right-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
}

.action-icon:hover {
  transform: scale(1.1);
}

.edit-bg { background-color: #00588F; }
.delete-bg { background-color: #A93232; }

.badge-status-mini {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
}

.image-showcase {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 48px;
}

.asset-img-large {
  max-width: 400px;
  max-height: 280px;
  width: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.info-section {
  border-top: 1px solid #F0F0F0;
  padding-top: 32px;
}

.section-subtitle {
  font-size: 16px;
  font-weight: 700;
  color: #111111;
  margin-bottom: 24px;
}

.info-grid-2-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px; 
}

.row-data {
  display: flex;
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 8px;
}

.label {
  min-width: 160px; 
  color: #111111;
  font-weight: 400;
}

.value {
  flex: 1;
  color: #111111;
  font-weight: 400;
}

.review-section {
  border-top: 1px solid #F0F0F0;
  padding-top: 32px;
}

.review-box {
  background-color: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 24px;
  min-height: 80px;
}

.review-text {
  font-size: 14px;
  color: #111111;
  line-height: 1.5;
  word-break: break-word;
  overflow-wrap: break-word;
}

.card-footer-action {
  margin-top: 40px;
}

.btn-cancel-gray {
  background-color: #F3F4F6;
  color: #111111;
  padding: 10px 32px;
  border-radius: 24px;
  border: 1px solid #E5E7EB;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel-gray:hover {
  background-color: #E5E7EB;
}

.forbidden-simple-wrapper {
  padding-top: 150px; 
  text-align: center;
  width: 100%;
  min-height: 100vh;
  background-color: #FAFAFA; 
}

.forbidden-text {
  font-size: 16px;
  font-weight: 500;
  color: #000000; 
}

.status-diajukan {
  background-color: #F3F4F6;
  color: #4B5563;
}

.status-ditolak {
  background-color: #FEE2E2;
  color: #DC2626;
}

.status-setuju-kepsek {
  background-color: #ECF8FD;
  color: #1FA2FF;
  border: 1px solid #D1E9FF;
}

.status-setuju-yayasan {
  background-color: #FEF9C3;
  color: #A16207;
  border: 1px solid #FEF08A;
}

.status-dibeli {
  background-color: #ECFDF3;
  color: #065F46;
}

.mt-32 { margin-top: 32px; }
</style>