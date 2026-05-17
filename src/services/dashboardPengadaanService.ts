import api from '@/services/api'
import type { AxiosResponse, AxiosError } from 'axios'
import type { BaseResponseDTO } from '@/interfaces/BaseResponseDTO'

import type { DashboardPengadaan, TopBiaya, BreakdownUnit, TotalPengadaan, BiayaPengadaanChart, JumlahAsetChart, TopCepatHabis } from '@/types/dashboard'

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

export const dashboardPengadaanService = {
  async getListTop5(params?: {
    tahun?: number
    bulan?: number
    kategori?: string
    unit?: string
  }): Promise<{ topBiaya: TopBiaya[], topPengadaan: TopCepatHabis[] }> {
    try {
      const res = await api.get<BaseResponseDTO<{ topBiaya: TopBiaya[], topPengadaan: TopCepatHabis[] }>>(
        '/api/dashboard/pengadaan/top5-pengadaan',
        {
          params: {
            tahun: params?.tahun || undefined,
            bulan: params?.bulan || undefined,
            kategori: params?.kategori || undefined,
            unit: params?.unit || undefined,
          },
        },
      )

      return unwrap(res)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  },
  async getScoreCard(params?: { tahun?: number; unit?: string }): Promise<DashboardPengadaan> {
    try {
      const res = await api.get<BaseResponseDTO<DashboardPengadaan>>(
        '/api/dashboard/pengadaan/jumlah-barang-harga',
        {
          params: {
            tahun: params?.tahun || undefined,
            unit: params?.unit || undefined,
          },
        },
      )

      return unwrap(res)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  },

  async getBiayaPengadaanChart(params?: { unit?: string }): Promise<BiayaPengadaanChart[]> {
    try {
      const res = await api.get<BaseResponseDTO<BiayaPengadaanChart[]>>(
        '/api/dashboard/pengadaan/biaya',
        {
          params: { unit: params?.unit || undefined }
        }
      )
      return unwrap(res)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  },


  async getTopBiaya(): Promise<TopBiaya[]> {
    try {
      const res = await api.get<BaseResponseDTO<TopBiaya[]>>(
        '/api/dashboard/pengadaan/top-5-biaya-besar',
      )

      return unwrap(res)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  },

  async getJumlahAsetChart(params?: { unit?: string }): Promise<JumlahAsetChart[]> {
    try {
      const res = await api.get<BaseResponseDTO<JumlahAsetChart[]>>(
        '/api/dashboard/pengadaan/jumlah-aset',
        {
          params: { unit: params?.unit || undefined }
        }
      )
      return unwrap(res)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  },

  async getTopCepatHabis(params?: { tahun?: number; unit?: string }): Promise<TopCepatHabis[]> {
    try {
      const res = await api.get<BaseResponseDTO<TopCepatHabis[]>>(
        '/api/dashboard/pengadaan/top-cepat-habis',
        {
          params: {
            tahun: params?.tahun || undefined,
            unit: params?.unit || undefined,
          },
        }
      )
      return unwrap(res)
    } catch (err) {
      throw new Error(getErrorMessage(err))
    }
  }
}
