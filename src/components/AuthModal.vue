<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: {
    type: String,
    default: 'login', // login | signup
  },
})

const emit = defineEmits(['close'])

const userId = ref('')
const password = ref('')
const name = ref('')

const title = computed(() =>
  props.mode === 'signup' ? '행복시청 회원가입' : '행복시청 로그인',
)

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (value) => {
    document.body.style.overflow = value ? 'hidden' : ''
    if (value) {
      userId.value = ''
      password.value = ''
      name.value = ''
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

function onSubmit() {
  if (!userId.value.trim() || !password.value.trim()) {
    window.alert('아이디와 비밀번호를 입력해 주세요.')
    return
  }
  if (props.mode === 'signup' && !name.value.trim()) {
    window.alert('이름을 입력해 주세요.')
    return
  }
  window.alert(
    props.mode === 'signup'
      ? '회원가입 신청이 접수되었습니다. (테스트)'
      : '로그인이 완료되었습니다. (테스트)',
  )
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <button type="button" class="absolute inset-0" aria-label="닫기" @click="emit('close')" />
      <div class="relative z-10 w-full max-w-md border-2 border-[#0F2942] bg-white">
        <div class="flex items-center justify-between bg-[#0F2942] px-4 py-2.5 text-white">
          <h2 class="text-sm font-bold">{{ title }}</h2>
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
          <p class="border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            ※ 본인확인이 필요한 공공서비스 로그인 화면입니다. (시스템 테스트용)
          </p>

          <div v-if="mode === 'signup'">
            <label class="mb-1 block font-bold" for="auth-name">이름</label>
            <input
              id="auth-name"
              v-model="name"
              type="text"
              class="w-full border border-slate-300 px-3 py-2"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label class="mb-1 block font-bold" for="auth-id">아이디</label>
            <input
              id="auth-id"
              v-model="userId"
              type="text"
              class="w-full border border-slate-300 px-3 py-2"
              placeholder="아이디 입력"
              autocomplete="username"
            />
          </div>

          <div>
            <label class="mb-1 block font-bold" for="auth-pw">비밀번호</label>
            <input
              id="auth-pw"
              v-model="password"
              type="password"
              class="w-full border border-slate-300 px-3 py-2"
              placeholder="비밀번호 입력"
              autocomplete="current-password"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button
              type="button"
              class="flex-1 border border-slate-300 bg-white py-2.5 font-bold"
              @click="emit('close')"
            >
              취소
            </button>
            <button
              type="submit"
              class="flex-1 border border-[#0F2942] bg-[#0F2942] py-2.5 font-bold text-white"
            >
              {{ mode === 'signup' ? '가입신청' : '로그인' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
