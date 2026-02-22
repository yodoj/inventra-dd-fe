<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const profile = computed(() => authStore.user);
const isSiswa = computed(() => {
  return authStore.user?.role === 'SISWA' || authStore.user?.role === 'siswa';
});

const initials = computed(() => {
  if (!profile.value?.name) return '';
  return profile.value.name
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();
});

const handleEditClick = () => {
  console.log('Edit profile clicked');
};
</script>

<template>
  <div class="profile-page" v-if="profile">
    <div class="profile-layout">

      <!-- LEFT CARD -->
      <div class="left-card">
        <div class="avatar">{{ initials }}</div>
        <h2 class="user-name">{{ profile.name }}</h2>
        <p class="user-email">{{ profile.email }}</p>

        <div class="badges">
          <span class="badge">
            <img src="@/assets/icon_role.png" alt="role" class="badge-icon" />
            {{ profile.role }}
          </span>
          <span v-if="profile.unit" class="badge">
            <img src="@/assets/icon_unit.png" alt="unit" class="badge-icon" />
            {{ profile.unit }}
          </span>
        </div>
      </div>

      <!-- RIGHT CARD -->
      <div class="right-card">
        <div class="info-header">
          <h3 class="info-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Informasi Diri
          </h3>
          <button @click="handleEditClick" class="edit-btn" title="Edit Profile">
            <img src="@/assets/button_edit_profile.png" alt="Edit" class="edit-icon" />
          </button>
        </div>

        <div class="info-list">

          <!-- NISN hanya untuk Siswa, ditampilkan pertama -->
          <div v-if="isSiswa" class="info-row">
            <span class="info-label">NISN</span>
            <span class="info-value">{{ profile.nisn }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">{{ profile.email }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">Nama Lengkap</span>
            <span class="info-value">{{ profile.name }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">Role</span>
            <span class="info-value">{{ profile.role }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">Unit</span>
            <span class="info-value">{{ profile.unit }}</span>
          </div>

          <!-- Kelas hanya untuk Siswa -->
          <div v-if="isSiswa" class="info-row">
            <span class="info-label">Kelas</span>
            <span class="info-value">{{ profile.kelas }}</span>
          </div>

          <div v-if="profile.phoneNumber" class="info-row">
            <span class="info-label">No Telepon</span>
            <span class="info-value">{{ profile.phoneNumber }}</span>
          </div>

          <div class="info-row no-border">
            <span class="info-label">Password</span>
            <span class="info-value password-dots">••••••••••••</span>
          </div>

        </div>
      </div>

    </div>
  </div>

  <!-- Loading state -->
  <div v-else class="loading-state">
    <p>Belum login</p>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 40px 24px;
}

.profile-layout {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* ── LEFT CARD ── */
.left-card {
  width: 280px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #1565a8 0%, #0d3f72 100%);
  border-radius: 16px;
  padding: 40px 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: white;
  box-shadow: 0 4px 20px rgba(13, 63, 114, 0.25);
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #E0ECFF;
  color: #1565a8;
  font-size: 48px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 8px;
}

.user-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  text-align: center;
  color: #fff;
}

.user-email {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 12px;
  text-align: center;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 4px;
}

.badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #E0ECFF;
  border: none;
  color: #1565a8;
  font-size: 13px;
  font-weight: 500;
  padding: 7px 16px;
  border-radius: 999px;
}

.badge-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: brightness(0) saturate(100%) invert(28%) sepia(60%) saturate(800%) hue-rotate(190deg);
}

/* ── RIGHT CARD ── */
.right-card {
  flex: 1;
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.info-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.edit-btn {
  background: #1565a8;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.edit-btn:hover {
  background: #0d3f72;
}

.edit-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

/* Info rows */
.info-list {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row.no-border {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  font-weight: 700;
  color: #333;
}

.info-value {
  font-size: 14px;
  color: #555;
  font-weight: 400;
}

.password-dots {
  font-size: 16px;
  letter-spacing: 2px;
  color: #888;
}

/* Loading */
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  color: #666;
}

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .profile-layout {
    flex-direction: column;
    align-items: stretch;
  }

  .left-card {
    width: 100%;
  }

  .right-card {
    padding: 24px 20px;
  }
}
</style>