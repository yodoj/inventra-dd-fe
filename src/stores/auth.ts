import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<any>(JSON.parse(localStorage.getItem('user') || 'null'));
    const token = ref<string | null>(localStorage.getItem('token'));

    const isAuthenticated = computed(() => !!token.value);
    const userRole = computed(() => user.value?.role || null);
    const userName = computed(() => user.value?.name || null);

    function setAuth(userData: any, userToken: string) {
        user.value = userData;
        token.value = userToken;
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userToken);
    }

    function logout() {
        user.value = null;
        token.value = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }

    function checkAuth() {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            user.value = JSON.parse(storedUser);
            token.value = storedToken;
        }
    }

    return {
        user,
        token,
        isAuthenticated,
        userRole,
        userName,
        setAuth,
        logout,
        checkAuth
    };
});
