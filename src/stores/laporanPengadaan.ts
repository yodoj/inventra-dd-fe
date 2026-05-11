import { defineStore } from 'pinia'
import { ref } from 'vue'
import { laporanPengadaanService } from '@/services/laporanPengadaanService'
import type { LaporanPengadaanDTO } from '@/interfaces/laporanPengadaan'

export const useLaporanPengadaanStore = defineStore('laporanPengadaan', () => {
  const laporan = ref<LaporanPengadaanDTO[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchLaporan() {
    loading.value = true
    error.value = null

    try {
      laporan.value = await laporanPengadaanService.getLaporan()
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    laporan,
    loading,
    error,
    fetchLaporan,
  }
})
