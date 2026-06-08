import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dashboardPengadaanService } from '@/services/dashboardPengadaanService'
import type { DashboardPengadaan, TopBiaya, BiayaPengadaanChart, JumlahAsetChart, TopCepatHabis } from '@/types/dashboard'

export const useDashboardPengadaanStore = defineStore('dashboardPengadaanStore', () => {
  const dashboard = ref<DashboardPengadaan | null>(null)
  const topBiaya = ref<TopBiaya[]>([])
  const topPengadaan = ref<TopBiaya[]>([])
  const biayaPerTahun = ref<BiayaPengadaanChart[]>([])
  const jumlahAsetPerTahun = ref<JumlahAsetChart[]>([])
  const topCepatHabis = ref<TopCepatHabis[]>([])
  const loading = ref(false)
  const errorMessage = ref('')

  const selectedYear = ref<number | null>(null)
  const selectedUnit = ref<string | null>(null)
  const selectedBulan = ref<number | null>(null)
  const selectedKategori = ref<string | null>(null)

  let fetchVersion = 0

  const isLoading = computed(() => loading.value)
  const hasData = computed(() => !!dashboard.value)

  function reset() {
    dashboard.value = null
    topBiaya.value = []
    topCepatHabis.value = []
    topPengadaan.value = []
    biayaPerTahun.value = []
    errorMessage.value = ''
  }

  async function fetchDashboard() {
    const thisVersion = ++fetchVersion
    loading.value = true
    errorMessage.value = ''

    try {
      const result = await dashboardPengadaanService.getScoreCard({
        tahun: selectedYear.value ?? undefined,
        unit: selectedUnit.value ?? undefined,
      })

      if (thisVersion !== fetchVersion) return

      dashboard.value = result
      console.log('AB' + JSON.stringify(result))
    } catch (e: any) {
      if (thisVersion !== fetchVersion) return
      errorMessage.value = e?.message || 'Gagal mengambil dashboard'
    } finally {
      if (thisVersion === fetchVersion) {
        loading.value = false
      }
    }
  }

  async function fetchTopDashboard() {
    const thisVersion = ++fetchVersion
    loading.value = true
    errorMessage.value = ''

    try {
      const result = await dashboardPengadaanService.getListTop5({
        tahun: selectedYear.value ?? undefined,
        bulan: selectedBulan.value ?? undefined,
        kategori: selectedKategori.value ?? undefined,
        unit: selectedUnit.value ?? undefined,
      })

      if (thisVersion !== fetchVersion) return

      topBiaya.value = result.topBiaya || []
      topCepatHabis.value = result.topPengadaan || [];

      console.log(result.topBiaya)
    } catch (e: any) {
      if (thisVersion !== fetchVersion) return
      errorMessage.value = e?.message || 'Gagal mengambil top dashboard'
    } finally {
      if (thisVersion === fetchVersion) {
        loading.value = false
      }
    }
  }

  async function fetchBiayaChart(unit?: string) {
    try {
      biayaPerTahun.value = await dashboardPengadaanService.getBiayaPengadaanChart({ unit })
    } catch (e: any) {
      console.error('Gagal mengambil data chart biaya:', e)
    }
  }

  async function fetchJumlahAsetChart(unit?: string) {
    try {
      jumlahAsetPerTahun.value = await dashboardPengadaanService.getJumlahAsetChart({ unit })
    } catch (e: any) {
      console.error('Gagal mengambil data chart jumlah aset:', e)
    }
  }

  async function fetchTopCepatHabis() {
    try {
      const result = await dashboardPengadaanService.getTopCepatHabis({
        tahun: selectedYear.value ?? undefined,
        // Pastikan null/undefined dikirim kalau filter unit 'ALL'
        unit: selectedUnit.value === 'ALL' ? undefined : (selectedUnit.value ?? undefined),
      })
      topCepatHabis.value = result || []
    } catch (e: any) {
      console.error('Gagal mengambil data top cepat habis:', e)
    }
  }

  async function fetchAll() {
    await fetchDashboard()
    await fetchBiayaChart()
    // await fetchTopCepatHabis()
    await fetchJumlahAsetChart()
    await fetchTopDashboard()
  }

  function setYear(year: number | null) {
    selectedYear.value = year
  }

  function setUnit(unit: string | null) {
    selectedUnit.value = unit
  }

  function setBulan(bulan: number | null) {
    selectedBulan.value = bulan
  }

  function setKategori(kategori: string | null) {
    selectedKategori.value = kategori
  }

  return {
    // state
    dashboard,
    topBiaya,
    topPengadaan,
    biayaPerTahun,
    jumlahAsetPerTahun,
    topCepatHabis,
    loading,
    errorMessage,

    // filter
    selectedYear,
    selectedUnit,
    selectedBulan,
    selectedKategori,

    // computed
    isLoading,
    hasData,

    // actions
    fetchDashboard,
    fetchTopDashboard,
    fetchBiayaChart,
    fetchJumlahAsetChart,
    fetchTopCepatHabis,
    fetchAll,
    reset,

    setYear,
    setUnit,
    setBulan,
    setKategori,
  }
})
