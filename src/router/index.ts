import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import LoginPage from '../views/LoginPage.vue'
import PengadaanAsetView from '@/views/PengadaanAset/PengadaanAsetView.vue';
import AddPengadaanAsetView from '@/views/PengadaanAset/AddPengadaanAsetView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LandingPage,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
    },
    {
      path: '/profile/edit',
      name: 'edit-profile',
      component: () => import('../views/EditProfileView.vue'),
    },
    {
      path: '/profile/change-password',
      name: 'change-password',
      component: () => import('../views/ChangePasswordView.vue'),
    },
    {
      path: '/assets/kelola',
      name: 'managed-assets',
      component: () => import('../views/MengelolaAset/ManagedAssetsView.vue'),
    },
    {
      path: '/assets/tambah-barang',
      name: 'add-asset-barang',
      component: () => import('../views/MengelolaAset/AddAssetBarangView.vue'),
    },
    {
      path: '/assets/tambah-ruangan',
      name: 'add-asset-ruangan',
      component: () => import('../views/MengelolaAset/AddAssetRuanganView.vue'),
    },
    {
      path: '/assets/ubah-barang/:id',
      name: 'update-asset-barang',
      component: () => import('../views/MengelolaAset/UpdateAssetBarangView.vue'),
    },
    {
      path: '/assets/ubah-ruangan/:id',
      name: 'update-asset-ruangan',
      component: () => import('../views/MengelolaAset/UpdateAssetRuanganView.vue'),
    },
    {
      path: '/pengadaan/pengajuan',
      name: 'pengadaan-list',
      component: PengadaanAsetView,
    },
    {
      path: '/pengadaan/ajukan-pengadaan',
      name: 'pengadaan-add',
      component: AddPengadaanAsetView,
    },
  ],
})

export default router
