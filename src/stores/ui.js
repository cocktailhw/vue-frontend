import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const loadingCount = ref(0)
  const toasts = ref([])

  const toastTimers = new Map()

  function startLoading() {
    loadingCount.value += 1
  }

  function stopLoading() {
    loadingCount.value = Math.max(0, loadingCount.value - 1)
  }

  function removeToast(id) {
    const timer = toastTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      toastTimers.delete(id)
    }
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function showToast(message, type = 'info', duration = 3000) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    toasts.value = [...toasts.value, { id, message: String(message ?? ''), type }]

    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id)
      }, duration)
      toastTimers.set(id, timer)
    }

    return id
  }

  return {
    loadingCount,
    toasts,
    startLoading,
    stopLoading,
    showToast,
    removeToast,
  }
})
