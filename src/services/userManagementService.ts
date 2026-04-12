import apiClient from './api'

export interface UserPerUnit {
  id: string
  email: string
  nama_lengkap: string
  nomor_telepon: string
  role: string
  unit?: string
}

export interface PaginationData {
  total_items: number
  total_pages: number
  current_page: number
}

export interface UserManagementResponse {
  data: {
    data: UserPerUnit[]
    total_items: number
    total_pages: number
    current_page: number
  }
  message: string
}

export const userManagementService = {
  async getUsersPerUnit(page: number = 1, limit: number = 10, search?: string, role?: string) {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    if (search) {
      params.append('search', search)
    }
    
    if (role && role !== 'Semua Role') {
      params.append('role', role)
    }

    const response = await apiClient.get<UserManagementResponse>(`/api/users/per-unit?${params.toString()}`)
    return response.data
  },

  async getAllUsers(page: number = 1, limit: number = 10, search?: string, role?: string, unit?: string) {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    if (search) {
      params.append('search', search)
    }
    
    if (role && role !== 'Semua Role') {
      params.append('role', role)
    }

    if (unit && unit !== 'Semua Unit') {
      params.append('unit', unit)
    }

    const response = await apiClient.get<UserManagementResponse>(`/api/users?${params.toString()}`)
    return response.data
  }
}
