<script setup lang="ts">
import { useToastStore } from '@/stores/toast';
import { Check, X, AlertCircle, X as CloseIcon } from 'lucide-vue-next';

const toastStore = useToastStore();
</script>

<template>
  <div class="toast-container">
    <transition-group name="toast-list">
      <div 
        v-for="toast in toastStore.toasts" 
        :key="toast.id" 
        class="toast-item"
        :class="`toast-${toast.type}`"
      >
        <div class="icon-wrapper">
          <Check v-if="toast.type === 'success'" class="icon-lucide" />
          <X v-else-if="toast.type === 'error'" class="icon-lucide" />
          <AlertCircle v-else-if="toast.type === 'warning'" class="icon-lucide" />
        </div>
        
        <div class="content">
          <h4 class="title">{{ toast.title }}</h4>
          <p class="description">{{ toast.message }}</p>
        </div>

        <button @click="toastStore.removeToast(toast.id)" class="close-btn">
          <CloseIcon class="w-4 h-4" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none; /* Let clicks pass through empty space */
}

.toast-item {
  pointer-events: auto; /* Re-enable clicks on the toast itself */
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background-color: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 16px;
  width: 380px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  font-family: var(--font-family);
  position: relative;
}

/* Success Styling */
.toast-success {
  background-color: #F0FDF4; /* Very light green */
  border: 1px solid #BBF7D0;
  border-left: 6px solid #22C55E;
}
.toast-success .icon-wrapper {
  color: #22C55E;
}

/* Error Styling */
.toast-error {
  background-color: #FEF2F2; /* Very light red */
  border: 1px solid #FECACA;
  border-left: 6px solid #EF4444;
}
.toast-error .icon-wrapper {
  color: #EF4444; /* Red */
}

/* Warning Styling */
.toast-warning {
  background-color: #FFFBEB; /* Very light yellow */
  border: 1px solid #FEF08A;
  border-left: 6px solid #F59E0B;
}
.toast-warning .icon-wrapper {
  color: #F59E0B; /* Amber/Yellow for Warning */
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.icon-lucide {
  width: 24px;
  height: 24px;
}

.content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
  margin: 0;
  line-height: 1.4;
}

.toast-success .title { color: #166534; }
.toast-error .title { color: #991B1B; }
.toast-warning .title { color: #92400E; }

.description {
  font-weight: 400;
  color: var(--text-secondary);
  font-size: 14px;
  margin: 4px 0 0 0;
  line-height: 1.4;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background-color: rgba(0,0,0,0.05);
  color: var(--text-primary);
}

/* Vue Transition Group Classes */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s ease;
}
.toast-list-enter-from {
  opacity: 0;
  transform: translateX(50px);
}
.toast-list-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
</style>
