import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import LoginPage from '../views/LoginPage.vue'
import PengadaanAsetView from '@/views/PengadaanAset/PengadaanAsetView.vue';
import AddPengadaanAsetView from '@/views/PengadaanAset/AddPengadaanAsetView.vue';
import DetailPengadaanAsetView from '@/views/PengadaanAset/DetailPengadaanAsetView.vue';
import UpdatePengadaanAsetView from '@/views/PengadaanAset/UpdatePengadaanAsetView.vue';
import CreatePeninjauanPeminjaman from '@/views/PeninjauanPeminjamanAset/CreatePeninjauanPeminjaman.vue';
import UpdatePeninjauanPeminjaman from '@/views/PeninjauanPeminjamanAset/UpdatePeninjauanPeminjaman.vue';
import DetailPeninjauanPeminjaman from '@/views/PeninjauanPeminjamanAset/DetailPeninjauanPeminjaman.vue';
import { useAuthStore } from '@/stores/auth';
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
      meta: { roles: ['ALL'] }
    },
    {
      path: '/profile/edit',
      name: 'edit-profile',
      component: () => import('../views/EditProfileView.vue'),
      meta: { roles: ['ALL'] }
    },
    {
      path: '/profile/change-password',
      name: 'change-password',
      component: () => import('../views/ChangePasswordView.vue'),
      meta: { roles: ['ALL'] }
    },
    {
      path: '/profile/password-history',
      name: 'password-history',
      component: () => import('../views/PasswordHistoryView.vue'),
      meta: { roles: ['ALL'] }
    },
    {
      path: '/assets/kelola',
      name: 'managed-assets',
      component: () => import('../views/MengelolaAset/ManagedAssetsView.vue'),
      meta: { roles: ['ALL'] }
    },
    {
      path: '/assets/tambah-barang',
      name: 'add-asset-barang',
      component: () => import('../views/MengelolaAset/AddAssetBarangView.vue'),
      meta: { roles: ['SUPERADMIN', 'SARPRAS', 'YAYASAN'] }
    },
    {
      path: '/assets/tambah-ruangan',
      name: 'add-asset-ruangan',
      component: () => import('../views/MengelolaAset/AddAssetRuanganView.vue'),
      meta: { roles: ['SUPERADMIN', 'SARPRAS', 'YAYASAN'] }
    },
    {
      path: '/assets/ubah-barang/:id',
      name: 'update-asset-barang',
      component: () => import('../views/MengelolaAset/UpdateAssetBarangView.vue'),
      meta: { roles: ['SUPERADMIN', 'SARPRAS', 'YAYASAN'] }
    },
    {
      path: '/assets/ubah-ruangan/:id',
      name: 'update-asset-ruangan',
      component: () => import('../views/MengelolaAset/UpdateAssetRuanganView.vue'),
      meta: { roles: ['SUPERADMIN', 'SARPRAS', 'YAYASAN'] }
    },
    {
      path: '/pengadaan/pengajuan',
      name: 'pengadaan-list',
      component: PengadaanAsetView,
      meta: { roles: ['SUPERADMIN', 'GURU', 'SARPRAS'] }
    },
    {
      path: '/pengadaan/ajukan-pengadaan',
      name: 'pengadaan-add',
      component: AddPengadaanAsetView,
      meta: { roles: ['SUPERADMIN', 'GURU', 'SARPRAS'] }
    },
    {
      path: '/pengadaan/pengajuan/detail/:idPengadaan',
      name: 'pengadaan-detail',
      component: DetailPengadaanAsetView,
      meta: { roles: ['SUPERADMIN', 'GURU', 'SARPRAS'] }
    },
    {
      path: '/pengadaan/pengajuan/update/:idPengadaan',
      name: 'pengadaan-update',
      component: UpdatePengadaanAsetView,
      meta: { roles: ['SUPERADMIN', 'GURU', 'SARPRAS'] }
    },
    {
      path: '/pengadaan/bukti/:idPengadaan',
      name: 'peninjauan-pengadaan-aset-buy-after-review',
      component: () => import('../views/PeninjauanPengadaanAset/BuyAfterReview.vue'),
      meta: { roles: ['KEPSEK', 'YAYASAN', 'ADMIN'] }
    },
    {
      path: '/pengadaan/pengajuan/tinjau',
      name: 'peninjauan-pengadaan-aset-all',
      component: () => import('../views/PeninjauanPengadaanAset/TinjauAll.vue'),
      meta: { roles: ['KEPSEK', 'YAYASAN', 'ADMIN'] }
    },
    {
      path: '/pengadaan/pengajuan/tinjau/:pengadaanId',
      name: 'peninjauan-pengadaan-aset-create-review',
      component: () => import('../views/PeninjauanPengadaanAset/CreateReview.vue'),
      meta: { roles: ['KEPSEK', 'YAYASAN', 'ADMIN'] }
    },
    {
      path: '/pengadaan/pengajuan/tinjau/update/:pengadaanId',
      name: 'peninjauan-pengadaan-aset-update-review',
      component: () => import('../views/PeninjauanPengadaanAset/UpdateReview.vue'),
      meta: { roles: ['KEPSEK', 'YAYASAN', 'ADMIN'] }
    },
    {
      path: '/pengadaan/pengajuan/tinjau/bukti/:idPengadaan',
      name: 'peninjauan-pengadaan-aset-tinjau-bukti',
      component: () => import('../views/PeninjauanPengadaanAset/BuyAfterReview.vue'),
      meta: { roles: ['KEPSEK', 'YAYASAN', 'ADMIN'] }
    },
    {
      path: '/peminjaman',
      name: 'managed-peminjaman',
      component: () => import('../views/PeminjamanAset/ManagedPeminjamanView.vue'),
      meta: { roles: ['SUPERADMIN', 'SARPRAS', 'SISWA', 'GURU'] }
    },
    {
      path: '/peminjaman/tambah',
      name: 'add-peminjaman',
      component: () => import('../views/PeminjamanAset/AddPeminjamanView.vue'),
      meta: { roles: ['SISWA', 'GURU'] }
    },
    {
      path: '/peminjaman/tambah-lintas-unit',
      name: 'add-peminjaman-lintas-unit',
      component: () => import('../views/PeminjamanAset/AddPeminjamanLintasUnitView.vue'),
      meta: { roles: ['SUPERADMIN', 'SARPRAS'] }
    },
    {
      path: '/peminjaman/edit/:id',
      name: 'update-peminjaman',
      component: () => import('../views/PeminjamanAset/UpdatePeminjamanView.vue'),
      meta: { roles: ['SUPERADMIN', 'SISWA', 'GURU'] }
    },
    {
      path: '/peminjaman/lintas-unit/edit/:id',
      name: 'update-peminjaman-lintas-unit',
      component: () => import('../views/PeminjamanAset/UpdatePeminjamanLintasUnitView.vue'),
      meta: { roles: ['SUPERADMIN', 'SARPRAS'] }
    },
    {
      path: '/peminjaman/guru-siswa',
      name: 'managed-peminjaman-all',
      component: () => import('../views/PeminjamanAset/ManagedPeminjamanView.vue'),
      meta: { roles: ['SUPERADMIN'] }
    },
    {
      path: '/peminjaman/tinjau/create/:idPeminjaman',
      name: 'create-review-peminjaman',
      component: CreatePeninjauanPeminjaman,
      meta: { roles: ['SUPERADMIN', 'SARPRAS'] }
    },
    {
      path: '/peminjaman/tinjau/update/:idPeminjaman',
      name: 'update-review-peminjaman',
      component: UpdatePeninjauanPeminjaman,
      meta: { roles: ['SUPERADMIN', 'SARPRAS'] }
    },
    {
      path: '/peminjaman/tinjau/detail/:idPeminjaman',
      name: 'detail-review-peminjaman',
      component: DetailPeninjauanPeminjaman,
      meta: { roles: ['SUPERADMIN', 'SARPRAS'] }
    },
    {
      path: '/pengadaan/rusak',
      name: 'penggantian-barang-rusak-all',
      component: () => import('../views/PenggantianBarangRusak/GetAll.vue'),
      meta: { roles: ['GURU', 'SISWA', 'ADMIN'] }
    },
    {
      path: '/penggantian/create',
      name: 'penggantian-barang-rusak-create',
      component: () => import('../views/PenggantianBarangRusak/CreatePengajuanPenggantian.vue'),
      meta: { roles: ['GURU', 'SISWA', 'ADMIN'] }
    },
    {
      path: '/penggantian/edit/:idPenggantian',
      name: 'penggantian-barang-rusak-edit',
      component: () => import('../views/PenggantianBarangRusak/UpdatePengajuanpenggantianBarang.vue'),
      meta: { roles: ['GURU', 'SISWA', 'ADMIN'] }
    },
    {
      path: '/pengadaan/rusak/tinjau',
      name: 'peninjauan-penggantian-barang-rusak-all',
      component: () => import('../views/PeninjauanPenggantian/TinjauAll.vue'),
      meta: { roles: ['SARPRAS', 'ADMIN'] }
    },
    {
      path: '/penggantian/pengajuan/tinjau/:penggantianId',
      name: 'peninjauan-penggantian-barang-rusak-create-review',
      component: () => import('../views/PeninjauanPenggantian/CreateReview.vue'),
      meta: { roles: ['SARPRAS', 'ADMIN'] }
    },
    {
      path: '/penggantian/pengajuan/tinjau/update/:penggantianId',
      name: 'peninjauan-penggantian-barang-rusak-update-review',
      component: () => import('../views/PeninjauanPenggantian/UpdateReview.vue'),
      meta: { roles: ['SARPRAS', 'ADMIN'] }
    },
    {
      path: '/profile/pengelolaan-akun',
      name: 'pengelolaan-akun',
      component: () => import('../views/Profile/PengelolaanAkunView.vue'),
      meta: { roles: ['SARPRAS', 'SUPERADMIN'] }
    },
    {
      path: '/profile/pengelolaan-akun/tambah',
      name: 'tambah-akun',
      component: () => import('../views/Profile/TambahAkunView.vue'),
      meta: { roles: ['SARPRAS', 'SUPERADMIN'] }
    },
    {
      path: '/pengadaan/dashboard',
      name: 'dashboard-pengadaan-aset',
      component: () => import('../views/Dashboard/DashboardPengadaanAset.vue'),
      meta: { roles: [ 'SARPRAS', 'KEPSEK', 'YAYASAN', 'SUPERADMIN'] }
    },
    {
      path: '/assets/dashboard',
      name: 'dashboard-asset',
      component: () => import('../views/Dashboard/DashboardPeminjamanAset.vue'),
      meta: { roles: ['SARPRAS', 'KEPSEK', 'YAYASAN', 'ADMIN'] }
    },
    {
      path: '/403',
      name: 'forbidden',
      component: () => import('@/views/Error/Forbidden403View.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/Error/NotFound404View.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.userRole) {
    authStore.checkAuth();
  }

  if (!to.meta || !to.meta.roles) {
    return next();
  }

  const allowedRoles = to.meta.roles as string[];

  if (!authStore.isAuthenticated) {
    return next({ name: 'login' });
  }

  const userRole = authStore.userRole;
  const userUnit = authStore.user?.unit;

  const userRoles = [];
  if (userRole) {
    userRoles.push(userRole.toUpperCase());
    if (userRole.toUpperCase() === 'ADMIN' && userUnit && userUnit.toUpperCase() === 'SUPERADMIN') {
      userRoles.push('SUPERADMIN');
    }
  }

  if (allowedRoles.includes('ALL')) {
    return next();
  }

  const hasAccess = allowedRoles.some(role => userRoles.includes(role.toUpperCase()));

  if (hasAccess) {
    next();
  } else {
    next({ path: '/403' });
  }
});

export default router

