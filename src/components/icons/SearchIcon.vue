<template>
  <svg
    :class="['icon', customClass]"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    :stroke-width="strokeWidth"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 5.4 5.4a7.5 7.5 0 0 0 11.25 11.25Z"
    />
  </svg>
</template>

<script setup>

defineProps({
  customClass: {
    type: String,
    default: "",
  },
  strokeWidth: {
    type: [String, Number],
    default: 2,
  },
});
</script>

<style scoped>
.icon {
  width: 18px;
  height: 18px;
}
</style>
