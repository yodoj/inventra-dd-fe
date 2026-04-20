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
      path: '/profile/password-history',
      name: 'password-history',
      component: () => import('../views/PasswordHistoryView.vue'),
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

    {
      path: '/pengadaan/pengajuan/detail/:idPengadaan',
      name: 'pengadaan-detail',
      component: DetailPengadaanAsetView,
    },

    {
      path: '/pengadaan/pengajuan/update/:idPengadaan',
      name: 'pengadaan-update',
      component: UpdatePengadaanAsetView,
    },

    {
      path: '/pengadaan/bukti/:idPengadaan',
      name: 'peninjauan-pengadaan-aset-buy-after-review',
      component: () => import('../views/PeninjauanPengadaanAset/BuyAfterReview.vue'),
    },

    {
      path: '/pengadaan/pengajuan/tinjau',
      name: 'peninjauan-pengadaan-aset-all',
      component: () => import('../views/PeninjauanPengadaanAset/TinjauAll.vue'),
    },
    {
      path: '/pengadaan/pengajuan/tinjau/:pengadaanId',
      name: 'peninjauan-pengadaan-aset-create-review',
      component: () => import('../views/PeninjauanPengadaanAset/CreateReview.vue'),
    },

    {
      path: '/pengadaan/pengajuan/tinjau/update/:pengadaanId',
      name: 'peninjauan-pengadaan-aset-update-review',
      component: () => import('../views/PeninjauanPengadaanAset/UpdateReview.vue'),
    },

    {
      path: '/pengadaan/pengajuan/tinjau/bukti/:idPengadaan',
      name: 'peninjauan-pengadaan-aset-buy-after-review',
      component: () => import('../views/PeninjauanPengadaanAset/BuyAfterReview.vue'),
    },
    {
      path: '/peminjaman',
      name: 'managed-peminjaman',
      component: () => import('../views/PeminjamanAset/ManagedPeminjamanView.vue'),
    },
    {
      path: '/peminjaman/tambah',
      name: 'add-peminjaman',
      component: () => import('../views/PeminjamanAset/AddPeminjamanView.vue'),
    },
    {
      path: '/peminjaman/tambah-lintas-unit',
      name: 'add-peminjaman-lintas-unit',
      component: () => import('../views/PeminjamanAset/AddPeminjamanLintasUnitView.vue'),
    },
    {
      path: '/peminjaman/edit/:id',
      name: 'update-peminjaman',
      component: () => import('../views/PeminjamanAset/UpdatePeminjamanView.vue'),
    },
    {
      path: '/peminjaman/lintas-unit/edit/:id',
      name: 'update-peminjaman-lintas-unit',
      component: () => import('../views/PeminjamanAset/UpdatePeminjamanLintasUnitView.vue'),
    },
    {
      path: '/peminjaman/guru-siswa',
      name: 'managed-peminjaman-all',
      component: () => import('../views/PeminjamanAset/ManagedPeminjamanView.vue'),
    },

    {
      path: '/pengadaan/rusak',
      name: 'penggantian-barang-rusak-all',
      component: () => import('../views/PenggantianBarangRusak/GetAll.vue'),
    },
    {
      path: '/penggantian/create',
      name: 'penggantian-barang-rusak-create',
      component: () => import('../views/PenggantianBarangRusak/CreatePengajuanPenggantian.vue'),
    },
    {
      path: '/penggantian/edit/:idPenggantian',
      name: 'penggantian-barang-rusak-edit',
      component: () => import('../views/PenggantianBarangRusak/UpdatePengajuanpenggantianBarang.vue'),
    },
    {
      path: '/pengadaan/rusak/tinjau',
      name: 'peninjauan-penggantian-barang-rusak-all',
      component: () => import('../views/PeninjauanPenggantian/TinjauAll.vue'),
    },
    {
      path: '/penggantian/pengajuan/tinjau/:penggantianId',
      name: 'peninjauan-penggantian-barang-rusak-create-review',
      component: () => import('../views/PeninjauanPenggantian/CreateReview.vue'),
    },

    {
      path: '/penggantian/pengajuan/tinjau/update/:penggantianId',
      name: 'peninjauan-penggantian-barang-rusak-update-review',
      component: () => import('../views/PeninjauanPenggantian/UpdateReview.vue'),
    },
    {
      path: '/profile/pengelolaan-akun',
      name: 'pengelolaan-akun',
      component: () => import('../views/Profile/PengelolaanAkunView.vue'),
    },
    {
      path: '/profile/pengelolaan-akun/tambah',
      name: 'tambah-akun',
      component: () => import('../views/Profile/TambahAkunView.vue'),
    },
    {
      path: '/peminjaman/tinjau/create/:idPeminjaman',
      name: 'create-review-peminjaman',
      component: CreatePeninjauanPeminjaman
    },
    {
      path: '/peminjaman/tinjau/update/:idPeminjaman',
      name: 'update-review-peminjaman',
      component: UpdatePeninjauanPeminjaman
    },
    {
      path: '/peminjaman/tinjau/detail/:idPeminjaman',
      name: 'detail-review-peminjaman',
      component: DetailPeninjauanPeminjaman
    }
  ]
})

export default router
