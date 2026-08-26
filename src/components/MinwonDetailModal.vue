<script setup>
import { onUnmounted, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
  item: {
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

function onApply() {
  window.alert(`[신청 완료] "${props.item?.title}" 인터넷 발급/신청이 접수되었습니다. (테스트)`)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && item"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      :aria-label="item.title"
    >
      <button type="button" class="absolute inset-0" aria-label="닫기" @click="emit('close')" />
      <div class="relative z-10 w-full max-w-lg border-2 border-[#0F2942] bg-white">
        <div class="flex items-center justify-between bg-[#0F2942] px-4 py-2.5 text-white">
          <h2 class="text-sm font-bold">민원 상세안내</h2>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center border border-white/40"
            aria-label="닫기"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <table class="w-full table-fixed border-collapse text-sm text-[#333333]">
          <tbody>
            <tr class="border-b border-slate-300">
              <th class="w-28 bg-slate-100 px-3 py-2.5 text-left font-bold">민원명</th>
              <td class="px-3 py-2.5 font-bold">{{ item.title }}</td>
            </tr>
            <tr class="border-b border-slate-300">
              <th class="bg-slate-100 px-3 py-2.5 text-left font-bold">처리기관</th>
              <td class="px-3 py-2.5">{{ item.agency }}</td>
            </tr>
            <tr class="border-b border-slate-300">
              <th class="bg-slate-100 px-3 py-2.5 text-left font-bold">수수료</th>
              <td class="px-3 py-2.5">{{ item.fee }}</td>
            </tr>
          </tbody>
        </table>

        <div class="border-b border-slate-300 px-4 py-3">
          <p class="mb-2 text-sm font-bold text-[#0F2942]">구비서류 목록</p>
          <ul class="list-disc space-y-1 pl-5 text-sm text-[#333333]">
            <li v-for="doc in item.documents" :key="doc">{{ doc }}</li>
          </ul>
        </div>

        <div class="flex justify-center gap-2 bg-slate-50 px-4 py-4">
          <button
            type="button"
            class="border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold"
            @click="emit('close')"
          >
            닫기
          </button>
          <button
            type="button"
            class="border border-[#0F2942] bg-[#0F2942] px-5 py-2.5 text-sm font-bold text-white"
            @click="onApply"
          >
            인터넷 발급 / 신청하기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
