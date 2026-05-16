import { defineStore } from 'pinia'
import { ref } from 'vue'
import { laporanPengadaanService } from '@/services/laporanPengadaanService'
import type { LaporanPengadaanItemDTO, LaporanFilterParams } from '@/interfaces/laporanPengadaan'

export const useLaporanPengadaanStore = defineStore('laporanPengadaan', () => {
  const laporan = ref<LaporanPengadaanItemDTO[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalElements = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(0)   // 0-indexed (sesuai BE)
  const pageSize = ref(10)

  const sortBy = ref('waktuPengajuan')
  const direction = ref<'ASC' | 'DESC'>('DESC')

  async function fetchLaporan(filters: LaporanFilterParams = {}) {
    loading.value = true
    error.value = null
    try {
      const result = await laporanPengadaanService.getLaporan({
        ...filters,
        sortBy: sortBy.value,
        direction: direction.value,
        page: currentPage.value,
        size: pageSize.value,
      })
      laporan.value = result.content
      totalElements.value = result.total_elements
      totalPages.value = result.total_pages
      currentPage.value = result.current_page
      pageSize.value = result.page_size
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
    totalElements,
    totalPages,
    currentPage,
    pageSize,
    sortBy,
    direction,
    fetchLaporan,
  }
})
