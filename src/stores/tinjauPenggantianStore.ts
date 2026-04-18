import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  Status,
  TinjauPenggantianRequestDTO,
  TinjauPenggantianResponseDTO,
} from "@/interfaces/tinjauPenggantian";
import { tinjauPenggantianService } from "@/services/tinjauPenggantianService";
import { useAuthStore } from "@/stores/auth";

export const useTinjauPenggantianStore = defineStore("tinjauPenggantianStore", () => {
  const auth = useAuthStore();
  const current = ref<TinjauPenggantianResponseDTO | null>(null);
  const statusSebelumnya = ref<Status | "">("");
  const loading = ref(false);
  const errorMessage = ref("");
  const items = ref<TinjauPenggantianResponseDTO[]>([]);
  const isLoading = computed(() => loading.value);
  const hasData = computed(() => !!current.value);
  const selectedPenggantianId = ref<string | null>(null);

  function selectPenggantian(idPenggantian: string) {
    selectedPenggantianId.value = idPenggantian;
  }
  function reset() {
    current.value = null;
    errorMessage.value = "";
  }

  function setStatusSebelumnya(statusPenggantian: Status) {
    statusSebelumnya.value = statusPenggantian;
  }

async function fetchAll(params?: { status_penggantian?: string | null; search?: string | null }) {
  loading.value = true;
  errorMessage.value = "";
  try {
    items.value = await tinjauPenggantianService.getAll({
      status_penggantian: params?.status_penggantian ?? undefined,
      search: params?.search ?? undefined,
    });
    return items.value;
  } catch (e: any) {
    errorMessage.value = e?.message || "Gagal mengambil data";
    throw e;
  } finally {
    loading.value = false;
  }
}
  async function fetchByPenggantianId(penggantianId: string) {
    loading.value = true;
    errorMessage.value = "";

    try {
      const data = await tinjauPenggantianService.getByPenggantianId(penggantianId);
      current.value = data;
      statusSebelumnya.value = data.statusPenggantian;
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

async function createTinjauan(penggantianId: string, payload: TinjauPenggantianRequestDTO) {
    loading.value = true;
    errorMessage.value = "";
    try {
      const result = await tinjauPenggantianService.create(penggantianId, payload);
      current.value = result;
      return result;
    } catch (e: any) {
      errorMessage.value = e.response?.data?.message || e.message || "Gagal membuat peninjauan";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function updateTinjauan(penggantianId: string, payload: TinjauPenggantianRequestDTO) {
    loading.value = true;
    errorMessage.value = "";
    try {
      const result = await tinjauPenggantianService.update(penggantianId, payload);
      current.value = result;
      return result;
    } catch (e: any) {
      errorMessage.value = e.response?.data?.message || e.message || "Gagal memperbarui peninjauan";
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
    selectedPenggantianId,

    reset,
    setStatusSebelumnya,
    fetchByPenggantianId,
    createTinjauan,
    updateTinjauan,
    fetchAll,
    selectPenggantian,
  };
});
