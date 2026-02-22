<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  name: string;
  role?: string;
  size?: 'small' | 'medium' | 'large';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
});

const initials = computed(() => {
  return props.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
});

const sizeMap = {
  small: '48px',
  medium: '64px',
  large: '200px'
};

const fontSize = {
  small: '16px',
  medium: '24px',
  large: '72px'
};

const currentSize = computed(() => sizeMap[props.size]);
const currentFontSize = computed(() => fontSize[props.size]);
</script>

<template>
  <div class="profile-avatar">
    <span class="initials">{{ initials }}</span>
  </div>
</template>

<style scoped>
.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: v-bind(currentSize);
  height: v-bind(currentSize);
  border-radius: 50%;
  background-color: #00588f;
  color: white;
  font-weight: 600;
  font-size: v-bind(currentFontSize);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 88, 143, 0.25);
}

.initials {
  letter-spacing: 1px;
}
</style>
