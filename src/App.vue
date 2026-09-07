<script setup>
import { RouterView } from 'vue-router'
import GlobalLoading from './components/layout/GlobalLoading.vue'
import GlobalToast from './components/layout/GlobalToast.vue'
</script>

<template>
  <RouterView />
  <GlobalLoading />
  <GlobalToast />
</template>
