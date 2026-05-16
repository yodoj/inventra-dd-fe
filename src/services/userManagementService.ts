import apiClient from './api'

export interface UserPerUnit {
  id: string
  email: string
  nama_lengkap: string
  nomor_telepon: string
  role: string
  unit?: string
  nisn?: string
  kelas?: string
  password?: string
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
  },

  async createUser(userData: any) {
    const response = await apiClient.post('/api/users', userData)
    return response.data
  },

  async deleteUser(userId: string) {
    const response = await apiClient.delete(`/api/users/${userId}`)
    return response.data
  },

  async getUserDetail(userId: string) {
    const response = await apiClient.get<{ data: UserPerUnit; message: string }>(`/api/users/per-unit/${userId}`)
    return response.data
  },

  async getUserDetailByAdmin(userId: string) {
    const response = await apiClient.get<{ data: UserPerUnit; message: string }>(`/api/users/${userId}`)
    return response.data
  },

  async updateUser(userId: string, userData: UpdateUserPayload) {
    const response = await apiClient.put<{ message: string }>(`/api/users/${userId}`, userData)
    return response.data
  },

  async changeUserPassword(userId: string, data: { new_password: string; confirm_password: string }) {
    const response = await apiClient.put<{ message: string }>(`/api/users/${userId}/password`, data)
    return response.data
  },

  async getSarprasLintasUnit(page: number = 1, limit: number = 10, search?: string, unit?: string) {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    if (search) params.append('search', search)
    if (unit && unit !== 'Semua Unit') params.append('unit', unit)
    const response = await apiClient.get<UserManagementResponse>(`/api/users/sarpras-lintas-unit?${params.toString()}`)
    return response.data
  }
}

export interface UpdateUserPayload {
  nama_lengkap: string
  email: string
  nomor_telepon?: string
  role: string
  nisn?: string
  kelas?: string
  unit?: string
}
