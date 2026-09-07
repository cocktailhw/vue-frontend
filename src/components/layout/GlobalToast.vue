<script setup>
import { storeToRefs } from 'pinia'
import { X } from 'lucide-vue-next'
import { useUiStore } from '../../stores/ui'

const uiStore = useUiStore()
const { toasts } = storeToRefs(uiStore)

function toastClass(type) {
  switch (type) {
    case 'success':
      return 'border-emerald-800 bg-emerald-700 text-white'
    case 'error':
      return 'border-red-800 bg-red-700 text-white'
    case 'info':
    default:
      return 'border-[#0F2942] bg-[#0F2942] text-white'
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed top-4 right-4 z-[90] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
      aria-live="polite"
    >
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-2 border-2 px-4 py-3 text-sm font-semibold shadow-lg"
          :class="toastClass(toast.type)"
          role="status"
        >
          <p class="min-w-0 flex-1 break-words">{{ toast.message }}</p>
          <button
            type="button"
            class="inline-flex h-6 w-6 shrink-0 items-center justify-center border border-white/40 hover:bg-white/10"
            aria-label="닫기"
            @click="uiStore.removeToast(toast.id)"
          >
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(0.75rem);
}
.toast-move {
  transition: transform 0.22s ease;
}
</style>
