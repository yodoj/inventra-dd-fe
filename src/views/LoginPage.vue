<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Package,
  ArrowLeft
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

import api from '@/services/api';

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const hasError = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const clearError = () => {
  if (hasError.value) {
    hasError.value = false;
    errorMessage.value = '';
  }
};

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Mohon isi email dan password Anda.';
    hasError.value = true;
    toastStore.error('Error', errorMessage.value);
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  hasError.value = false;
  
  try {
    const response = await api.post('/api/auth/login', {
      email: email.value.trim(),
      password: password.value
    });
    
    const loginData = response.data.data;
    authStore.setAuth(loginData, loginData.token);
    router.push('/');
    toastStore.success('Success', 'Login Berhasil');
  } catch (err: any) {
    const errorMsg = err.response?.data?.message || 'Login gagal. Periksa kembali email dan password Anda.';
    errorMessage.value = errorMsg;
    hasError.value = true;
    password.value = ''; // Reset only password for efficiency
    toastStore.error('Error', errorMsg);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <!-- Left Column: Branding & Info -->
    <div class="info-column">
      <router-link to="/" class="back-link">
        <ArrowLeft class="icon-sm" /> Back to Home
      </router-link>

      <div class="branding-content">
        <div class="brand-logo">
          <img src="@/assets/logo-dd.png" alt="Dian Didaktika Logo" />
        </div>
        
        <div class="brand-text">
          <h2 class="h2-headline">Welcome to</h2>
          <h2 class="h2-headline">Inventory & Resource Asset System</h2>
          <h2 class="h2-headline">Sekolah Dian Didaktika</h2>
        </div>
        
        <p class="b1-body description">
          Pendidikan Paripurna Bernafaskan Islam,<br />
          PRIMA (Peduli, Religius, Integritas, Mandiri, Adaptif) -<br />
          Sekolah Islam Dian Didaktika
        </p>
      </div>
    </div>

    <!-- Right Column: Login Form -->
    <div class="form-column">
      <div class="login-card-wrapper">
        <div class="login-card fade-in">
          <div class="card-header">
            <p class="b2-body">Welcome to INVENTRA <Package class="icon-sm" /></p>
            <h1 class="h1-headline">Sign in</h1>
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
            <!-- Email Field -->
            <div class="form-group">
              <label class="c1-caption">
                Enter your email address <span class="required-asterisk">*</span>
              </label>
              <div class="input-wrapper" :class="{ 'input-error': hasError }">
                <Mail class="input-icon" />
                <input 
                  type="email" 
                  v-model="email" 
                  placeholder="Email address" 
                  required
                  @input="clearError"
                />
              </div>
            </div>

            <!-- Password Field -->
            <div class="form-group">
              <label class="c1-caption">
                Enter your password <span class="required-asterisk">*</span>
              </label>
              <div class="input-wrapper" :class="{ 'input-error': hasError }">
                <Lock class="input-icon" />
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  v-model="password" 
                  placeholder="Password" 
                  required
                  @input="clearError"
                />
                <button type="button" @click="togglePassword" class="toggle-password">
                  <Eye v-if="!showPassword" />
                  <EyeOff v-else />
                </button>
              </div>
              <p v-if="hasError" class="error-msg c2-caption">{{ errorMessage }}</p>
            </div>

            <button type="submit" class="btn-submit btn-giant" :disabled="isLoading">
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* Info Column */
.info-column {
  flex: 1;
  background: var(--white);
  padding: 80px;
  display: flex;
  align-items: center;
  position: relative;
}

.branding-content {
  max-width: 500px;
}

.back-link {
  position: absolute;
  top: 40px;
  left: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  padding: 10px 16px;
  border-radius: 12px;
}

.back-link:hover {
  color: var(--primary-main);
  background-color: var(--primary-50);
}

.brand-logo {
  margin-bottom: 60px;
}

.brand-logo img {
  height: 120px;
}

.brand-text {
  margin-bottom: 32px;
}

.primary-text {
  color: var(--primary-main);
}

.description {
  color: var(--text-secondary);
}

/* Form Column */
.form-column {
  flex: 1;
  background-color: var(--primary-700);
  background-image: url('@/assets/background-login.png');
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Login Card */
.login-card-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 500px;
  padding: 20px;
}

.login-card {
  background: var(--white);
  padding: 60px 48px;
  border-radius: var(--border-radius-lg);
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
}

.card-header {
  margin-bottom: 40px;
}

.card-header p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.h1-headline {
  color: var(--text-primary);
}

/* Form Styles */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: var(--text-secondary);
  padding-left: 4px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: var(--text-secondary);
  width: 20px;
}

.input-wrapper input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 1px solid #DEDEDE;
  border-radius: var(--border-radius-sm);
  font-family: var(--font-family);
  font-size: 16px;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.input-wrapper.input-error {
  border-color: var(--error);
}

.input-wrapper.input-error input {
  border-color: var(--error);
  color: var(--error);
}

.input-wrapper.input-error .input-icon {
  color: var(--error);
}

.error-text {
  color: var(--error) !important;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--primary-main);
  box-shadow: 0 0 0 4px rgba(31, 162, 255, 0.1);
}

.toggle-password {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-submit {
  margin-top: 16px;
  background-color: var(--primary-700);
  color: var(--white);
  border: none;
  padding: 18px;
  border-radius: 40px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.btn-submit:hover {
  background-color: var(--primary-800);
  transform: translateY(-2px);
}

.btn-submit:active {
  transform: translateY(0);
}

.btn-submit:disabled {
  background-color: #A0A0A0;
  cursor: not-allowed;
  transform: none;
}

.error-msg {
  color: var(--error);
  padding-left: 4px;
}

.required-asterisk {
  color: var(--error);
  margin-left: 2px;
}

.icon-sm {
  width: 18px;
  height: 18px;
}

/* Responsive */
@media (max-width: 1024px) {
  .info-column {
    padding: 60px;
  }
}

@media (max-width: 900px) {
  .login-page {
    flex-direction: column;
  }
  
  .info-column {
    padding: 40px 20px;
    justify-content: center;
    text-align: center;
  }
  
  .branding-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .brand-logo {
    margin-bottom: 30px;
  }
  
  .brand-logo img {
    height: 80px;
  }
  
  .h2-headline {
    font-size: 32px;
    line-height: 40px;
  }
  
  .form-column {
    padding: 60px 20px;
  }
}
</style>
