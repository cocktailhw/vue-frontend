<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { ChevronDown, ChevronUp, Download, FileText, X } from 'lucide-vue-next'
import http from '../utils/http'
import { sanitizeFilename, sanitizeStoredFileName } from '../utils/file'

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

const categoryLabel = computed(() => props.notice?.category || '공지사항')

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
  const safeStoredName = sanitizeStoredFileName(storedFileName.value)
  if (!safeStoredName) {
    window.alert('다운로드할 첨부파일이 없습니다.')
    return
  }

  downloading.value = true
  let blobUrl = ''
  try {
    const blob = await http.get(
      `/v1/portal/files/download/${encodeURIComponent(safeStoredName)}`,
      { responseType: 'blob' },
    )

    blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = sanitizeFilename(originalFileName.value, safeStoredName)
    document.body.appendChild(a)
    a.click()
    a.remove()
  } catch {
    window.alert('파일 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
  } finally {
    if (blobUrl) URL.revokeObjectURL(blobUrl)
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
    <Transition name="modal">
      <div
        v-if="open && notice"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0a1628]/55 p-4 pt-10 backdrop-blur-[2px] sm:items-center sm:pt-4"
        role="dialog"
        aria-modal="true"
        :aria-label="notice.title"
      >
        <button type="button" class="absolute inset-0 cursor-default" aria-label="배경 닫기" @click="emit('close')" />

        <div
          class="modal-panel relative z-10 w-full max-w-3xl overflow-hidden border border-[#0F2942]/80 bg-white shadow-[0_24px_64px_-12px_rgba(15,41,66,0.45)]"
        >
          <div class="relative bg-[#0F2942] px-5 py-3.5 text-white">
            <div class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[11px] font-medium tracking-[0.14em] text-white/65 uppercase">
                  행복시청 · 게시물 상세
                </p>
                <h2 class="mt-1 truncate text-base font-bold sm:text-lg">게시물 상세보기</h2>
              </div>
              <button
                type="button"
                class="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-white/25 text-white transition-colors hover:bg-white/10"
                aria-label="닫기"
                @click="emit('close')"
              >
                <X :size="16" />
              </button>
            </div>
          </div>

          <div class="border-b border-slate-200 bg-[#f7f8fa] px-5 py-4">
            <span
              class="mb-2 inline-block border border-[#0F2942]/20 bg-white px-2 py-0.5 text-[11px] font-bold tracking-wide text-[#0F2942]"
            >
              {{ categoryLabel }}
            </span>
            <h3 class="text-lg font-bold leading-snug text-[#0F172A] sm:text-xl">
              {{ notice.title }}
            </h3>
            <dl class="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3 sm:gap-4 sm:text-sm">
              <div class="flex gap-2">
                <dt class="shrink-0 font-bold text-slate-500">작성부서</dt>
                <dd>{{ notice.department }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 font-bold text-slate-500">작성일</dt>
                <dd>{{ formatDate(notice.date) }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="shrink-0 font-bold text-slate-500">조회</dt>
                <dd>{{ notice.viewCount }}</dd>
              </div>
              <div class="flex gap-2 sm:col-span-3">
                <dt class="shrink-0 font-bold text-slate-500">담당 연락처</dt>
                <dd>{{ notice.contact || '1600-0000' }}</dd>
              </div>
            </dl>
          </div>

          <div class="border-b border-slate-200 bg-[#eef1f4] px-5 py-3.5">
            <p class="mb-2 text-[11px] font-bold tracking-wide text-slate-500">첨부파일</p>
            <div
              v-if="hasAttachment"
              class="flex flex-wrap items-center justify-between gap-3 border border-slate-300/90 bg-white px-3.5 py-3 transition-colors hover:border-[#0F2942]/40"
            >
              <div class="flex min-w-0 items-center gap-3">
                <span
                  class="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-[#0F2942]/15 bg-[#0F2942]/[0.04] text-[#0F2942]"
                  aria-hidden="true"
                >
                  <FileText :size="18" />
                </span>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-[#0F172A]">{{ originalFileName }}</p>
                  <p v-if="formattedFileSize" class="mt-0.5 text-xs text-slate-500">{{ formattedFileSize }}</p>
                </div>
              </div>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 border border-[#0F2942] bg-[#0F2942] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#163a5c] disabled:opacity-50"
                :disabled="downloading || !storedFileName"
                @click="downloadAttachment"
              >
                <Download :size="14" />
                {{ downloading ? '받는 중…' : '다운로드' }}
              </button>
            </div>
            <p
              v-else
              class="border border-dashed border-slate-300 bg-white/70 px-3.5 py-3.5 text-sm text-slate-500"
            >
              첨부파일이 없습니다.
            </p>
          </div>

          <div
            class="min-h-52 border-b border-slate-200 bg-white px-5 py-6 text-[15px] leading-8 text-[#2a2a2a] whitespace-pre-line sm:px-7"
          >
            {{ notice.content }}
          </div>

          <div class="divide-y divide-slate-200 border-b border-slate-200 text-sm">
            <button
              type="button"
              class="group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[#f7f8fa] disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-white"
              :disabled="!prevNotice"
              @click="goPrev"
            >
              <span class="inline-flex items-center gap-1 shrink-0 font-bold text-[#0F2942] group-disabled:text-slate-400">
                <ChevronUp :size="14" />
                이전글
              </span>
              <span class="truncate text-slate-700 group-disabled:text-slate-400">
                {{ prevNotice ? prevNotice.title : '이전 글이 없습니다.' }}
              </span>
            </button>
            <button
              type="button"
              class="group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[#f7f8fa] disabled:cursor-default disabled:text-slate-400 disabled:hover:bg-white"
              :disabled="!nextNotice"
              @click="goNext"
            >
              <span class="inline-flex items-center gap-1 shrink-0 font-bold text-[#0F2942] group-disabled:text-slate-400">
                <ChevronDown :size="14" />
                다음글
              </span>
              <span class="truncate text-slate-700 group-disabled:text-slate-400">
                {{ nextNotice ? nextNotice.title : '다음 글이 없습니다.' }}
              </span>
            </button>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-2 bg-[#f7f8fa] px-5 py-4">
            <template v-if="isAdmin">
              <button
                type="button"
                class="border border-[#0F2942] bg-white px-6 py-2.5 text-sm font-bold text-[#0F2942] transition-colors hover:bg-[#0F2942] hover:text-white"
                @click="emit('edit', notice)"
              >
                수정
              </button>
              <button
                type="button"
                class="border border-red-800 bg-red-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-900"
                @click="emit('delete', notice)"
              >
                삭제
              </button>
            </template>
            <button
              type="button"
              class="border border-[#0F2942] bg-[#0F2942] px-8 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#163a5c]"
              @click="emit('close')"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s ease;
}
.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition:
    transform 0.26s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.22s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(12px) scale(0.985);
}
</style>
