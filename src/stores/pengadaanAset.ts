import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export interface PengadaanAset {
    id_pengadaan: string;
    waktu_pengajuan: string;
    nama_aset: string;
    merk: string;
    qty: number;
    estimasi_harga: number;
    tanggal_pengadaan: string;
    kategori: string;
    link_gambar: string;
    status_pengadaan: string;
    unit: string;
}

export interface BaseResponse<T> {
    status: number;
    message: string;
    data: T;
}

export const usePengadaanStore = defineStore('pengadaan', () => {
    const listPengadaan = ref<PengadaanAset[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    async function fetchMyPengadaan() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.get<BaseResponse<PengadaanAset[]>>('/api/pengadaan');
            if (response.data.status === 200) {
                listPengadaan.value = response.data.data;
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal mengambil data pengadaan';
            listPengadaan.value = [];
        } finally {
            isLoading.value = false;
        }
    }

    async function createPengadaan(data: any) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.post('/api/pengadaan', data);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal mengajukan pengadaan';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function deletePengadaan(id: string) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.delete(`/api/pengadaan/${id}`);
            await fetchMyPengadaan();
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal menghapus pengajuan pengadaan';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchPengadaanById(id: string) {
        isLoading.value = true;
        try {
            const response = await api.get(`/api/pengadaan/${id}`);
            return response.data.data; 
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal mengambil detail pengadaan';
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function updatePengadaan(id: string, payload: any) {
        isLoading.value = true;
        try {
            const response = await api.put(`/api/pengadaan/${id}`, payload);
            return response.data;
        } catch (err: any) {
            throw err.response?.data?.message || 'Gagal mengupdate pengajuan';
        } finally {
            isLoading.value = false;
        }
    }

    return {
        listPengadaan,
        isLoading,
        error,
        fetchMyPengadaan,
        createPengadaan,
        deletePengadaan,
        fetchPengadaanById,
        updatePengadaan
    };
});