import { defineStore } from 'pinia';
import api from '@/services/api';

export interface DashboardAssetSummary {
  totalAset: number;
  breakdown: {
    BARANG_HABIS_PAKAI: number;
    BARANG_TIDAK_HABIS_PAKAI: number;
    RUANG_KELAS: number;
    RUANG_NON_KELAS: number;
  };
}

export interface PeminjamanUnit {
  unit: string;
  totalPeminjaman: number;
}

export interface PeminjamanTrend {
  label: string;
  count: number;
}

export interface TopAset {
  kodeAset: string;
  namaAset: string;
  merkAset: string;
  unit: string;
  value: string;
  kategori: string;
}

export const useDashboardAssetStore = defineStore('dashboardAsset', {
  state: () => ({
    summary: null as DashboardAssetSummary | null,
    peminjamanPerUnit: [] as PeminjamanUnit[],
    trend: [] as PeminjamanTrend[],
    topBorrowed: [] as TopAset[],
    topDamaged: [] as TopAset[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchSummary(unit?: string, kategori?: string) {
      this.loading = true;
      this.error = null;
      try {
        let url = '/api/dashboard/jumlah-aset?';
        if (unit && unit !== 'Semua Unit') url += `unit=${unit}&`;
        if (kategori && kategori !== 'Semua Kategori') url += `kategori=${kategori}&`;
        
        const response = await api.get(url);
        this.summary = response.data.data;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Gagal mengambil data ringkasan aset';
      } finally {
        this.loading = false;
      }
    },

    async fetchPeminjamanPerUnit() {
      this.loading = true;
      try {
        const response = await api.get('/api/dashboard/peminjaman-per-unit');
        this.peminjamanPerUnit = response.data.data;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Gagal mengambil data peminjaman per unit';
      } finally {
        this.loading = false;
      }
    },

    async fetchTrend(year?: number | null, month?: number | null, unit?: string, kategori?: string) {
      this.loading = true;
      this.error = null;
      try {
        let url = `/api/dashboard/tren-peminjaman?`;
        if (year !== null && year !== undefined) url += `tahun=${year}&`;
        if (month !== null && month !== undefined) url += `bulan=${month}&`;
        if (unit && unit !== 'Semua Unit') url += `unit=${unit}&`;
        if (kategori && kategori !== 'Semua Kategori') url += `kategori=${kategori}&`;
        
        const response = await api.get(url);
        this.trend = response.data.data;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Gagal mengambil data tren peminjaman';
      } finally {
        this.loading = false;
      }
    },

    async fetchTopBorrowed(year?: number | null, month?: number | null, unit?: string, kategori?: string) {
      this.loading = true;
      try {
        let url = `/api/dashboard/top-dipinjam?`;
        if (year !== null && year !== undefined) url += `tahun=${year}&`;
        if (month !== null && month !== undefined) url += `bulan=${month}&`;
        if (unit && unit !== 'Semua Unit') url += `unit=${unit}&`;
        if (kategori && kategori !== 'Semua Kategori') url += `kategori=${kategori}&`;
        
        const response = await api.get(url);
        this.topBorrowed = response.data.data;
      } catch (err: any) {
        console.error('Failed to fetch top borrowed:', err);
      } finally {
        this.loading = false;
      }
    },

    async fetchTopDamaged(year?: number | null, month?: number | null, unit?: string, kategori?: string) {
      this.loading = true;
      try {
        let url = `/api/dashboard/top-rusak-hilang?`;
        if (year !== null && year !== undefined) url += `tahun=${year}&`;
        if (month !== null && month !== undefined) url += `bulan=${month}&`;
        if (unit && unit !== 'Semua Unit') url += `unit=${unit}&`;
        if (kategori && kategori !== 'Semua Kategori') url += `kategori=${kategori}&`;
        
        const response = await api.get(url);
        this.topDamaged = response.data.data;
      } catch (err: any) {
        console.error('Failed to fetch top damaged:', err);
      } finally {
        this.loading = false;
      }
    },
  },
});
