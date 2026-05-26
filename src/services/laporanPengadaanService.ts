import api from '@/services/api'
import type { AxiosResponse, AxiosError } from 'axios'
import type {
  LaporanPengadaanItemDTO,
  LaporanPengadaanPageDTO,
  LaporanFilterParams,
  BaseResponseDTO,
} from '@/interfaces/laporanPengadaan'

function unwrap<T>(res: AxiosResponse<BaseResponseDTO<T>>): T {
  const body = res.data
  if (body?.success === false) throw new Error(body?.message || 'Request gagal')
  if (body?.data === undefined) throw new Error(body?.message || 'Response tidak berisi data')
  return body.data
}

function getErrorMessage(err: unknown): string {
  const e = err as AxiosError<BaseResponseDTO<any>>
  const fromBE = e?.response?.data?.message
  if (fromBE) return fromBE
  const fromBE2 = (e?.response?.data as any)?.error?.message
  if (fromBE2) return fromBE2
  return (e as any)?.message || 'Terjadi kesalahan'
}

function cleanParams(params: LaporanFilterParams): Record<string, any> {
  const cleaned: Record<string, any> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '') {
      cleaned[k] = v
    }
  }
  return cleaned
}

export const laporanPengadaanService = {
  async getLaporan(params: LaporanFilterParams = {}): Promise<LaporanPengadaanPageDTO> {
    try {
      const res = await api.get<BaseResponseDTO<LaporanPengadaanPageDTO>>(
        '/api/laporan/pengadaan',
        { params: cleanParams(params) },
      )
      return unwrap(res)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  },

  async getAllLaporanForExport(
    params: Omit<LaporanFilterParams, 'page' | 'size'> = {},
  ): Promise<LaporanPengadaanItemDTO[]> {
    try {
      // BE membatasi size max 100 → loop paginasi sampai semua page diambil.
      const PAGE_SIZE = 100
      const HARD_CAP_PAGES = 200 // safety: max 20.000 rows per export
      const all: LaporanPengadaanItemDTO[] = []
      let page = 0
      let totalPages = 1

      while (page < totalPages && page < HARD_CAP_PAGES) {
        const res = await api.get<BaseResponseDTO<LaporanPengadaanPageDTO>>(
          '/api/laporan/pengadaan',
          { params: cleanParams({ ...params, page, size: PAGE_SIZE }) },
        )
        const data = unwrap(res)
        all.push(...data.content)
        totalPages = data.total_pages
        page++
      }
      return all
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  },
}
