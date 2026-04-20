import { defineStore } from 'pinia';
import api from '@/services/api';
import type { PeminjamanAsetResponseDTO } from '@/interfaces/peminjaman';

export const usePeminjamanStore = defineStore('peminjaman', {
  state: () => ({
    loans: [] as PeminjamanAsetResponseDTO[],
    loansLintasUnit: [] as PeminjamanAsetResponseDTO[],
    isLoading: false,
    error: null as string | null,
    currentPage: 0,
    totalPages: 0,
    totalElements: 0
  }),
  actions: {
    async fetchLoans(page = 0, size = 10, filters: any = {}) {
      this.isLoading = true;
      try {
        const { all, ...otherFilters } = filters;
        const response = await api.get('/api/peminjaman', {
          params: { page, size, all, ...otherFilters }
        });
        this.loans = response.data.data.content;
        this.currentPage = response.data.data.number;
        this.totalPages = response.data.data.totalPages;
        this.totalElements = response.data.data.totalElements;
        return response.data.data;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Failed to fetch loans';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchLoansLintasUnit(page = 0, size = 10, filters: any = {}) {
      this.isLoading = true;
      try {
        const { all, ...otherFilters } = filters;
        const response = await api.get('/api/peminjaman/lintas-unit', {
          params: { page, size, all, ...otherFilters }
        });
        this.loansLintasUnit = response.data.data.content;
        this.currentPage = response.data.data.number;
        this.totalPages = response.data.data.totalPages;
        this.totalElements = response.data.data.totalElements;
        return response.data.data;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Failed to fetch cross-unit loans';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async createLoan(payload: any) {
      this.isLoading = true;
      try {
        const response = await api.post('/api/peminjaman', payload);
        return response.data;
      } catch (err: any) {
        console.error('Error creating loan:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async createLoanLintasUnit(payload: any) {
      this.isLoading = true;
      try {
        const response = await api.post('/api/peminjaman/lintas-unit', payload);
        return response.data;
      } catch (err: any) {
        console.error('Error creating lint-unit loan:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchLoanById(id: string) {
      this.isLoading = true;
      try {
        const response = await api.get(`/api/peminjaman/${id}`);
        return response.data.data;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Failed to fetch loan details';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async updateLoan(id: string, payload: any) {
      this.isLoading = true;
      try {
        const response = await api.put(`/api/peminjaman/${id}`, payload);
        return response.data;
      } catch (err: any) {
        console.error('Error updating loan:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async updateLoanLintasUnit(id: string, payload: any) {
      this.isLoading = true;
      try {
        const response = await api.put(`/api/peminjaman/lintas-unit/${id}`, payload);
        return response.data;
      } catch (err: any) {
        console.error('Error updating lintas-unit loan:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteLoan(id: string, isLintasUnit: boolean = false) {
      this.isLoading = true;
      try {
        const url = isLintasUnit ? `/api/peminjaman/lintas-unit/${id}` : `/api/peminjaman/${id}`;
        const response = await api.delete(url);
        return response.data;
      } catch (err: any) {
        console.error('Error deleting loan:', err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchBorrowableAssets(unit: string) {
      try {
        const response = await api.get('/api/assets/borrowable', {
          params: { unit }
        });
        return response.data.data;
      } catch (err: any) {
        console.error('Error fetching borrowable assets:', err);
        throw err;
      }
    }
  }
});
