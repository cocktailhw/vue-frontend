<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' }, // create | edit
  notice: { type: Object, default: null },
})

const emit = defineEmits(['close', 'submit'])

const typeOptions = [
  { value: 'NOTICE', label: 'NOTICE (공지)' },
  { value: 'RESERVATION', label: 'RESERVATION (예약)' },
  { value: 'COURSE', label: 'COURSE (강좌)' },
]

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

const isEdit = computed(() => props.mode === 'edit')
const title = computed(() => (isEdit.value ? '게시물 수정' : '게시물 신규 등록'))

function resetForm() {
  if (props.mode === 'edit' && props.notice) {
    form.value = {
      type: props.notice.type || 'NOTICE',
      category: props.notice.category || '공지사항',
      title: props.notice.title || '',
      department: props.notice.department || '',
      status: props.notice.status || '-',
      content: props.notice.content || '',
    }
  } else {
    form.value = {
      type: 'NOTICE',
      category: '공지사항',
      title: '',
      department: '',
      status: '-',
      content: '',
    }
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
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
  emit('submit', { ...form.value })
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
      <button type="button" class="absolute inset-0" aria-label="닫기" @click="emit('close')" />

      <div class="relative z-10 w-full max-w-2xl border-2 border-[#0F2942] bg-white">
        <div class="flex items-center justify-between bg-[#0F2942] px-4 py-2.5 text-white">
          <h2 class="text-sm font-bold sm:text-base">{{ title }}</h2>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center border border-white/40"
            aria-label="닫기"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <form class="space-y-3 p-4 text-sm text-[#333333]" @submit.prevent="onSubmit">
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block font-bold" for="form-type">카테고리/유형</label>
              <select
                id="form-type"
                v-model="form.type"
                class="w-full border border-slate-300 px-3 py-2"
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
                class="w-full border border-slate-300 px-3 py-2"
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
              class="w-full border border-slate-300 px-3 py-2"
              placeholder="게시물 제목"
            />
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block font-bold" for="form-dept">담당부서</label>
              <input
                id="form-dept"
                v-model="form.department"
                type="text"
                class="w-full border border-slate-300 px-3 py-2"
                placeholder="예: 민원여권과"
              />
            </div>
            <div>
              <label class="mb-1 block font-bold" for="form-status">상태</label>
              <select
                id="form-status"
                v-model="form.status"
                class="w-full border border-slate-300 px-3 py-2"
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
              class="w-full resize-y border border-slate-300 px-3 py-2 leading-relaxed"
              placeholder="공지 본문을 입력하세요."
            />
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-300 pt-3">
            <button
              type="button"
              class="border border-slate-300 bg-white px-5 py-2 font-bold"
              @click="emit('close')"
            >
              취소
            </button>
            <button
              type="submit"
              class="border border-[#0F2942] bg-[#0F2942] px-5 py-2 font-bold text-white"
            >
              {{ isEdit ? '수정 저장' : '등록' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
