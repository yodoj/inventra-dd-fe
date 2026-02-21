<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  Search, 
  ChevronDown, 
  User, 
  LogOut, 
  Settings,
  LayoutDashboard,
  FileText,
  PackageCheck,
  ClipboardCheck,
  RefreshCw,
  BarChart3,
  PieChart
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const searchQueries = ref('');
const isProfileOpen = ref(false);
const openDropdown = ref<string | null>(null);
let dropdownTimeout: number | null = null;

const handleMouseEnter = (name: string) => {
  if (dropdownTimeout) {
    clearTimeout(dropdownTimeout);
    dropdownTimeout = null;
  }
  openDropdown.value = name;
  isProfileOpen.value = false;
};

const handleMouseLeave = () => {
  dropdownTimeout = window.setTimeout(() => {
    openDropdown.value = null;
  }, 100); // 100ms buffer
};

const toggleProfile = () => {
  isProfileOpen.value = !isProfileOpen.value;
  openDropdown.value = null;
};

const protectedNavigate = (path: string) => {
  if (authStore.isAuthenticated) {
    router.push(path);
  } else {
    router.push('/login');
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const closeAll = (e: MouseEvent) => {
  if (!(e.target as HTMLElement).closest('.nav-item-dropdown') && 
      !(e.target as HTMLElement).closest('.profile-section')) {
    openDropdown.value = null;
    isProfileOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('click', closeAll);
});

onUnmounted(() => {
  window.removeEventListener('click', closeAll);
});

const isAdminOrSarpras = () => {
  return ['ADMIN', 'SARPRAS'].includes(authStore.userRole || '');
};

const isSarpras = () => {
  return authStore.userRole === 'SARPRAS';
};
</script>

<template>
  <nav class="navbar">
    <div class="container navbar-content">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <img src="@/assets/logo-inventra.png" alt="Inventra Logo" />
      </router-link>

      <!-- Navigation Links -->
      <div class="nav-links">
        <router-link to="/" class="nav-item" :class="{ active: route.path === '/' }">
          Home
          <div v-if="route.path === '/'" class="active-indicator"></div>
        </router-link>

        <!-- Manajemen Aset -->
        <div 
          class="nav-item-dropdown"
          @mouseenter="handleMouseEnter('aset')"
          @mouseleave="handleMouseLeave"
        >
          <div 
            class="nav-item" 
            :class="{ active: openDropdown === 'aset' || route.path.startsWith('/assets') }"
          >
            Manajemen Aset <ChevronDown class="icon-xs" />
            <div v-if="openDropdown === 'aset' || route.path.startsWith('/assets')" class="active-indicator"></div>
          </div>
          <div v-if="openDropdown === 'aset'" class="dropdown-menu fade-in">
            <div @click="protectedNavigate('/assets/kelola')" class="dropdown-item" style="cursor: pointer;">
              <PackageCheck class="icon-sm" /> Mengelola Aset
            </div>
            <template v-if="isAdminOrSarpras()">
              <div @click="protectedNavigate('/assets/laporan')" class="dropdown-item" style="cursor: pointer;">
                <FileText class="icon-sm" /> Laporan Utilisasi Aset
              </div>
              <div @click="protectedNavigate('/assets/dashboard')" class="dropdown-item" style="cursor: pointer;">
                <LayoutDashboard class="icon-sm" /> Dashboard Utilisasi Aset
              </div>
            </template>
          </div>
        </div>

        <div 
          class="nav-item" 
          :class="{ active: route.path.startsWith('/peminjaman') }"
          @click="protectedNavigate('/peminjaman')"
        >
          Peminjaman Aset
          <div v-if="route.path.startsWith('/peminjaman')" class="active-indicator"></div>
        </div>

        <!-- Pengadaan Aset -->
        <div 
          class="nav-item-dropdown"
          @mouseenter="handleMouseEnter('pengadaan')"
          @mouseleave="handleMouseLeave"
        >
          <div 
            class="nav-item" 
            :class="{ active: openDropdown === 'pengadaan' || route.path.startsWith('/pengadaan') }"
          >
            Pengadaan Aset <ChevronDown class="icon-xs" />
            <div v-if="openDropdown === 'pengadaan' || route.path.startsWith('/pengadaan')" class="active-indicator"></div>
          </div>
          <div v-if="openDropdown === 'pengadaan'" class="dropdown-menu fade-in">
            <div @click="protectedNavigate('/pengadaan/pengajuan')" class="dropdown-item" style="cursor: pointer;">
              <ClipboardCheck class="icon-sm" /> Pengajuan Pengadaan Aset
            </div>
            <div @click="protectedNavigate('/pengadaan/rusak')" class="dropdown-item" style="cursor: pointer;">
              <RefreshCw class="icon-sm" /> Penggantian Barang Rusak
            </div>
            <template v-if="isAdminOrSarpras()">
              <div @click="protectedNavigate('/pengadaan/laporan')" class="dropdown-item" style="cursor: pointer;">
                <BarChart3 class="icon-sm" /> Laporan Pengadaan Aset
              </div>
              <div @click="protectedNavigate('/pengadaan/dashboard')" class="dropdown-item" style="cursor: pointer;">
                <PieChart class="icon-sm" /> Dashboard Pengadaan Aset
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Right Actions -->
      <div class="nav-actions">
        <div class="search-bar">
          <Search class="search-icon" />
          <input type="text" placeholder="Search" v-model="searchQueries" />
        </div>

        <!-- Auth Section -->
        <div v-if="authStore.isAuthenticated" class="profile-section">
          <button @click.stop="toggleProfile" class="profile-trigger">
            <div class="avatar">
              <img src="@/assets/avatar-icon.png" alt="User Avatar" />
            </div>
          </button>
          
          <div v-if="isProfileOpen" class="profile-dropdown fade-in">
            <div class="user-info">
              <p class="user-name">{{ authStore.userName }}</p>
              <p class="user-role">{{ authStore.userRole }}</p>
            </div>
            <div class="divider"></div>
            <a href="#" class="dropdown-item">
              <User class="icon-sm" /> My Profile
            </a>
            <a v-if="isSarpras()" href="#" class="dropdown-item">
              <Settings class="icon-sm" /> Pengelolaan Profile
            </a>
            <button @click="handleLogout" class="dropdown-item logout-btn">
              <LogOut class="icon-sm" /> Logout
            </button>
          </div>
        </div>

        <router-link v-else to="/login" class="btn-login">
          Login
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  height: 80px;
  background: var(--white);
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.logo img {
  height: 45px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-text span {
  font-weight: 800;
  font-size: 1.2rem;
  color: var(--primary-blue);
  letter-spacing: 1px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-item {
  position: relative;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  background: none;
  border: none;
  padding: 8px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s;
  font-size: 0.95rem;
}

.nav-item:hover, .nav-item.active {
  color: var(--primary-main);
}

.active-indicator {
  position: absolute;
  top: -20px; 
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--primary-main);
  border-radius: 0 0 4px 4px;
}

.nav-item-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--white);
  min-width: 240px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  padding: 8px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
}

/* Pseudo-element to bridge the gap and prevent mouseleave */
.dropdown-menu::before {
  content: "";
  position: absolute;
  top: -15px; 
  left: 0;
  width: 100%;
  height: 15px;
  background: transparent;
}

.dropdown-item {
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #F0F9FF; /* light blue tint */
  color: var(--primary-main);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--text-secondary);
  width: 18px;
}

.search-bar input {
  background: var(--gray-100);
  border: none;
  padding: 10px 12px 10px 40px;
  border-radius: 20px;
  width: 200px;
  font-size: 0.9rem;
  transition: width 0.3s, background 0.3s;
}

.search-bar input:focus {
  width: 280px;
  background: var(--gray-200);
  outline: none;
}

.profile-section {
  position: relative;
}

.profile-trigger {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--light-blue);
  background: #f0f0f0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--white);
  min-width: 220px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  padding: 8px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
}

.user-info {
  padding: 12px 16px;
}

.user-name {
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.user-role {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.divider {
  height: 1px;
  background: var(--gray-200);
  margin: 4px 0;
}

.logout-btn {
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  color: #D32F2F;
}

.logout-btn:hover {
  background: #FFEBEE;
  color: #D32F2F;
}

.btn-login {
  background: var(--primary-main);
  color: var(--white);
  padding: 10px 36px;
  border-radius: 40px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.2s, background-color 0.3s, box-shadow 0.3s;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-login:hover {
  background-color: var(--primary-700);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(31, 162, 255, 0.2);
}

.icon-xs { width: 14px; height: 14px; }
.icon-sm { width: 18px; height: 18px; }

@media (max-width: 1024px) {
  .nav-links { gap: 16px; }
  .search-bar input { width: 120px; }
  .search-bar input:focus { width: 180px; }
}
</style>
