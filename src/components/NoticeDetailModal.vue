<script setup>
import { onUnmounted, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  notice: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (value) => {
    document.body.style.overflow = value ? 'hidden' : ''
    if (value) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})

function formatDate(value) {
  if (!value) return '—'
  const text = String(value)
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : text
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && notice"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16 sm:items-center sm:pt-4"
      role="dialog"
      aria-modal="true"
      :aria-label="notice.title"
    >
      <button type="button" class="absolute inset-0 cursor-default" aria-label="닫기" @click="emit('close')" />

      <div class="relative z-10 w-full max-w-3xl border border-slate-300 bg-white">
        <div class="flex items-start justify-between gap-3 border-b border-slate-300 bg-slate-100 px-4 py-3">
          <div class="min-w-0">
            <span class="mb-1 inline-block rounded-none bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700">
              {{ notice.category }}
            </span>
            <h2 class="text-base font-bold text-gov-navy">{{ notice.title }}</h2>
          </div>
          <button
            type="button"
            class="border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            @click="emit('close')"
          >
            닫기
          </button>
        </div>

        <table class="w-full table-fixed border-collapse text-sm">
          <tbody>
            <tr class="border-b border-slate-200">
              <th class="w-28 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600">담당부서</th>
              <td class="px-3 py-2">{{ notice.department }}</td>
              <th class="w-24 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600">작성일</th>
              <td class="px-3 py-2">{{ formatDate(notice.date) }}</td>
            </tr>
            <tr class="border-b border-slate-200">
              <th class="bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600">조회수</th>
              <td class="px-3 py-2" colspan="3">{{ notice.viewCount }}</td>
            </tr>
          </tbody>
        </table>

        <div class="min-h-40 border-b border-slate-200 px-4 py-5 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
          {{ notice.content }}
        </div>

        <div v-if="notice.attachment" class="border-b border-slate-200 px-4 py-3 text-sm">
          <span class="font-semibold text-slate-600">첨부파일 :</span>
          <span class="ml-2 text-gov-blue">{{ notice.attachment }}</span>
          <p class="mt-1 text-xs text-slate-500">※ 테스트 환경에서는 실제 다운로드가 제공되지 않습니다.</p>
        </div>

        <div class="flex justify-center bg-slate-50 px-4 py-3">
          <button
            type="button"
            class="border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-gov-navy hover:bg-slate-100"
            @click="emit('close')"
          >
            목록으로 / 닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
