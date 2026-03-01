import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastMessage[]>([]);

  function addToast(type: ToastType, title: string, message: string, durationMs = 3000) {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    
    toasts.value.push({
      id,
      type,
      title,
      message
    });

    if (durationMs > 0) {
      setTimeout(() => {
        removeToast(id);
      }, durationMs);
    }
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  function success(title: string, message: string, durationMs = 3000) {
    addToast('success', title, message, durationMs);
  }

  function error(title: string, message: string, durationMs = 5000) {
    addToast('error', title, message, durationMs);
  }

  function warning(title: string, message: string, durationMs = 4000) {
    addToast('warning', title, message, durationMs);
  }

  return {
    toasts,
    removeToast,
    success,
    error,
    warning
  };
});
