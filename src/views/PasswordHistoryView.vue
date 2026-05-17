<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ArrowLeft } from 'lucide-vue-next';
import api from '@/services/api';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

interface PasswordHistoryItem {
  changed_at: string;
  changed_by_full_name: string;
  changed_by_role: string;
}

const historyList = ref<PasswordHistoryItem[]>([]);
const isLoading = ref(false);
const accessDenied = ref(false);
const sortOrder = ref<'asc' | 'desc'>('desc'); // Default: newest first

const allowedRoles = ['SARPRAS', 'ADMIN', 'SISWA', 'GURU', 'KEPSEK', 'YAYASAN'];

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const getKeteranganLabel = (item: PasswordHistoryItem): string => {
  const actor = item.changed_by_full_name === authStore.user?.name ? 'Anda' : item.changed_by_full_name;
  return `Password diubah oleh ${actor}`;
};

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  // Sort the list
  historyList.value.sort((a, b) => {
    const dateA = new Date(a.changed_at);
    const dateB = new Date(b.changed_at);
    return sortOrder.value === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
  });
};

const fetchPasswordHistory = async () => {
  if (!authStore.token) {
    router.push('/login');
    return;
  }

  const userRole = authStore.user?.role;
  if (!userRole) {
    router.push('/login');
    return;
  }
  if (!allowedRoles.includes(userRole)) {
    accessDenied.value = true;
    return;
  }

  isLoading.value = true;
  try {
    const targetUserId = route.query.userId as string | undefined;
    const url = targetUserId
      ? `/api/profile/password-history?userId=${targetUserId}`
      : '/api/profile/password-history';
    const response = await api.get(url);
    historyList.value = response.data.data || [];
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number } };
    if (axiosErr.response?.status === 403) {
      accessDenied.value = true;
    }
    // 401 is already handled by api interceptor
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchPasswordHistory();
});
</script>

<template>
  <div class="history-page">

    <!-- Access Denied -->
    <div v-if="accessDenied" class="access-denied-card">
      <div class="access-denied-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      </div>
      <h2 class="access-denied-title">Akses Ditolak</h2>
      <p class="access-denied-desc">Anda tidak memiliki hak akses untuk melihat halaman ini.</p>
      <button class="btn-back-home" @click="router.push('/profile')">Kembali ke Profil</button>
    </div>

    <!-- Loading -->
    <div v-else-if="isLoading" class="loading-state">
      <p>Memuat riwayat perubahan password...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="history-container">

      <!-- Back Button -->
      <button @click="() => router.back()" class="back-btn" title="Kembali">
        <ArrowLeft :size="20" color="white" />
      </button>

      <!-- Title -->
      <h1 class="page-title">Riwayat Perubahan Password</h1>

      <!-- Empty State -->
      <div v-if="historyList.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <p class="empty-state-text">Belum ada riwayat perubahan password</p>
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper">
        <table class="history-table">
          <thead>
            <tr>
              <th class="col-date">
                <div class="header-content">
                  <span>Tanggal Pengubahan</span>
                  <button class="sort-btn" @click="toggleSort" :class="{ 'sort-ascending': sortOrder === 'asc', 'sort-descending': sortOrder === 'desc' }" :title="`Urutkan (${sortOrder === 'asc' ? 'Terlama' : 'Terbaru'} dulu)`">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <polyline points="19 12 12 19 5 12"/>
                    </svg>
                  </button>
                </div>
              </th>
              <th class="col-keterangan">Keterangan</th>
              <th class="col-role">Role</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in historyList" :key="index">
              <td class="col-date">{{ formatDate(item.changed_at) }}</td>
              <td class="col-keterangan">{{ getKeteranganLabel(item) }}</td>
              <td class="col-role">
                <span class="role-badge">{{ item.changed_by_role }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

  </div>
</template>

<style scoped>
.history-page {
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ── BACK BUTTON ── */
.back-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #00588f;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 4px 14px rgba(0, 88, 143, 0.35);
  transition: background-color 0.2s, transform 0.2s;
}

.back-btn:hover {
  background-color: #004d7a;
  transform: scale(1.05);
}

/* ── PAGE TITLE ── */
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 32px 0;
  text-align: left;
  align-self: stretch;
}

/* ── CONTAINER ── */
.history-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* ── TABLE WRAPPER ── */
.table-wrapper {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* ── TABLE ── */
.history-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

/* ── TABLE HEADER ── */
.history-table thead {
  background-color: #00588f;
}

.history-table thead tr {
  border: none;
}

.history-table th {
  padding: 14px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  border: 1px solid #004a73;
}

.col-date {
  width: 15%;
}
.col-keterangan {
  width: 60%;
}
.col-role {
  width: 25%;
}

/* ── HEADER CONTENT WITH SORT ── */
.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.sort-btn:hover {
  opacity: 0.8;
}

.sort-btn svg {
  transition: transform 0.3s ease;
}

.sort-btn.sort-ascending svg {
  transform: rotate(180deg);
}

.sort-btn.sort-descending svg {
  transform: rotate(0deg);
}

/* ── TABLE BODY ── */
.history-table tbody tr {
  border-bottom: 1px solid #e8e8e8;
  transition: background-color 0.2s;
}

.history-table tbody tr:hover {
  background-color: #f9f9f9;
}

.history-table td {
  padding: 16px;
  font-size: 13px;
  color: #333;
  border-right: 1px solid #e8e8e8;
}

.history-table td:last-child {
  border-right: none;
}

/* ── ROLE BADGE ── */
.role-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #f0f2f5;
  color: #666;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

/* ── EMPTY STATE ── */
.empty-state {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #fff;
  color: #999;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.empty-state-text {
  font-size: 14px;
  color: #999;
  margin-top: 16px;
}

/* ── ACCESS DENIED ── */
.access-denied-card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 36px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}

.access-denied-icon {
  color: #e53e3e;
  margin-bottom: 8px;
}

.access-denied-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.access-denied-desc {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.btn-back-home {
  margin-top: 16px;
  padding: 12px 32px;
  background: #1565a8;
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}

.btn-back-home:hover {
  background: #0d3f72;
}

/* ── LOADING ── */
.loading-state {
  color: #666;
  font-size: 14px;
  text-align: center;
  padding: 40px;
}

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .history-page {
    padding: 20px 16px;
  }

  .page-title {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .history-table {
    font-size: 12px;
  }

  .history-table th,
  .history-table td {
    padding: 12px 8px;
  }

  .col-date {
    width: 20%;
  }
  .col-keterangan {
    width: 50%;
  }
  .col-role {
    width: 30%;
  }
}
</style>
