<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // create | edit
  notice: { type: Object, default: null },
  /** Parent-driven submit state so the modal stays disabled until the API call settles */
  submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'submit'])

const ALLOWED_EXT = ['.pdf', '.hwpx', '.hwp', '.doc', '.docx']

const typeOptions = [{ value: 'NOTICE', label: 'NOTICE (공지사항)' }]

const statusOptions = ['접수중', '마감', '-']

const categoryOptions = ['공지사항', '고시공고', '보도자료']

const form = ref({
  type: 'NOTICE',
  category: '공지사항',
  title: '',
  department: '',
  status: '-',
  content: '',
})

const selectedFile = ref(null)
const fileInputKey = ref(0)
const existingFileName = ref('')

const isSubmitting = computed(() => props.submitting)

const isEdit = computed(() => props.mode === 'edit')
const title = computed(() => (isEdit.value ? '게시물 수정' : '게시물 신규 등록'))

const submitLabel = computed(() => {
  if (isSubmitting.value) return isEdit.value ? '저장 중…' : '등록 중…'
  return isEdit.value ? '수정 저장' : '등록'
})

function resetForm() {
  selectedFile.value = null
  fileInputKey.value += 1
  if (props.mode === 'edit' && props.notice) {
    form.value = {
      type: 'NOTICE',
      category: props.notice.category || '공지사항',
      title: props.notice.title || '',
      department: props.notice.department || '',
      status: props.notice.status || '-',
      content: props.notice.content || '',
    }
    existingFileName.value = props.notice.originalFileName || props.notice.attachment || ''
  } else {
    form.value = {
      type: 'NOTICE',
      category: '공지사항',
      title: '',
      department: '',
      status: '-',
      content: '',
    }
    existingFileName.value = ''
  }
}

function handleFileChange(event) {
  const file = event.target.files?.[0] ?? null
  if (!file) {
    selectedFile.value = null
    return
  }
  const lower = file.name.toLowerCase()
  const ok = ALLOWED_EXT.some((ext) => lower.endsWith(ext))
  if (!ok) {
    window.alert('허용 확장자: pdf, hwpx, hwp, doc, docx')
    event.target.value = ''
    selectedFile.value = null
    return
  }
  selectedFile.value = file
}

function onKeydown(event) {
  if (event.key === 'Escape' && !isSubmitting.value) emit('close')
}

watch(
  () => props.open,
  (value) => {
    document.body.style.overflow = value ? 'hidden' : ''
    if (value) {
      resetForm()
      window.addEventListener('keydown', onKeydown)
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  },
)

watch(
  () => props.notice,
  () => {
    if (props.open && props.mode === 'edit') resetForm()
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})

function onSubmit() {
  if (isSubmitting.value) return
  if (!form.value.title.trim()) {
    window.alert('제목을 입력해 주세요.')
    return
  }
  if (!form.value.department.trim()) {
    window.alert('담당부서를 입력해 주세요.')
    return
  }
  if (!form.value.content.trim()) {
    window.alert('본문 내용을 입력해 주세요.')
    return
  }
  emit('submit', {
    ...form.value,
    file: selectedFile.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12 sm:items-center sm:pt-4"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <button
        type="button"
        class="absolute inset-0"
        aria-label="닫기"
        :disabled="isSubmitting"
        @click="emit('close')"
      />

      <div class="relative z-10 w-full max-w-2xl border-2 border-[#0F2942] bg-white">
        <div class="flex items-center justify-between bg-[#0F2942] px-4 py-2.5 text-white">
          <h2 class="text-sm font-bold sm:text-base">{{ title }}</h2>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center border border-white/40 disabled:opacity-50"
            aria-label="닫기"
            :disabled="isSubmitting"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <form
          class="space-y-3 p-4 text-sm text-[#333333]"
          :aria-busy="isSubmitting"
          @submit.prevent="onSubmit"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block font-bold" for="form-type">카테고리/유형</label>
              <select
                id="form-type"
                v-model="form.type"
                class="w-full border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                :disabled="isSubmitting"
              >
                <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="mb-1 block font-bold" for="form-category">게시 분류</label>
              <select
                id="form-category"
                v-model="form.category"
                class="w-full border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                :disabled="isSubmitting"
              >
                <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block font-bold" for="form-title">제목</label>
            <input
              id="form-title"
              v-model="form.title"
              type="text"
              class="w-full border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              placeholder="게시물 제목"
              :disabled="isSubmitting"
            />
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block font-bold" for="form-dept">담당부서</label>
              <input
                id="form-dept"
                v-model="form.department"
                type="text"
                class="w-full border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                placeholder="예: 민원여권과"
                :disabled="isSubmitting"
              />
            </div>
            <div>
              <label class="mb-1 block font-bold" for="form-status">상태</label>
              <select
                id="form-status"
                v-model="form.status"
                class="w-full border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                :disabled="isSubmitting"
              >
                <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="mb-1 block font-bold" for="form-content">본문 내용</label>
            <textarea
              id="form-content"
              v-model="form.content"
              rows="8"
              class="w-full resize-y border border-slate-300 px-3 py-2 leading-relaxed disabled:bg-slate-100"
              placeholder="공지 본문을 입력하세요."
              :disabled="isSubmitting"
            />
          </div>

          <div>
            <label class="mb-1 block font-bold" for="form-file">첨부파일</label>
            <input
              :key="fileInputKey"
              id="form-file"
              type="file"
              accept=".pdf,.hwpx,.hwp,.doc,.docx"
              class="block w-full border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:border file:border-slate-400 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-bold disabled:bg-slate-100"
              :disabled="isSubmitting"
              @change="handleFileChange"
            />
            <p v-if="selectedFile" class="mt-1 text-xs text-slate-600">
              선택 파일: {{ selectedFile.name }}
            </p>
            <p v-else-if="isEdit && existingFileName" class="mt-1 text-xs text-slate-600">
              현재 첨부: {{ existingFileName }} (새 파일 선택 시 교체)
            </p>
            <p class="mt-1 text-xs text-slate-500">허용: pdf, hwpx, hwp, doc, docx</p>
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-300 pt-3">
            <button
              type="button"
              class="border border-slate-300 bg-white px-5 py-2 font-bold disabled:opacity-60"
              :disabled="isSubmitting"
              @click="emit('close')"
            >
              취소
            </button>
            <button
              type="submit"
              class="inline-flex items-center gap-2 border border-[#0F2942] bg-[#0F2942] px-5 py-2 font-bold text-white disabled:opacity-60"
              :disabled="isSubmitting"
            >
              <span
                v-if="isSubmitting"
                class="inline-block h-3.5 w-3.5 animate-spin border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
              {{ submitLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
