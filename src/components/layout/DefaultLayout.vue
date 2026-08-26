<script setup>
import AppHeader from './Header.vue'
import AppFooter from './Footer.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-slate-50 text-[#333333]">
    <AppHeader />
    <div class="flex-1">
      <RouterView />
    </div>
    <AppFooter />
  </div>
</template>
