import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import LoginPage from '../views/LoginPage.vue'

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
      path: '/pengadaan/tinjau/all',
      name: 'peninjauan-pengadaan-aset-all',
      component: () => import('../views/PeninjauanPengadaanAset/All.vue'),
    },
    {
      path: '/pengadaan/tinjau/PG0001',
      // path: '/pengadaan/tinjau/{kode_pengadaan}',
      name: 'peninjauan-pengadaan-aset-create-review',
      component: () => import('../views/PeninjauanPengadaanAset/CreateReview.vue'),
    },
    {
      path: '/assets/kelola',
      name: 'managed-assets',
      component: () => import('../views/ManagedAssetsView.vue'),
    },
    {
      path: '/assets/tambah-barang',
      name: 'add-asset-barang',
      component: () => import('../views/AddAssetBarangView.vue'),
    },
    {
      path: '/assets/tambah-ruangan',
      name: 'add-asset-ruangan',
      component: () => import('../views/AddAssetRuanganView.vue'),
    },
    {
      path: '/assets/ubah-barang/:id',
      name: 'update-asset-barang',
      component: () => import('../views/UpdateAssetBarangView.vue'),
    },
    {
      path: '/assets/ubah-ruangan/:id',
      name: 'update-asset-ruangan',
      component: () => import('../views/UpdateAssetRuanganView.vue'),
    },
    {
      path: '/pengadaan/bukti/PG0001',
      // path: '/pengadaan/bukti/{kode_pengadaan}',
      name: 'peninjauan-pengadaan-aset-buy-after-review',
      component: () => import('../views/PeninjauanPengadaanAset/BuyAfterReview.vue'),
    }
  ],
})

export default router
