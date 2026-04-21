import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export interface TinjauPeminjaman {
    id_peninjauan: number | null;
    id_peminjaman: string;
    id_peminjam: string;
    nama_peminjam: string;
    role_peminjam: string;
    unit_asal: string;
    id_aset: string;
    kode_aset: string;
    nama_aset: string;
    merk_aset: string | null;
    kategori_aset: string;
    qty: number;
    waktu_peminjaman: string;
    waktu_pengembalian: string;
    waktu_pengajuan: string;
    tujuan_peminjaman: string;
    unit_tujuan: string;
    status_peminjaman: 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK';
    alasan: string | null;
    id_peninjau: string | null;
    role_peninjau: string | null;
    nama_peninjau: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface BaseResponse<T> {
    status: number;
    message: string;
    data: T;
}

export const useTinjauPeminjamanStore = defineStore('tinjauPeminjaman', () => {
    const listTinjauan = ref<TinjauPeminjaman[]>([]);
    const current = ref<TinjauPeminjaman | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    
    let fetchVersion = 0;

    const isLoading = computed(() => loading.value);

    // Menampilkan daftar pengajuan peminjaman aset
    async function fetchAll(params: any = {}) {
        const thisVersion = ++fetchVersion;
        loading.value = true;
        error.value = null;
        try {
            const response = await api.get<BaseResponse<TinjauPeminjaman[]>>('/api/peminjaman/tinjau', { params });
            
            if (thisVersion !== fetchVersion) return; 

            if (response.data.status === 200) {
                listTinjauan.value = response.data.data;
            }
        } catch (err: any) {
            if (thisVersion !== fetchVersion) return;
            error.value = err.response?.data?.message || 'Gagal mengambil daftar peninjauan';
            listTinjauan.value = [];
        } finally {
            if (thisVersion === fetchVersion) loading.value = false;
        }
    }

    // Detail Peninjauan (Gunakan ID Peminjaman sesuai Backend)
    async function fetchByPeminjamanId(idPeminjaman: string) {
        loading.value = true;
        error.value = null;
        try {
            // Kita panggil endpoint detail berdasarkan ID Peminjaman
            const response = await api.get<BaseResponse<TinjauPeminjaman>>(`/api/peminjaman/tinjau/${idPeminjaman}`);
            current.value = response.data.data;
            return response.data.data;
        } catch (err: any) {
            const msg = err.response?.data?.message || "";
            // Pola Raysha: Jika 404 atau belum ada review, kita anggap mode Create
            if (msg.toLowerCase().includes("belum ada review") || err.response?.status === 404) {
                current.value = null;
                return null;
            }
            error.value = msg || 'Gagal mengambil detail peninjauan';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    // Membuat peninjauan baru
    async function createTinjauan(idPeminjaman: string, payload: { status_peminjaman: string, alasan: string }) {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.post<BaseResponse<TinjauPeminjaman>>(`/api/peminjaman/tinjau/${idPeminjaman}`, payload);
            current.value = response.data.data;
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal membuat peninjauan';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    // Update peninjauan (untuk revisi atau perubahan status)
    async function updateTinjauan(idPeminjaman: string, payload: { status_peminjaman: string, alasan: string }) {
        loading.value = true;
        error.value = null;
        try {
            const response = await api.put<BaseResponse<TinjauPeminjaman>>(`/api/peminjaman/tinjau/${idPeminjaman}`, payload);
            current.value = response.data.data;
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Gagal memperbarui peninjauan';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    function reset() {
        current.value = null;
        error.value = null;
    }

    return {
        listTinjauan,
        current,
        isLoading,
        error,
        fetchAll,
        fetchByPeminjamanId,
        createTinjauan,
        updateTinjauan,
        reset
    };
});