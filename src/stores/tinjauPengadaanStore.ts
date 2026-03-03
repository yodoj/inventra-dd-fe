import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  Status,
  TinjauPengadaanRequestDTO,
  TinjauPengadaanResponseDTO,
} from "@/interfaces/tinjauPengadaan";
import { tinjauPengadaanService } from "@/services/tinjauPengadaanService";
import { useAuthStore } from "@/stores/auth";

export const useTinjauPengadaanStore = defineStore("tinjauPengadaanStore", () => {
  const auth = useAuthStore();
  const current = ref<TinjauPengadaanResponseDTO | null>(null);
  const statusSebelumnya = ref<Status | "">("");
  const loading = ref(false);
  const errorMessage = ref("");
  const items = ref<TinjauPengadaanResponseDTO[]>([]);
  const isLoading = computed(() => loading.value);
  const hasData = computed(() => !!current.value);
  const selectedPengadaanId = ref<number | null>(null);

  function selectPengadaan(idPengadaan: number) {
    selectedPengadaanId.value = idPengadaan;
  }
  function reset() {
    current.value = null;
    errorMessage.value = "";
  }

  function setStatusSebelumnya(statusPengadaan: Status) {
    statusSebelumnya.value = statusPengadaan;
  }

  async function fetchAll() {
    loading.value = true;
    errorMessage.value = "";
    try {
      items.value = await tinjauPengadaanService.getAll();
      return items.value;
    } catch (e: any) {
      errorMessage.value = e?.message || "Gagal mengambil data";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchByPengadaanId(pengadaanId: number) {
    loading.value = true;
    errorMessage.value = "";

    try {
      const data = await tinjauPengadaanService.getByPengadaanId(pengadaanId);
      current.value = data;
      statusSebelumnya.value = data.statusPengadaan;
      return data;
    } catch (e: any) {
      // kalau belum ada peninjauan: mode create
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("peninjauan belum ada")) {
        current.value = null;
        errorMessage.value = "";
        return null;
      }

      current.value = null;
      errorMessage.value = msg || "Gagal mengambil data";
      throw e;
    } finally {
      loading.value = false;
    }
  }

async function createTinjauan(pengadaanId: number, payload: TinjauPengadaanRequestDTO) {
    loading.value = true;
    errorMessage.value = "";
    try {
      const result = await tinjauPengadaanService.create(pengadaanId, payload);
      current.value = result;
      return result;
    } catch (e: any) {
      errorMessage.value = e.response?.data?.message || e.message || "Gagal membuat peninjauan";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateTinjauan(pengadaanId: number, payload: TinjauPengadaanRequestDTO) {
    loading.value = true;
    errorMessage.value = "";
    try {
      const result = await tinjauPengadaanService.update(pengadaanId, payload);
      current.value = result;
      return result;
    } catch (e: any) {
      errorMessage.value = e.response?.data?.message || e.message || "Gagal memperbarui peninjauan";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function prosesBeli(pengadaanId: string, harga: number, file: File) {
    loading.value = true;
    try {
      const formData = new FormData();
      formData.append('harga', String(harga || 0));
      formData.append('buktiPembelian', file);

      const result = await tinjauPengadaanService.beliPengadaan(pengadaanId, formData);
      const index = items.value.findIndex(item => item.idPengadaan === pengadaanId);
      if (index !== -1) {
        items.value.splice(index, 1);
      }

      current.value = result;
      return result;
    } catch (e: any) {
      errorMessage.value = e.response?.data?.message || e.message || "Gagal memproses pembelian";
      throw e;
    } finally {
      loading.value = false;
    }
  }



  return {
    current,
    statusSebelumnya,
    loading,
    errorMessage,
    items,

    isLoading,
    hasData,
    selectedPengadaanId,

    reset,
    setStatusSebelumnya,
    fetchByPengadaanId,
    createTinjauan,
    updateTinjauan,
    fetchAll,
    selectPengadaan,
    prosesBeli
  };
});
