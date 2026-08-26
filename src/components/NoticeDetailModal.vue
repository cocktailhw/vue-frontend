<script setup>
import { computed, onUnmounted, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  notice: {
    type: Object,
    default: null,
  },
  /** Ordered list used for previous/next navigation (usually filtered board list) */
  list: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'navigate'])

const currentIndex = computed(() => {
  if (!props.notice || !props.list.length) return -1
  return props.list.findIndex((item) => item.id === props.notice.id)
})

const prevNotice = computed(() => {
  if (currentIndex.value <= 0) return null
  return props.list[currentIndex.value - 1]
})

const nextNotice = computed(() => {
  if (currentIndex.value < 0 || currentIndex.value >= props.list.length - 1) return null
  return props.list[currentIndex.value + 1]
})

const attachmentName = computed(
  () => props.notice?.attachment || '2026_행복시_공지사항_안내문.hwpx',
)

const attachmentSize = computed(() => props.notice?.attachmentSize || '245 KB')

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

function downloadAttachment() {
  const body = [
    '행복특별시 행복시청',
    '공지사항 안내문 (테스트용)',
    '',
    `제목: ${props.notice?.title ?? ''}`,
    `작성부서: ${props.notice?.department ?? ''}`,
    `작성일: ${formatDate(props.notice?.date)}`,
    '',
    props.notice?.content ?? '',
    '',
    '※ 본 파일은 시스템 테스트용 가상 첨부파일입니다.',
  ].join('\n')

  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = attachmentName.value
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function goPrev() {
  if (prevNotice.value) emit('navigate', prevNotice.value)
}

function goNext() {
  if (nextNotice.value) emit('navigate', nextNotice.value)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && notice"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12 sm:items-center sm:pt-4"
      role="dialog"
      aria-modal="true"
      :aria-label="notice.title"
    >
      <button type="button" class="absolute inset-0 cursor-default" aria-label="배경 닫기" @click="emit('close')" />

      <div class="relative z-10 w-full max-w-3xl rounded-none border-2 border-[#0F2942] bg-white">
        <!-- Dark header bar -->
        <div class="flex items-center justify-between bg-[#0F2942] px-4 py-2.5 text-white">
          <h2 class="text-sm font-bold sm:text-base">행복시청 게시물 상세보기</h2>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center border border-white/40 text-white hover:bg-white/10"
            aria-label="닫기"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Metadata table -->
        <table class="w-full table-fixed border-collapse text-sm text-[#333333]">
          <tbody>
            <tr class="border-b border-slate-300">
              <th class="w-28 bg-slate-100 px-3 py-2.5 text-left font-bold text-[#333333]">제목</th>
              <td class="px-3 py-2.5 font-bold" colspan="3">{{ notice.title }}</td>
            </tr>
            <tr class="border-b border-slate-300">
              <th class="bg-slate-100 px-3 py-2.5 text-left font-bold">작성부서</th>
              <td class="px-3 py-2.5">{{ notice.department }}</td>
              <th class="w-24 bg-slate-100 px-3 py-2.5 text-left font-bold">작성일</th>
              <td class="px-3 py-2.5">{{ formatDate(notice.date) }}</td>
            </tr>
            <tr class="border-b border-slate-300">
              <th class="bg-slate-100 px-3 py-2.5 text-left font-bold">조회수</th>
              <td class="px-3 py-2.5">{{ notice.viewCount }}</td>
              <th class="bg-slate-100 px-3 py-2.5 text-left font-bold">담당자 연락처</th>
              <td class="px-3 py-2.5">{{ notice.contact || '1600-0000' }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Attachment -->
        <div class="border-b border-slate-300 bg-slate-100 p-3">
          <p class="mb-2 text-xs font-bold text-[#333333]">첨부파일</p>
          <div class="flex flex-wrap items-center justify-between gap-2 border border-slate-300 bg-white px-3 py-2">
            <p class="text-sm text-[#333333]">
              {{ attachmentName }}
              <span class="text-slate-500">({{ attachmentSize }})</span>
            </p>
            <button
              type="button"
              class="border border-[#0F2942] bg-[#0F2942] px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
              @click="downloadAttachment"
            >
              다운로드
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="min-h-48 border-b border-slate-300 px-4 py-5 text-sm leading-7 text-[#333333] whitespace-pre-line">
          {{ notice.content }}
        </div>

        <!-- Prev / Next -->
        <div class="space-y-0 border-b border-slate-300 text-sm">
          <button
            type="button"
            class="flex w-full items-center gap-2 border-b border-slate-200 px-4 py-2.5 text-left hover:bg-slate-50 disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-white"
            :disabled="!prevNotice"
            @click="goPrev"
          >
            <span class="shrink-0 font-bold text-[#0F2942]">▲ 이전글</span>
            <span class="truncate">{{ prevNotice ? prevNotice.title : '이전 글이 없습니다.' }}</span>
          </button>
          <button
            type="button"
            class="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-white"
            :disabled="!nextNotice"
            @click="goNext"
          >
            <span class="shrink-0 font-bold text-[#0F2942]">▼ 다음글</span>
            <span class="truncate">{{ nextNotice ? nextNotice.title : '다음 글이 없습니다.' }}</span>
          </button>
        </div>

        <div class="flex justify-center bg-slate-50 px-4 py-4">
          <button
            type="button"
            class="border border-[#0F2942] bg-[#0F2942] px-8 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            @click="emit('close')"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
