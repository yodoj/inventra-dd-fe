import { defineStore } from 'pinia';
import api from '@/services/api';

export interface RiwayatPeminjamanItem {
  id: string;
  nama_peminjam: string;
  aset: string;
  qty: number;
  unit: string;
  waktu_peminjaman: string;
  waktu_pengembalian: string;
  tujuan: string;
}

export interface FrekuensiPeminjamanItem {
  id: string;
  aset: string;
  kategori: string;
  unit: string;
  frekuensi_peminjaman: string;
  frekuensi_count: number;
  total_durasi_peminjaman: string;
  total_durasi_hari: number;
  periode: string;
  status_terakhir: string;
}

export interface PaginationMeta {
  total_data: number;
  total_page: number;
  current_page: number;
  limit: number;
}

export const useLaporanUtilisasiStore = defineStore('laporanUtilisasi', {
  state: () => ({
    historyList: [] as RiwayatPeminjamanItem[],
    frequencyList: [] as FrekuensiPeminjamanItem[],
    isLoading: false,
    error: null as string | null,
    pagination: {
      total_data: 0,
      total_page: 0,
      current_page: 1,
      limit: 10
    } as PaginationMeta
  }),
  actions: {
    async fetchHistory(params: any = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('/api/laporan/utilisasi/history', { params });
        const resData = response.data;
        this.historyList = resData.data || [];
        this.pagination = {
          total_data: resData.total_data || 0,
          total_page: resData.total_page || 0,
          current_page: resData.current_page || 1,
          limit: resData.limit || 10
        };
        return resData;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Gagal memuat data riwayat utilisasi';
        console.error('Error fetching history reports:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchFrequency(params: any = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('/api/laporan/utilisasi/frequency', { params });
        const resData = response.data;
        this.frequencyList = resData.data || [];
        this.pagination = {
          total_data: resData.total_data || 0,
          total_page: resData.total_page || 0,
          current_page: resData.current_page || 1,
          limit: resData.limit || 10
        };
        return resData;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Gagal memuat data frekuensi utilisasi';
        console.error('Error fetching frequency reports:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async exportPdf(params: any = {}) {
      try {
        const response = await api.get('/api/laporan/utilisasi/export/pdf', { 
          params,
          responseType: 'blob'
        });
        return response.data;
      } catch (err: any) {
        console.error('Error exporting PDF:', err);
        throw err;
      }
    }
  }
});
