import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  PenggantianBarangRusakRequestDTO,
  PenggantianBarangRusakResponseDTO
} from "@/interfaces/PenggantianBarangRusak";

import { penggantianBarangRusakService } from "@/services/penggantianBarangRusakService";

export const usePenggantianBarangRusakStore = defineStore(
  "penggantianBarangRusakStore",
  () => {

    const items = ref<PenggantianBarangRusakResponseDTO[]>([]);
    const current = ref<PenggantianBarangRusakResponseDTO | null>(null);

    const loading = ref(false);
    const errorMessage = ref("");

    const isLoading = computed(() => loading.value);
    const hasData = computed(() => items.value.length > 0);

    function reset() {
      current.value = null;
      errorMessage.value = "";
    }

    async function fetchAll(params?: { status?: string | null; search?: string | null }) {

      loading.value = true;
      errorMessage.value = "";

      try {

        items.value = await penggantianBarangRusakService.getAll({
          status: params?.status ?? undefined,
          search: params?.search ?? undefined
        });

        return items.value;

      } catch (e: any) {

        errorMessage.value = e?.message || "Gagal mengambil data";
        throw e;

      } finally {
        loading.value = false;
      }
    }

    async function createPengajuan(payload: FormData) {

      loading.value = true;
      errorMessage.value = "";

      try {

        const result = await penggantianBarangRusakService.create(payload);

        current.value = result;
        items.value.unshift(result);

        return result;

      } catch (e: any) {

        errorMessage.value =
          e.response?.data?.message ||
          e.message ||
          "Gagal membuat pengajuan";

        throw e;

      } finally {
        loading.value = false;
      }
    }

    async function getPengajuanById(idPenggantian: string) {

      loading.value = true
      errorMessage.value = ""

      try {

        const result = await penggantianBarangRusakService.getById(idPenggantian)

        current.value = result

        return result

      } catch (e: any) {

        errorMessage.value = e?.message || "Gagal mengambil data pengajuan"
        throw e

      } finally {

        loading.value = false

      }
    }

    async function updatePengajuan(
      idPenggantian: string,
      payload: FormData
    ) {

      loading.value = true
      errorMessage.value = ""

      try {

        const result = await penggantianBarangRusakService.update(
          idPenggantian,
          payload
        )

        current.value = result

        const index = items.value.findIndex(
          (item) => item.idPenggantian === idPenggantian
        )

        if (index !== -1) {
          items.value[index] = result
        }

        return result

      } catch (e: any) {

        errorMessage.value =
          e?.message || "Gagal memperbarui pengajuan"

        throw e

      } finally {

        loading.value = false

      }
    }

    async function deletePengajuan(idPenggantian: string) {

      loading.value = true
      errorMessage.value = ""

      try {

        await penggantianBarangRusakService.delete(idPenggantian)

        const index = items.value.findIndex(
          (item) => item.idPenggantian === idPenggantian
        )

        if (index !== -1) {
          items.value.splice(index, 1)
        }

        if (current.value?.idPenggantian === idPenggantian) {
          current.value = null
        }

      } catch (e: any) {

        errorMessage.value =
          e?.message || "Gagal menghapus pengajuan"

        throw e

      } finally {

        loading.value = false

      }
    }

    return {

      items,
      current,
      loading,
      errorMessage,

      isLoading,
      hasData,

      reset,
      fetchAll,
      createPengajuan,
      getPengajuanById,
      updatePengajuan,
      deletePengajuan
    };
  }
);
