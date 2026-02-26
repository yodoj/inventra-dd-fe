<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import Navbar from '@/components/Navbar.vue'
import { computed } from 'vue'

const route = useRoute()
const showNavbar = computed(() => route.path !== '/login')
</script>

<template>
  <Toaster position="top-center" richColors />
  <Navbar v-if="showNavbar" />
  <main :class="{ 'with-navbar': showNavbar }">
    <RouterView />
  </main>
</template>

<style>
.with-navbar {
  padding-top: 0;
}
body {
  background-color: #FAFAFA;
}
</style>
