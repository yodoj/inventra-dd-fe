import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';
import { toast } from 'vue-sonner';

const api = axios.create({
  baseURL: 'http://localhost:8080'
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
      // Token expired or invalid
      const authStore = useAuthStore();
      authStore.logout();
      toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
      router.push('/login');
      return Promise.reject(error);
    }

    if (error.response?.status === 400) {
      // Bad request - validation error
      toast.error(error.response?.data?.message || 'Input tidak valid');
      return Promise.reject(error);
    }

    if (error.response?.status === 500) {
      // Server error
      toast.error('Terjadi kesalahan server. Silakan coba lagi.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
