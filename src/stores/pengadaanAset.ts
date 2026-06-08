import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

// Interface untuk data tunggal pengadaan aset
export interface PengadaanAset {
    id_pengadaan: string;
    user_id?: string;
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

// Interface standar untuk response dari API backend
export interface BaseResponse<T> {
    status: number;
    message: string;
    data: T;
}

export const usePengadaanStore = defineStore('pengadaan', () => {
    const listPengadaan = ref<PengadaanAset[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // Mengambil daftar pengadaan aset milik user
    async function fetchMyPengadaan(params: any = {}) {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.get<BaseResponse<PengadaanAset[]>>('/api/pengadaan', {
                params
            });
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

    // Mengirimkan formulir pengajuan pengadaan aset baru
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

    // Menghapus pengajuan pengadaan berdasarkan ID
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

    // Mengambil detail pengadaan berdasarkan ID
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

    // Mengupdate pengajuan pengadaan berdasarkan ID
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