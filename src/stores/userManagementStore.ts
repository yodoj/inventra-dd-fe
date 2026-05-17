import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userManagementService, type UserPerUnit } from '@/services/userManagementService'
import { useToastStore } from './toast'
import { useAuthStore } from './auth'

export const useUserManagementStore = defineStore('userManagement', () => {
  const users = ref<UserPerUnit[]>([])
  const loading = ref(false)
  const totalItems = ref(0)
  const totalPages = ref(1)
  const currentPage = ref(1)

  const fetchUsers = async (page: number = 1, limit: number = 10, search?: string, role?: string, unit?: string) => {
    loading.value = true
    const authStore = useAuthStore()

    try {
      let response;
      if (authStore.userRole === 'ADMIN') {
        response = await userManagementService.getAllUsers(page, limit, search, role, unit)
      } else {
        response = await userManagementService.getUsersPerUnit(page, limit, search, role)
      }

      if (response && response.data) {
        users.value = response.data.data
        totalItems.value = response.data.total_items
        totalPages.value = response.data.total_pages
        currentPage.value = response.data.current_page
      }
    } catch (error: any) {
      // Error handled by global API interceptor in api.ts
    } finally {
      loading.value = false
    }
  }

  const createUser = async (userData: any) => {
    loading.value = true
    const toastStore = useToastStore()
    try {
      const response = await userManagementService.createUser(userData)
      toastStore.success('Success', response.message || 'Akun pengguna berhasil ditambahkan')
      return { success: true, message: response.message }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal menambahkan akun pengguna'
      // Error toast is handled by global api.ts interceptor to avoid double notifications
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (userId: string) => {
    loading.value = true
    const toastStore = useToastStore()
    try {
      const response = await userManagementService.deleteUser(userId)
      toastStore.success('Success', response.message || 'Akun pengguna berhasil dihapus')
      return { success: true, message: response.message }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal menghapus akun pengguna'
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const fetchUserDetail = async (userId: string) => {
    loading.value = true
    const authStore = useAuthStore()
    try {
      const response = authStore.userRole === 'ADMIN'
        ? await userManagementService.getUserDetailByAdmin(userId)
        : await userManagementService.getUserDetail(userId)
      if (response && response.data) {
        return { success: true, data: response.data }
      }
      return { success: false, data: null }
    } catch (error: any) {
      console.error('Error fetching user detail:', error)
      return { success: false, data: null }
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (userId: string, userData: any) => {
    loading.value = true
    const toastStore = useToastStore()
    try {
      const response = await userManagementService.updateUser(userId, userData)
      toastStore.success('Success', response.message || 'Akun pengguna berhasil diperbarui')
      return { success: true, message: response.message }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal memperbarui akun pengguna'
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const changeUserPassword = async (userId: string, data: { new_password: string; confirm_password: string }) => {
    loading.value = true
    const toastStore = useToastStore()
    try {
      const response = await userManagementService.changeUserPassword(userId, data)
      toastStore.success('Success', response.message || 'Password pengguna berhasil diperbarui')
      return { success: true, message: response.message }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal memperbarui password pengguna'
      return { success: false, message: errorMessage }
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    loading,
    totalItems,
    totalPages,
    currentPage,
    fetchUsers,
    createUser,
    deleteUser,
    fetchUserDetail,
    updateUser,
    changeUserPassword
  }
})
