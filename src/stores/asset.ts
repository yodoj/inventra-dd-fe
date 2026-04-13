import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export interface Asset {
    id_aset: string;
    kode_aset: string;
    gambar_url_aset: string;
    nama_aset: string;
    merk_aset?: string;
    qty_aset?: number;
    qty_tersedia?: number;
    qty_rusak?: number;
    qty_perbaikan?: number;
    qty_dimusnahkan?: number;
    qty_dipinjam?: number;
    lokasi_aset?: string;
    kategori_aset: string;
    status_aset: string;
    keterangan_aset: string;
    unit: string;
}

export interface PaginatedResponse<T> {
    status: number;
    message: string;
    data: {
        content: T[];
        totalElements: number;
        totalPages: number;
        size: number;
        number: number;
    };
}

export const useAssetStore = defineStore('asset', () => {
    const assets = ref<Asset[]>([]);
    const totalElements = ref(0);
    const totalPages = ref(0);
    const currentPage = ref(0);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    async function fetchAssets(type: 'barang' | 'ruangan', page = 0, size = 50, filters: any = {}) {
        isLoading.value = true;
        error.value = null;

        try {
            const params = {
                page,
                size,
                ...filters
            };

            const endpoint = type === 'barang' ? '/api/assets/barang' : '/api/assets/ruangan';
            const response = await api.get<PaginatedResponse<Asset>>(endpoint, { params });

            if (response.data.status === 200) {
                assets.value = response.data.data.content;
                totalElements.value = response.data.data.totalElements;
                totalPages.value = response.data.data.totalPages;
                currentPage.value = response.data.data.number;
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal mengambil data aset';
            assets.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function createAssetBarang(data: any) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.post('/api/assets/barang', data);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal menambah aset barang';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function createAssetRuangan(data: any) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.post('/api/assets/ruangan', data);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal menambah aset ruangan';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteAssetBarang(id: string) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.delete(`/api/assets/barang/${id}`);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal menghapus aset barang';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteAssetRuangan(id: string) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.delete(`/api/assets/ruangan/${id}`);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal menghapus aset ruangan';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchAssetBarangById(id: string) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.get(`/api/assets/barang/${id}`);
            return response.data.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal mengambil data aset barang';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchAssetRuanganById(id: string) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.get(`/api/assets/ruangan/${id}`);
            return response.data.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal mengambil data aset ruangan';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function updateAssetBarang(id: string, data: any) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.put(`/api/assets/barang/${id}`, data);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal mengubah aset barang';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function updateAssetRuangan(id: string, data: any) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.put(`/api/assets/ruangan/${id}`, data);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal mengubah aset ruangan';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        assets,
        totalElements,
        totalPages,
        currentPage,
        isLoading,
        error,
        fetchAssets,
        createAssetBarang,
        createAssetRuangan,
        deleteAssetBarang,
        deleteAssetRuangan,
        fetchAssetBarangById,
        fetchAssetRuanganById,
        updateAssetBarang,
        updateAssetRuangan
    };
});
