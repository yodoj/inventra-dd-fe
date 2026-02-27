<script setup lang="ts">
import { Check } from 'lucide-vue-next';

defineProps<{
  message: string;
}>();
</script>

<template>
  <div class="success-toast">
    <div class="icon-wrapper">
      <Check class="w-6 h-6" />
    </div>
    <div class="content">
      <h4 class="title">Success</h4>
      <p class="description">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.success-toast {
  display: flex;
  align-items: center;
  gap: 20px;
  background-color: #E6F7F0;
  border: 1px solid #008B58;
  border-left: 6px solid #008B58;
  border-radius: 12px;
  padding: 16px 24px;
  min-width: 420px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.icon-wrapper {
  color: #008B58;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  display: flex;
  flex-direction: column;
}

.title {
  font-weight: 600;
  color: #1F2937;
  font-size: 18px;
  margin: 0;
  line-height: 1.2;
}

.description {
  font-weight: 400;
  color: #4B5563;
  font-size: 14px;
  margin: 4px 0 0 0;
}
</style>
