<script setup>
import { storeToRefs } from 'pinia'
import { useUiStore } from '../../stores/ui'

const uiStore = useUiStore()
const { loadingCount } = storeToRefs(uiStore)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="loadingCount > 0"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50"
        role="status"
        aria-live="polite"
        aria-label="로딩 중"
      >
        <div class="flex flex-col items-center gap-3 rounded-none border border-white/20 bg-[#0F2942] px-8 py-6 shadow-xl">
          <span
            class="h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-white"
            aria-hidden="true"
          />
          <p class="text-sm font-bold text-white">처리 중…</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
