import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';
import { toast } from 'vue-sonner';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Request Interceptor - Add token to headers
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle 401 and other errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid (skip for login requests to avoid incorrect error message)
      if (!error.config?.url?.includes('/api/auth/login')) {
        const authStore = useAuthStore();
        authStore.logout();
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
        router.push('/login');
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 400) {
      // Bad request - validation error (handled by components)
      return Promise.reject(error);
    }

    if (error.response?.status === 500) {
      // Server error (handled by components)
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
