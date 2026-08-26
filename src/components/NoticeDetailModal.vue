<script setup>
import { computed, onUnmounted, watch } from 'vue'
import { X, Paperclip, Building2, Calendar, Eye } from 'lucide-vue-next'

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

const categoryClass = computed(() => {
  const cat = props.notice?.category
  if (cat === '보도자료') return 'bg-point-light text-point'
  if (cat === '고시공고') return 'bg-amber-50 text-amber-800'
  return 'bg-slate-100 text-slate-700'
})

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
      class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      :aria-label="notice.title"
    >
      <button
        type="button"
        class="absolute inset-0 bg-slate-900/40"
        aria-label="닫기"
        @click="emit('close')"
      />

      <div class="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded border border-border bg-white shadow-sm fade-up">
        <div class="flex items-start justify-between gap-3 border-b border-border bg-slate-50 px-5 py-4">
          <div class="min-w-0">
            <span
              class="mb-2 inline-block rounded px-2 py-0.5 text-xs font-semibold"
              :class="categoryClass"
            >
              {{ notice.category }}
            </span>
            <h2 class="text-[1.125rem] font-bold leading-snug text-navy">
              {{ notice.title }}
            </h2>
          </div>
          <button
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-border text-slate-500 hover:bg-white"
            aria-label="닫기"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <div class="grid gap-2 border-b border-border bg-white px-5 py-3 text-sm text-slate-600 sm:grid-cols-3">
          <p class="flex items-center gap-1.5 truncate">
            <Building2 :size="14" class="text-point" />
            <span class="text-slate-500">담당부서</span>
            <span class="truncate font-medium text-slate-800">{{ notice.department }}</span>
          </p>
          <p class="flex items-center gap-1.5 truncate">
            <Calendar :size="14" class="text-point" />
            <span class="text-slate-500">작성일</span>
            <span class="font-medium text-slate-800">{{ formatDate(notice.date) }}</span>
          </p>
          <p class="flex items-center gap-1.5 truncate">
            <Eye :size="14" class="text-point" />
            <span class="text-slate-500">조회수</span>
            <span class="font-medium text-slate-800">{{ notice.viewCount }}</span>
          </p>
        </div>

        <div class="overflow-y-auto px-5 py-5">
          <p class="whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {{ notice.content }}
          </p>

          <div
            v-if="notice.attachment"
            class="mt-6 rounded border border-border bg-slate-50 px-4 py-3"
          >
            <p class="mb-1 text-xs font-semibold text-slate-500">첨부파일</p>
            <p class="flex items-center gap-2 text-sm text-navy">
              <Paperclip :size="15" class="text-point" />
              <span class="truncate">{{ notice.attachment }}</span>
            </p>
            <p class="mt-1 text-xs text-slate-500">※ 테스트 환경에서는 실제 다운로드가 제공되지 않습니다.</p>
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t border-border bg-slate-50 px-5 py-3">
          <button
            type="button"
            class="rounded border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            @click="emit('close')"
          >
            목록으로 / 닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
