<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { FileText, X } from 'lucide-vue-next'
import axios from 'axios'

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
  isAdmin: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'navigate', 'edit', 'delete'])

const downloading = ref(false)

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

const hasAttachment = computed(() => Boolean(props.notice?.originalFileName))

const originalFileName = computed(() => props.notice?.originalFileName || '')

const storedFileName = computed(() => props.notice?.storedFileName || '')

const formattedFileSize = computed(() => formatFileSize(props.notice?.fileSize ?? props.notice?.attachmentSize))

const downloadHref = computed(() => {
  if (!storedFileName.value) return ''
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  return `${base}/v1/portal/files/download/${encodeURIComponent(storedFileName.value)}`
})

function formatFileSize(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'string' && /[a-zA-Z]/.test(value)) return value
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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

async function downloadAttachment() {
  if (!storedFileName.value || !downloadHref.value) {
    window.alert('다운로드할 첨부파일이 없습니다.')
    return
  }

  downloading.value = true
  try {
    const token = localStorage.getItem('accessToken')
    const response = await axios.get(downloadHref.value, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })

    const blobUrl = URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = originalFileName.value || storedFileName.value
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(blobUrl)
  } catch {
    // JWT 불필요·직접 링크 가능한 경우 폴백
    const a = document.createElement('a')
    a.href = downloadHref.value
    a.download = originalFileName.value || storedFileName.value
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    downloading.value = false
  }
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

        <div class="border-b border-slate-300 bg-slate-100 p-3">
          <p class="mb-2 text-xs font-bold text-[#333333]">첨부파일</p>
          <div
            v-if="hasAttachment"
            class="flex flex-wrap items-center justify-between gap-2 border border-slate-400 bg-white px-3 py-2.5"
          >
            <div class="flex min-w-0 items-center gap-2">
              <span
                class="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-slate-400 bg-slate-50 text-[#0F2942]"
                aria-hidden="true"
              >
                <FileText :size="16" />
              </span>
              <p class="min-w-0 truncate text-sm text-[#333333]">
                <span class="font-medium">{{ originalFileName }}</span>
                <span v-if="formattedFileSize" class="ml-1 text-slate-500">({{ formattedFileSize }})</span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <a
                v-if="downloadHref"
                :href="downloadHref"
                class="border border-slate-400 bg-white px-3 py-1.5 text-xs font-bold text-[#0F2942] hover:bg-slate-50"
                :download="originalFileName"
                target="_blank"
                rel="noopener"
              >
                새 창
              </a>
              <button
                type="button"
                class="border border-[#0F2942] bg-[#0F2942] px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                :disabled="downloading || !storedFileName"
                @click="downloadAttachment"
              >
                {{ downloading ? '받는 중…' : '다운로드' }}
              </button>
            </div>
          </div>
          <p v-else class="border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-500">
            첨부파일이 없습니다.
          </p>
        </div>

        <div class="min-h-48 border-b border-slate-300 px-4 py-5 text-sm leading-7 text-[#333333] whitespace-pre-line">
          {{ notice.content }}
        </div>

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

        <div class="flex flex-wrap items-center justify-center gap-2 bg-slate-50 px-4 py-4">
          <template v-if="isAdmin">
            <button
              type="button"
              class="border border-[#0F2942] bg-white px-6 py-2.5 text-sm font-bold text-[#0F2942] hover:bg-slate-100"
              @click="emit('edit', notice)"
            >
              수정
            </button>
            <button
              type="button"
              class="border border-red-700 bg-red-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-800"
              @click="emit('delete', notice)"
            >
              삭제
            </button>
          </template>
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
