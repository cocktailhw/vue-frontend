<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { usePortalStore } from '../stores/portal'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: {
    type: String,
    default: 'login', // login | signup
  },
})

const emit = defineEmits(['close'])

const portalStore = usePortalStore()

const activeTab = ref('login')
const username = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const title = computed(() =>
  activeTab.value === 'signup' ? '행복시청 회원가입' : '행복시청 로그인',
)

const submitLabel = computed(() => {
  if (submitting.value) {
    return activeTab.value === 'signup' ? '가입 중…' : '로그인 중…'
  }
  return activeTab.value === 'signup' ? '회원가입' : '로그인'
})

function resetForm({ keepInfo = false } = {}) {
  username.value = ''
  password.value = ''
  errorMessage.value = ''
  submitting.value = false
  if (!keepInfo) infoMessage.value = ''
}

function switchTab(tab) {
  if (activeTab.value === tab || submitting.value) return
  activeTab.value = tab
  errorMessage.value = ''
  infoMessage.value = ''
}

function onKeydown(event) {
  if (event.key === 'Escape' && !submitting.value) emit('close')
}

watch(
  () => props.open,
  (value) => {
    document.body.style.overflow = value ? 'hidden' : ''
    if (value) {
      activeTab.value = props.mode === 'signup' ? 'signup' : 'login'
      resetForm()
      window.addEventListener('keydown', onKeydown)
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  },
)

watch(
  () => props.mode,
  (mode) => {
    if (props.open) {
      activeTab.value = mode === 'signup' ? 'signup' : 'login'
      errorMessage.value = ''
    }
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})

async function onSubmit() {
  const id = username.value.trim()
  const pw = password.value

  if (!id || !pw) {
    errorMessage.value = '아이디와 비밀번호를 입력해 주세요.'
    return
  }

  submitting.value = true
  errorMessage.value = ''
  infoMessage.value = ''

  try {
    if (activeTab.value === 'signup') {
      await portalStore.signup(id, pw)
      resetForm({ keepInfo: true })
      activeTab.value = 'login'
      infoMessage.value = '회원가입이 완료되었습니다. 로그인해 주세요.'
      return
    }

    await portalStore.loginAdmin(id, pw)
    emit('close')
  } catch (error) {
    const status = error?.response?.status
    if (activeTab.value === 'signup' && status === 409) {
      errorMessage.value = '이미 사용 중인 아이디입니다.'
      return
    }
    errorMessage.value =
      activeTab.value === 'signup'
        ? '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.'
        : '로그인에 실패했습니다. 아이디/비밀번호를 확인해 주세요.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <button
        type="button"
        class="absolute inset-0"
        aria-label="닫기"
        :disabled="submitting"
        @click="emit('close')"
      />

      <div class="relative z-10 w-full max-w-md border-2 border-[#0F2942] bg-white">
        <div class="flex items-center justify-between bg-[#0F2942] px-4 py-2.5 text-white">
          <h2 class="text-sm font-bold">{{ title }}</h2>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center border border-white/40 disabled:opacity-50"
            aria-label="닫기"
            :disabled="submitting"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <div class="flex border-b border-slate-300" role="tablist" aria-label="인증 방식">
          <button
            type="button"
            role="tab"
            class="flex-1 py-2.5 text-sm font-bold transition-colors"
            :class="
              activeTab === 'login'
                ? 'border-b-2 border-[#0F2942] bg-white text-[#0F2942]'
                : 'bg-slate-50 text-slate-500 hover:text-[#0F2942]'
            "
            :aria-selected="activeTab === 'login'"
            :disabled="submitting"
            @click="switchTab('login')"
          >
            로그인
          </button>
          <button
            type="button"
            role="tab"
            class="flex-1 py-2.5 text-sm font-bold transition-colors"
            :class="
              activeTab === 'signup'
                ? 'border-b-2 border-[#0F2942] bg-white text-[#0F2942]'
                : 'bg-slate-50 text-slate-500 hover:text-[#0F2942]'
            "
            :aria-selected="activeTab === 'signup'"
            :disabled="submitting"
            @click="switchTab('signup')"
          >
            회원가입
          </button>
        </div>

        <form class="space-y-3 p-4 text-sm text-[#333333]" @submit.prevent="onSubmit">
          <p class="border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {{
              activeTab === 'signup'
                ? '아이디와 비밀번호를 입력해 계정을 등록합니다.'
                : '등록된 계정으로 로그인해 주세요.'
            }}
          </p>

          <div>
            <label class="mb-1 block font-bold" for="auth-username">아이디</label>
            <input
              id="auth-username"
              v-model="username"
              type="text"
              class="w-full border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              placeholder="아이디 입력"
              autocomplete="username"
              :disabled="submitting"
            />
          </div>

          <div>
            <label class="mb-1 block font-bold" for="auth-password">비밀번호</label>
            <input
              id="auth-password"
              v-model="password"
              type="password"
              class="w-full border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              placeholder="비밀번호 입력"
              :autocomplete="activeTab === 'signup' ? 'new-password' : 'current-password'"
              :disabled="submitting"
            />
          </div>

          <p v-if="infoMessage" class="text-xs font-semibold text-[#0F2942]">{{ infoMessage }}</p>
          <p v-if="errorMessage" class="text-xs font-semibold text-red-700">{{ errorMessage }}</p>

          <div class="flex gap-2 border-t border-slate-300 pt-3">
            <button
              type="button"
              class="flex-1 border border-slate-300 bg-white py-2.5 font-bold disabled:opacity-60"
              :disabled="submitting"
              @click="emit('close')"
            >
              취소
            </button>
            <button
              type="submit"
              class="flex-1 border border-[#0F2942] bg-[#0F2942] py-2.5 font-bold text-white disabled:opacity-60"
              :disabled="submitting"
            >
              {{ submitLabel }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
