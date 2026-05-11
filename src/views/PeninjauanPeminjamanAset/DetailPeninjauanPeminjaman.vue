<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Edit} from 'lucide-vue-next';
import 'primeicons/primeicons.css';
// Store
import { useTinjauPeminjamanStore } from '@/stores/tinjauPeminjaman';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const route = useRoute();
const router = useRouter();
const store = useTinjauPeminjamanStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const idPeminjaman = route.params.idPeminjaman as string;

onMounted(async () => {
  try {
    if (idPeminjaman) {
      await store.fetchByPeminjamanId(idPeminjaman);
    }
  } catch (err) {
    toastStore.error('Error', 'Gagal memuat detail peninjauan');
    router.push('/peminjaman');
  }
});

const formattedAset = computed(() => {
  if (!store.current) return '-';
  const { kode_aset, nama_aset, merk_aset } = store.current;
  return merk_aset ? `${kode_aset} - ${nama_aset} - ${merk_aset}` : `${kode_aset} - ${nama_aset}`;
});

const getDateOnly = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const rawDate = dateStr.replace('T', ' ').split(' ')[0];
  const [year, month, day] = rawDate.split('-');
  
  return `${day}-${month}-${year}`;
};

const getTimeOnly = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const clean = dateStr.replace('T', ' ').split(' ')[1] || "";
  return clean.substring(0, 5); 
};

const isAlreadyReviewed = computed(() => store.current?.status_peminjaman !== 'DIAJUKAN');

const getStatusClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'DIAJUKAN': return 'status-diajukan';
    case 'DISETUJUI': return 'status-disetujui';
    case 'DITOLAK': return 'status-ditolak';
    default: return '';
  }
};

const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  const date = getDateOnly(dateStr);
  const time = getTimeOnly(dateStr);
  return `${date} | ${time}`;
};

const isPastPeminjaman = computed(() => {
  if (!store.current?.waktu_peminjaman) return false;
  return new Date() > new Date(store.current.waktu_peminjaman);
});
</script>

<template>
  <div class="page">
    <div class="container py-32">
      <div class="mb-32">
        <h1 class="h2-headline">Detail Peninjauan Peminjaman Aset</h1>
      </div>

      <div v-if="store.isLoading" class="text-center py-20">
        <p>Memuat data detail...</p>
      </div>

      <div v-else-if="store.current" class="main-card card-shadow">
        
        <div class="card-header-flex">
          <h3 class="section-subtitle">Informasi Peminjaman</h3>
          
          <div class="header-right-group">
            <span :class="['badge-status-mini', getStatusClass(store.current.status_peminjaman)]">
              {{ store.current.status_peminjaman }}
            </span>
            
            <div class="header-actions">
              <button 
                v-if="!isAlreadyReviewed"
                @click="router.push(`/peminjaman/tinjau/create/${idPeminjaman}`)" 
                class="action-icon create-bg" 
                title="Tinjau Sekarang"
              >
                <i class="pi pi-comments" ></i>
              </button>
              
              <button 
                v-else-if="isAlreadyReviewed && !isPastPeminjaman"
                @click="router.push(`/peminjaman/tinjau/update/${idPeminjaman}`)" 
                class="action-icon edit-bg" 
                title="Ubah Peninjauan"
              >
                <Edit class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-grid-2-col">
            <div class="info-column">
              <div class="row-data">
                <span class="label">ID Peminjaman</span>
                <span class="value">: {{ store.current.id_peminjaman }}</span>
              </div>
              <div class="row-data">
                <span class="label">Aset</span>
                <span class="value">: {{ formattedAset }}</span>
              </div>
              <div class="row-data">
                <span class="label">Kuantitas</span>
                <span class="value">: {{ store.current.qty }}</span>
              </div>
              <div class="row-data">
                <span class="label">Nama Peminjam</span>
                <span class="value">: {{ store.current.nama_peminjam }}</span>
              </div>
              <div class="row-data">
                <span class="label">Role Peminjam</span>
                <span class="value">: {{ store.current.role_peminjam }}</span>
              </div>
            </div>

            <div class="info-column">
              <div class="row-data">
                <span class="label">Unit Peminjam</span>
                <span class="value">: {{ store.current.unit_asal }}</span>
              </div>
              <div class="row-data">
                <span class="label">Waktu Peminjaman</span>
                <span class="value">: {{ formatDateTime(store.current.waktu_peminjaman) }}</span>
              </div>
              <div class="row-data">
                <span class="label">Waktu Pengembalian</span>
                <span class="value">: {{ formatDateTime(store.current.waktu_pengembalian) }}</span>
              </div>
              <div class="row-data">
                <span class="label">Tujuan Peminjaman</span>
                <span class="value">: {{ store.current.tujuan_peminjaman }}</span>
              </div>
              <div v-if="authStore.userRole === 'ADMIN'" class="row-data">
                <span class="label">Unit Tujuan</span>
                <span class="value">: {{ store.current.unit_tujuan || '-' }}</span>
              </div>
              <div class="row-data">
                <span class="label">Waktu Pengajuan</span>
                <span class="value">: {{ formatDateTime(store.current.waktu_pengajuan) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="review-section">
          <h3 class="section-subtitle mb-reason">Informasi Peninjauan</h3>
          
          <div v-if="isAlreadyReviewed" class="reviewer-identity mb-6">
    <div class="row-data">
      <span class="label">Nama Peninjau</span>
      <span class="value">: {{ store.current.nama_peninjau || '-' }}</span>
    </div>
    <div class="row-data">
      <span class="label">Role Peninjau</span>
      <span class="value">: {{ store.current.role_peninjau }}</span>
    </div>
    <div class="row-data">
      <span class="label">Alasan</span>
      <span class="value">: </span>
    </div>
  </div>
          <div class="review-box">
            <p v-if="!isAlreadyReviewed" class="review-text italic">
              Belum ada review
            </p>
            <p v-else class="alasan-main">
              {{ store.current.alasan || 'Tidak ada alasan tambahan.' }}
            </p>
          </div>

          <div v-if="isAlreadyReviewed" class="reviewer-info">
            Terakhir direview oleh 
            <span class="highlight">
              {{ store.current.role_peninjau || 'Reviewer' }}
            </span> 
            pada 
            <span class="highlight">
              {{ getDateOnly(store.current.updatedAt) }}
            </span>
            pukul 
            <span class="highlight">
              {{ getTimeOnly(store.current.updatedAt) }}
            </span>
          </div>
        </div>

        <div class="card-footer-action">
          <button @click="router.push('/peminjaman')" class="btn-cancel-gray">
            Kembali
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { background-color: #FAFAFA; min-height: 100vh; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.py-32 { padding: 32px 0; }
.mb-32 { margin-bottom: 32px; }

.main-card { background: #FFFFFF; border-radius: 12px; padding: 40px; border: 1px solid #EEEEEE; }
.card-shadow { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

.card-header-flex { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 24px;
}

.header-right-group { display: flex; align-items: center; gap: 12px; }
.badge-status-mini { padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }

.action-icon {
  width: 36px; height: 36px; border-radius: 50%; border: none;
  display: flex; align-items: center; justify-content: center;
  color: white; cursor: pointer; transition: transform 0.2s;
}
.create-bg { background-color: #198754; }
.edit-bg { background-color: #00588F; }

.section-subtitle { font-size: 18px; font-weight: 700; color: #111111; margin: 0; }
.mb-reason { margin-bottom: 24px !important; }

.info-section { padding-top: 10px; }
.review-section { padding-top: 48px; } /* Jarak lebih luas ke bagian alasan */

.info-grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }

.row-data { display: flex; font-size: 14px; margin-bottom: 12px; line-height: 1.6; }
.label { min-width: 180px; font-weight: 700; color: #111111; }
.value { flex: 1; color: #374151; }

.review-box { 
  background-color: #F9FAFB; 
  border: 1px solid #E5E7EB; 
  border-radius: 8px; 
  padding: 24px; 
}

.alasan-main {
  font-size: 14px; 
  line-height: 1.5;
  color: #333;
  word-break: break-all; 
  white-space: pre-wrap;
}

.reviewer-info {
  font-size: 11px;
  color: #667085;
  font-style: italic;
  padding-top: 12px;
  line-height: 1.4;
  margin-top: 8px;
  border-top: 1px dashed #E2E8F0;
  display: inline-block;
  width: 100%;
}

.highlight {
  font-weight: 600;
  color: #00588F; 
}

.review-text.italic { font-style: italic; color: #667085; font-size: 14px; }

.card-footer-action { margin-top: 80px; } /* Lebih turun ke bawah lagi */

.btn-cancel-gray { 
  background-color: #F3F4F6; 
  padding: 12px 48px; 
  border-radius: 24px; 
  border: 1px solid #E5E7EB; 
  font-weight: 700; 
  color: #75777D;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.btn-cancel-gray:hover {
  background-color: #C1C3C6;
  color: #111111;
  border-color: #F2F4F5;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.status-diajukan { background-color: #F3F4F6; color: #4B5563; }
.status-disetujui { background-color: #ECFDF3; color: #065F46; }
.status-ditolak { background-color: #FEE2E2; color: #DC2626; }

@media (max-width: 860px) { 
  .info-grid-2-col { grid-template-columns: 1fr; } 
  .card-header-flex { flex-direction: column; align-items: flex-start; gap: 16px; } 
}
</style>