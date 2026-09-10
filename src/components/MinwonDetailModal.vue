<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { X } from 'lucide-vue-next'
import { usePortalStore } from '../stores/portal'
import { useUiStore } from '../stores/ui'

const props = defineProps({
  open: { type: Boolean, default: false },
  item: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'require-auth'])

const portalStore = usePortalStore()
const { currentUser } = storeToRefs(portalStore)
const uiStore = useUiStore()

const applying = ref(false)

function onKeydown(event) {
  if (event.key === 'Escape' && !applying.value) emit('close')
}

watch(
  () => props.open,
  (value) => {
    document.body.style.overflow = value ? 'hidden' : ''
    if (value) {
      applying.value = false
      window.addEventListener('keydown', onKeydown)
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})

async function onApply() {
  if (applying.value) return

  if (!currentUser.value) {
    uiStore.showToast('민원 신청을 위해 로그인이 필요합니다.', 'error')
    emit('close')
    emit('require-auth')
    return
  }

  applying.value = true
  try {
    await portalStore.applyMinwon({
      title: props.item?.title ?? '민원 신청',
      content: '인터넷 자동 접수',
    })
    uiStore.showToast('접수가 완료되었습니다.', 'success')
    emit('close')
  } catch {
    // Global axios interceptor already surfaces most errors via GlobalToast.
    uiStore.showToast('민원 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'error')
  } finally {
    applying.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && item"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="item.title"
    >
      <button
        type="button"
        class="absolute inset-0"
        aria-label="닫기"
        :disabled="applying"
        @click="emit('close')"
      />
      <div class="relative z-10 w-full max-w-lg border-2 border-[#0F2942] bg-white">
        <div class="flex items-center justify-between bg-[#0F2942] px-4 py-2.5 text-white">
          <h2 class="text-sm font-bold">민원 상세안내</h2>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center border border-white/40 disabled:opacity-50"
            aria-label="닫기"
            :disabled="applying"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <table class="w-full table-fixed border-collapse text-sm text-[#333333]">
          <tbody>
            <tr class="border-b border-slate-300">
              <th class="w-28 bg-slate-100 px-3 py-2.5 text-left font-bold">민원명</th>
              <td class="px-3 py-2.5 font-bold">{{ item.title }}</td>
            </tr>
            <tr class="border-b border-slate-300">
              <th class="bg-slate-100 px-3 py-2.5 text-left font-bold">처리기관</th>
              <td class="px-3 py-2.5">{{ item.agency }}</td>
            </tr>
            <tr class="border-b border-slate-300">
              <th class="bg-slate-100 px-3 py-2.5 text-left font-bold">수수료</th>
              <td class="px-3 py-2.5">{{ item.fee }}</td>
            </tr>
          </tbody>
        </table>

        <div class="border-b border-slate-300 px-4 py-3">
          <p class="mb-2 text-sm font-bold text-[#0F2942]">구비서류 목록</p>
          <ul class="list-disc space-y-1 pl-5 text-sm text-[#333333]">
            <li v-for="doc in item.documents" :key="doc">{{ doc }}</li>
          </ul>
        </div>

        <div class="flex justify-center gap-2 bg-slate-50 px-4 py-4">
          <button
            type="button"
            class="border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold disabled:opacity-60"
            :disabled="applying"
            @click="emit('close')"
          >
            닫기
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 border border-[#0F2942] bg-[#0F2942] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            :disabled="applying"
            @click="onApply"
          >
            <span
              v-if="applying"
              class="inline-block h-3.5 w-3.5 animate-spin border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
            {{ applying ? '접수 중…' : '인터넷 발급 / 신청하기' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
