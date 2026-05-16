import api from '@/services/api'
import type { AxiosResponse, AxiosError } from 'axios'
import type { LaporanPengadaanDTO, BaseResponseDTO } from '@/interfaces/laporanPengadaan'

function unwrap<T>(res: AxiosResponse<BaseResponseDTO<T>>): T {
  const body = res.data

  if (body?.success === false) {
    throw new Error(body?.message || 'Request gagal')
  }

  if (body?.data === undefined) {
    throw new Error(body?.message || 'Response tidak berisi data')
  }

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

export const laporanPengadaanService = {
  async getLaporan(): Promise<LaporanPengadaanDTO[]> {
    try {
      const res = await api.get<BaseResponseDTO<LaporanPengadaanDTO[]>>(
        '/api/laporan/pengadaan'
      )

      return unwrap(res)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  },
}
