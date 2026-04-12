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
    const toast = useToastStore()
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
      toast.showToast(error.response?.data?.message || 'Gagal mengambil data akun pengguna', 'error')
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
    fetchUsers
  }
})
