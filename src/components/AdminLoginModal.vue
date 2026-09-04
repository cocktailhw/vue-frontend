<script setup>
import { onUnmounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { usePortalStore } from '../stores/portal'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'success'])

const portalStore = usePortalStore()

const username = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')

function onKeydown(event) {
  if (event.key === 'Escape' && !submitting.value) emit('close')
}

watch(
  () => props.open,
  (value) => {
    document.body.style.overflow = value ? 'hidden' : ''
    if (value) {
      username.value = ''
      password.value = ''
      errorMessage.value = ''
      submitting.value = false
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

async function onSubmit() {
  const id = username.value.trim()
  const pw = password.value
  if (!id || !pw) {
    errorMessage.value = '아이디와 비밀번호를 입력해 주세요.'
    return
  }

  submitting.value = true
  errorMessage.value = ''
  try {
    // Real DB login — form values only (e.g. admin / admin1234!)
    await portalStore.loginAdmin(id, pw)

    if (!portalStore.isAdmin) {
      errorMessage.value = '관리자 권한이 없는 계정입니다.'
      await portalStore.logoutAdmin({ silent: true })
      return
    }

    emit('success')
    emit('close')
  } catch (error) {
    const status = error?.response?.status
    errorMessage.value =
      status === 401 || status === 403
        ? '아이디 또는 비밀번호가 일치하지 않습니다.'
        : '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="관리자 로그인"
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
          <h2 class="text-sm font-bold">관리자 로그인</h2>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center border border-white/40"
            aria-label="닫기"
            :disabled="submitting"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <form class="space-y-3 p-4 text-sm text-[#333333]" @submit.prevent="onSubmit">
          <p class="border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            관리자 계정으로 로그인하면 게시물 등록·수정·삭제가 가능합니다.
          </p>

          <div>
            <label class="mb-1 block font-bold" for="admin-username">아이디</label>
            <input
              id="admin-username"
              v-model="username"
              type="text"
              autocomplete="username"
              class="w-full border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              placeholder="관리자 아이디"
              :disabled="submitting"
            />
          </div>

          <div>
            <label class="mb-1 block font-bold" for="admin-password">비밀번호</label>
            <input
              id="admin-password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              class="w-full border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              placeholder="비밀번호"
              :disabled="submitting"
            />
          </div>

          <p v-if="errorMessage" class="text-xs font-semibold text-red-700">{{ errorMessage }}</p>

          <div class="flex justify-end gap-2 border-t border-slate-300 pt-3">
            <button
              type="button"
              class="border border-slate-300 bg-white px-5 py-2 font-bold disabled:opacity-60"
              :disabled="submitting"
              @click="emit('close')"
            >
              취소
            </button>
            <button
              type="submit"
              class="border border-[#0F2942] bg-[#0F2942] px-5 py-2 font-bold text-white disabled:opacity-60"
              :disabled="submitting"
            >
              {{ submitting ? '로그인 중…' : '로그인' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
