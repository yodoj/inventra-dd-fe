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

export const useDashboardAssetStore = defineStore('dashboardAsset', {
  state: () => ({
    summary: null as DashboardAssetSummary | null,
    peminjamanPerUnit: [] as PeminjamanUnit[],
    trend: [] as PeminjamanTrend[],
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
      this.error = null;
      try {
        const response = await api.get('/api/dashboard/peminjaman-per-unit');
        this.peminjamanPerUnit = response.data.data;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Gagal mengambil data peminjaman per unit';
      } finally {
        this.loading = false;
      }
    },

    async fetchTrend(year?: number, month?: number, unit?: string, kategori?: string) {
      this.loading = true;
      this.error = null;
      try {
        let url = `/api/dashboard/tren-peminjaman?tahun=${year || new Date().getFullYear()}`;
        if (month) url += `&bulan=${month}`;
        if (unit && unit !== 'Semua Unit') url += `&unit=${unit}`;
        if (kategori && kategori !== 'Semua Kategori') url += `&kategori=${kategori}`;
        
        const response = await api.get(url);
        this.trend = response.data.data;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Gagal mengambil data tren peminjaman';
      } finally {
        this.loading = false;
      }
    },
  },
});
