<script setup>
import { onUnmounted, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'select'])

const columns = [
  {
    title: '민원안내',
    items: ['주민등록표 등본', '전입신고', '인감증명', '지방세 납부', '건축물대장', '대관신청'],
  },
  {
    title: '시정소식',
    items: ['보도자료', '시정사진', '시장실 소식', '행사·축제 안내'],
  },
  {
    title: '정보공개',
    items: ['고시공고', '입찰공고', '사전정보공표', '정보공개청구'],
  },
  {
    title: '시청안내',
    items: ['조직도', '청사안내', '오시는 길', '부서 연락처', '시민참여'],
  },
]

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

function onSelect(columnTitle, item) {
  emit('select', { columnTitle, item })
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16 sm:items-center sm:pt-4"
      role="dialog"
      aria-modal="true"
      aria-label="사이트맵"
    >
      <button type="button" class="absolute inset-0" aria-label="닫기" @click="emit('close')" />
      <div class="relative z-10 w-full max-w-4xl border-2 border-[#0F2942] bg-white">
        <div class="flex items-center justify-between bg-[#0F2942] px-4 py-2.5 text-white">
          <h2 class="text-sm font-bold sm:text-base">행복시청 사이트맵</h2>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center border border-white/40"
            aria-label="닫기"
            @click="emit('close')"
          >
            <X :size="16" />
          </button>
        </div>

        <div class="grid gap-0 border-t border-slate-300 sm:grid-cols-2 lg:grid-cols-4">
          <section
            v-for="col in columns"
            :key="col.title"
            class="border-b border-r border-slate-300 p-4 last:border-r-0 sm:even:border-r-0 lg:even:border-r"
          >
            <h3 class="mb-2 border-b-2 border-[#0F2942] pb-1 text-sm font-bold text-[#0F2942]">
              {{ col.title }}
            </h3>
            <ul class="space-y-1 text-sm text-[#333333]">
              <li v-for="item in col.items" :key="item">
                <button
                  type="button"
                  class="w-full px-1 py-1 text-left hover:bg-slate-100 hover:underline"
                  @click="onSelect(col.title, item)"
                >
                  {{ item }}
                </button>
              </li>
            </ul>
          </section>
        </div>

        <div class="flex justify-center border-t border-slate-300 bg-slate-50 px-4 py-3">
          <button
            type="button"
            class="border border-[#0F2942] bg-[#0F2942] px-6 py-2 text-sm font-bold text-white"
            @click="emit('close')"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
